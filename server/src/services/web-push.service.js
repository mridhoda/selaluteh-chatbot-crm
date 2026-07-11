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
  return sendOrderPush({ workspaceId, outletId, order, type: 'order.created', title: 'Pesanan baru masuk' });
}

export async function sendOrderPaidPush({ workspaceId, outletId, order }) {
  return sendOrderPush({ workspaceId, outletId, order, type: 'order.paid', title: 'Pesanan sudah dibayar' });
}

async function sendOrderPush({ workspaceId, outletId, order, type, title }) {
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
      .in('role', ['owner', 'super', 'admin']);
    if (memberError) throw new AppError('PUSH_MEMBER_LOOKUP_FAILED', 'Failed to resolve workspace push recipients', 500, { detail: memberError.message }, memberError);

    const recipientIds = [...new Set([...(accessRows || []), ...(workspaceWideRows || [])].map((row) => row.user_id).filter(Boolean))];
    if (recipientIds.length === 0) return { sent: 0, skipped: true, reason: 'no_recipients' };
    query = query.in('user_id', recipientIds);
  }

  const { data: subscriptions, error } = await query;
  if (error) throw new AppError('PUSH_SUBSCRIPTION_LOOKUP_FAILED', 'Failed to load push subscriptions', 500, { detail: error.message }, error);

  const payload = JSON.stringify({
    type,
    title,
    body: buildOrderNotificationBody(order),
    url: '/app/kitchen',
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
      }, payload, { headers: { Urgency: 'high' } });
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

export async function sendTestWebPush({ workspaceId, userId }) {
  if (!configureWebPush()) return { sent: 0, skipped: true, reason: 'not_configured' };
  const client = getSupabaseServiceClient();
  const { data: subscriptions, error } = await client.from(TABLE)
    .select('id, endpoint, p256dh, auth')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) throw new AppError('PUSH_SUBSCRIPTION_LOOKUP_FAILED', 'Failed to load push subscriptions', 500, { detail: error.message }, error);
  if (!subscriptions?.length) return { sent: 0, skipped: true, reason: 'no_subscription' };

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      const res = await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ type: 'test', title: 'Notifikasi aktif', body: 'Test notification berhasil diterima.', url: '/settings' }),
        { headers: { Urgency: 'high' } },
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        sent += 1;
      } else {
        console.warn('[web-push] test push non-2xx:', res.statusCode);
      }
    } catch (err) {
      const statusCode = err.statusCode || err.status;
      if (statusCode === 404 || statusCode === 410) {
        await client.from(TABLE).update({ status: 'disabled' }).eq('id', sub.id);
        console.warn('[web-push] disabled stale subscription:', sub.id, statusCode);
      } else {
        console.error('[web-push] test push failed:', err.message, 'status:', statusCode);
      }
    }
  }
  return { sent, skipped: sent === 0, reason: sent === 0 ? 'delivery_failed' : null };
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
