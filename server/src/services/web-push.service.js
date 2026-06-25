import webpush from 'web-push';
import { env } from '../config/env.js';
import { getSupabaseServiceClient } from '../db/supabase.js';
import { AppError } from '../utils/errors.js';

const TABLE = 'web_push_subscriptions';

let configured = false;

function configureWebPush() {
  if (configured) return true;
  if (!env.webPushVapidPublicKey || !env.webPushVapidPrivateKey) return false;
  webpush.setVapidDetails(
    env.webPushSubject,
    env.webPushVapidPublicKey,
    env.webPushVapidPrivateKey,
  );
  configured = true;
  return true;
}

export function getWebPushPublicConfig() {
  return {
    enabled: Boolean(env.webPushVapidPublicKey && env.webPushVapidPrivateKey),
    publicKey: env.webPushVapidPublicKey || '',
  };
}

export async function saveWebPushSubscription({ workspaceId, userId, subscription, userAgent }) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new AppError('INVALID_PUSH_SUBSCRIPTION', 'Invalid push subscription payload', 400);
  }

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from(TABLE)
    .upsert({
      workspace_id: workspaceId,
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent || null,
      status: 'active',
    }, { onConflict: 'endpoint' })
    .select()
    .single();

  if (error) throw new AppError('PUSH_SUBSCRIPTION_SAVE_FAILED', 'Failed to save push subscription', 500, { detail: error.message }, error);
  return data;
}

export async function disableWebPushSubscription({ endpoint, userId }) {
  if (!endpoint) throw new AppError('VALIDATION', 'endpoint is required', 400);

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from(TABLE)
    .update({ status: 'disabled' })
    .eq('endpoint', endpoint)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw new AppError('PUSH_SUBSCRIPTION_DISABLE_FAILED', 'Failed to disable push subscription', 500, { detail: error.message }, error);
  return data;
}

export async function sendOrderCreatedPush({ workspaceId, outletId, order }) {
  if (!configureWebPush()) {
    console.warn('[web-push] WEB_PUSH_VAPID_PUBLIC_KEY/PRIVATE_KEY not configured; skipping order notification');
    return { sent: 0, skipped: true, reason: 'not_configured' };
  }

  const client = getSupabaseServiceClient();
  let query = client
    .from(TABLE)
    .select('id, endpoint, p256dh, auth')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  if (outletId) {
    const { data: accessRows, error: accessError } = await client
      .from('user_outlet_access')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId)
      .eq('status', 'active');
    if (accessError) throw new AppError('PUSH_ACCESS_LOOKUP_FAILED', 'Failed to resolve outlet push recipients', 500, { detail: accessError.message }, accessError);

    const { data: workspaceWideRows, error: memberError } = await client
      .from('user_workspace_memberships')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .in('role', ['owner', 'admin']);
    if (memberError) throw new AppError('PUSH_MEMBER_LOOKUP_FAILED', 'Failed to resolve workspace push recipients', 500, { detail: memberError.message }, memberError);

    const recipientIds = [...new Set([...(accessRows || []), ...(workspaceWideRows || [])].map((row) => row.user_id).filter(Boolean))];
    if (recipientIds.length === 0) return { sent: 0, skipped: true, reason: 'no_recipients' };
    query = query.in('user_id', recipientIds);
  }

  const { data: subscriptions, error } = await query;
  if (error) throw new AppError('PUSH_SUBSCRIPTION_LOOKUP_FAILED', 'Failed to load push subscriptions', 500, { detail: error.message }, error);

  const payload = JSON.stringify({
    type: 'order.created',
    title: 'Pesanan baru masuk',
    body: buildOrderNotificationBody(order),
    url: '/orders',
    orderId: order?.id,
    orderNumber: order?.orderNumber,
    workspaceId,
    outletId,
    createdAt: new Date().toISOString(),
  });

  let sent = 0;
  for (const sub of subscriptions || []) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, payload);
      sent += 1;
    } catch (err) {
      const statusCode = err.statusCode || err.status;
      if (statusCode === 404 || statusCode === 410) {
        await client.from(TABLE).update({ status: 'disabled' }).eq('id', sub.id);
      } else {
        console.error('[web-push] send failed:', err.message);
      }
    }
  }

  return { sent };
}

function buildOrderNotificationBody(order = {}) {
  const number = order.orderNumber || order.order_number || order.id || 'baru';
  const customer = order.customerNameSnapshot || order.customer_name_snapshot || order.customerSnapshot?.name || order.customerSnapshot?.contactName || 'Customer';
  const outlet = order.outletNameSnapshot || order.outlet_name_snapshot || order.fulfillmentSnapshot?.outletName || '';
  const total = order.totalAmount ?? order.total_amount ?? order.totals?.total;
  const totalText = Number.isFinite(Number(total)) && Number(total) > 0
    ? ` - Rp ${Number(total).toLocaleString('id-ID')}`
    : '';
  return `${number} dari ${customer}${outlet ? ` (${outlet})` : ''}${totalText}`;
}
