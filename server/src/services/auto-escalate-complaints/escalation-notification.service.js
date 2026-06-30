/**
 * auto-escalate-complaints/escalation-notification.service.js
 * Spec: auto-escalate-complaints — Task Section 14
 *
 * Sends notifications to the escalation recipient supervisor via:
 *   1. Web Push (browser notification, if VAPID configured + active subscription)
 *   2. Telegram (if supervisor has a linked Telegram contact in workspace)
 *   3. WhatsApp (if supervisor has a linked WA contact AND workspace has active WA platform)
 *
 * RULES (AEC-R28, AEC-R29):
 *   - Notification is sent to SUPERVISOR, not to the customer.
 *   - Message text is internal — safe summary only (no customer PII beyond subject).
 *   - Notification failure must NOT block escalation creation (all channels are fail-safe).
 */

import webpush from 'web-push';
import { env } from '../../config/env.js';
import { getSupabaseServiceClient } from '../../db/supabase.js';
import { membershipsSupabaseRepository } from '../../db/repositories/memberships.repository.js';

// ─── Web push config (lazy init) ──────────────────────────────────────────────

let webPushConfigured = false;

function ensureWebPush() {
  if (webPushConfigured) return true;
  if (!env.webPushVapidPublicKey || !env.webPushVapidPrivateKey) return false;
  webpush.setVapidDetails(
    env.webPushSubject || 'mailto:admin@selaluteh.com',
    env.webPushVapidPublicKey,
    env.webPushVapidPrivateKey
  );
  webPushConfigured = true;
  return true;
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

/**
 * Notify the escalation supervisor via all available channels (in parallel).
 * Fail-safe: errors are logged but never rethrown.
 *
 * Channels:
 *   1. Web Push    — always attempted if VAPID configured
 *   2. Telegram    — if supervisor has a telegram contact in this workspace
 *   3. WhatsApp    — if supervisor has a whatsapp contact AND workspace has active WA platform
 *
 * @param {{
 *   workspaceId: string,
 *   outletId: string,
 *   escalation: object,
 *   complaint: { subject?: string, priority?: string, id: string },
 *   supervisorUserId: string|null,
 * }} param
 */
export async function notifyEscalationSupervisor({ workspaceId, outletId, escalation, complaint, supervisorUserId, supervisorMembershipId }) {
  if (!supervisorUserId) {
    console.warn('[escalation-notif] No supervisorUserId — skipping notification');
    return;
  }

  // ── Resolve which channels this supervisor wants to receive notifications on
  // null = all channels (default / no preference set)
  let allowedChannels = null;
  if (supervisorMembershipId) {
    allowedChannels = await membershipsSupabaseRepository.getNotificationChannels({
      membershipId: supervisorMembershipId,
    }).catch(() => null);
  }

  // Helper: check if a given channel is allowed
  const canSend = (channel) => !allowedChannels || allowedChannels.includes(channel);

  const message = buildEscalationNotificationText({ escalation, complaint });
  const escalationUrl = `/complaints/${complaint.id}?escalation=${escalation.id}`;

  const tasks = [
    // Web Push is always attempted — it's a browser notification, opt-in via browser consent.
    // We don't gate it on notification_channels because web_push is controlled at the browser level.
    sendWebPushToSupervisor({ workspaceId, outletId, supervisorUserId, escalation, complaint, escalationUrl }),
  ];

  if (canSend('telegram')) {
    tasks.push(sendTelegramToSupervisor({ workspaceId, supervisorUserId, message }));
  }
  if (canSend('whatsapp')) {
    tasks.push(sendWhatsAppToSupervisor({ workspaceId, outletId, supervisorUserId, message }));
  }

  const results = await Promise.allSettled(tasks);

  for (const r of results) {
    if (r.status === 'rejected') {
      console.error('[escalation-notif] Channel delivery failed:', r.reason?.message);
    }
  }
}

// ─── Web Push ─────────────────────────────────────────────────────────────────

async function sendWebPushToSupervisor({ workspaceId, outletId, supervisorUserId, escalation, complaint, escalationUrl }) {
  if (!ensureWebPush()) {
    console.warn('[escalation-notif] Web Push not configured — skipping');
    return;
  }

  const client = getSupabaseServiceClient();
  const { data: subscriptions } = await client
    .from('web_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('workspace_id', workspaceId)
    .eq('user_id', supervisorUserId)
    .eq('status', 'active');

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({
    type: 'complaint.escalation',
    title: '⚠️ Eskalasi Keluhan',
    body: buildEscalationPushBody({ complaint }),
    url: escalationUrl,
    escalationId: escalation.id,
    complaintId: complaint.id,
    workspaceId,
    outletId,
    createdAt: new Date().toISOString(),
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err) {
      const status = err.statusCode || err.status;
      if (status === 404 || status === 410) {
        // Subscription expired — disable it
        await client.from('web_push_subscriptions').update({ status: 'disabled' }).eq('id', sub.id);
      } else {
        console.error('[escalation-notif] web-push send error:', err.message);
      }
    }
  }
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegramToSupervisor({ workspaceId, supervisorUserId, message }) {
  const client = getSupabaseServiceClient();

  // Find active Telegram platform in this workspace
  const { data: platforms } = await client
    .from('platforms')
    .select('id, token_encrypted')
    .eq('workspace_id', workspaceId)
    .eq('type', 'telegram')
    .eq('enabled', true)
    .limit(1);

  if (!platforms || platforms.length === 0) return;

  const { decrypt } = await import('../../utils/encryption.js');
  const token = platforms[0].token_encrypted ? decrypt(platforms[0].token_encrypted) : null;
  if (!token) return;

  // Resolve supervisor's Telegram chat_id
  const tgChatId = await findSupervisorContactId({ client, workspaceId, supervisorUserId, platform: 'telegram' });
  if (!tgChatId) {
    console.warn('[escalation-notif] No Telegram chat_id for supervisor', supervisorUserId);
    return;
  }

  const { tgSend } = await import('../sender.js');
  await tgSend(token, tgChatId, message);
  console.log('[escalation-notif] Telegram sent to supervisor', supervisorUserId);
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/**
 * Sends WA notification to supervisor.
 *
 * Requirements:
 *   - Workspace must have at least one active WA platform with a decryptable token + phone_number_id.
 *   - Supervisor must have a contacts entry with platform='whatsapp' and external_id set
 *     to their WA phone number in international format (e.g. "628123456789").
 *
 * Contact resolution order:
 *   1. contacts.user_id = supervisorUserId
 *   2. contacts.email  = users.email  (fallback)
 *   3. contacts.phone  = users.phone  (fallback)
 *
 * Uses the same waSend pattern as ai.service.js.
 */
async function sendWhatsAppToSupervisor({ workspaceId, outletId, supervisorUserId, message }) {
  const client = getSupabaseServiceClient();

  // Find active WA platform for this workspace
  const { data: platforms } = await client
    .from('platforms')
    .select('id, token_encrypted, phone_number_id')
    .eq('workspace_id', workspaceId)
    .eq('type', 'whatsapp')
    .eq('enabled', true)
    .limit(1);

  if (!platforms || platforms.length === 0) return; // No WA platform — silently skip

  const { decrypt } = await import('../../utils/encryption.js');
  const token = platforms[0].token_encrypted ? decrypt(platforms[0].token_encrypted) : null;
  const phoneNumberId = platforms[0].phone_number_id;

  if (!token || !phoneNumberId) {
    console.warn('[escalation-notif] WA platform missing token/phoneNumberId — skipping');
    return;
  }

  // Resolve supervisor WA phone number from outlet directly first
  let waNumber = null;
  if (outletId) {
    const { data: outlet } = await client
      .from('outlets')
      .select('phone, metadata')
      .eq('workspace_id', workspaceId)
      .eq('id', outletId)
      .maybeSingle();
    
    const rawPhone = outlet?.metadata?.managerPhone || outlet?.phone;
    if (rawPhone) {
      let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
      }
      if (cleaned.length >= 10) {
        waNumber = cleaned;
        console.log(`[escalation-notif] Resolved WhatsApp number ${waNumber} directly from outlet metadata/phone.`);
      }
    }
  }

  // Fallback to supervisor user profile mapping if outlet phone not resolved
  if (!waNumber && supervisorUserId) {
    waNumber = await findSupervisorContactId({ client, workspaceId, supervisorUserId, platform: 'whatsapp' });
  }

  if (!waNumber) {
    // No WA contact resolved — silently skip
    console.warn('[escalation-notif] No supervisor WA contact resolved');
    return;
  }

  const { waSend } = await import('../sender.js');
  await waSend(token, phoneNumberId, waNumber, message);
  console.log('[escalation-notif] WhatsApp sent to supervisor', supervisorUserId || 'direct_outlet_manager', waNumber);

  // ── Record the outbound message in the supervisor's CRM chat history ──
  try {
    const { recordOutboundMessage } = await import('../chat-message.service.js');
    const { data: contact } = await client
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('external_id', waNumber)
      .maybeSingle();

    if (contact) {
      const { data: chat } = await client
        .from('chats')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('contact_id', contact.id)
        .maybeSingle();

      if (chat) {
        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId,
          from: 'ai',
          text: message,
        });
        console.log(`[escalation-notif] Outbound message successfully recorded in CRM Chat ID: ${chat.id}`);
      } else {
        console.warn(`[escalation-notif] No active chat found for contact ID ${contact.id}`);
      }
    } else {
      console.warn(`[escalation-notif] No contact found matching external_id: ${waNumber}`);
    }
  } catch (err) {
    console.error('[escalation-notif] Failed to record outbound message in CRM chat history:', err.message);
  }
}

// ─── Contact resolver ─────────────────────────────────────────────────────────

/**
 * Resolves a supervisor's platform-specific contact identifier.
 *
 * platform='telegram' → returns contacts.telegram_chat_id || contacts.external_id
 * platform='whatsapp' → returns contacts.external_id (expected: WA phone, e.g. "628123456789")
 *
 * Tries three strategies:
 *   1. Direct: contacts.user_id = supervisorUserId
 *   2. Email match: users.email → contacts.email
 *   3. Phone match: users.phone → contacts.phone
 */
async function findSupervisorContactId({ client, workspaceId, supervisorUserId, platform }) {
  const selector = 'external_id, telegram_chat_id';

  function extractId(row) {
    if (!row) return null;
    return platform === 'telegram'
      ? (row.telegram_chat_id || row.external_id)
      : row.external_id;
  }

  // Strategy 1: direct user_id link
  const { data: direct } = await client
    .from('contacts')
    .select(selector)
    .eq('workspace_id', workspaceId)
    .eq('platform', platform)
    .eq('user_id', supervisorUserId)
    .maybeSingle();

  if (direct) return extractId(direct);

  // Strategy 2 & 3: resolve via user profile
  const { data: user } = await client
    .from('users')
    .select('email, phone')
    .eq('id', supervisorUserId)
    .maybeSingle();

  if (!user) return null;

  if (user.email) {
    const { data: byEmail } = await client
      .from('contacts')
      .select(selector)
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .eq('email', user.email)
      .maybeSingle();
    if (byEmail) return extractId(byEmail);
  }

  if (user.phone) {
    const { data: byPhone } = await client
      .from('contacts')
      .select(selector)
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .eq('phone', user.phone)
      .maybeSingle();
    if (byPhone) return extractId(byPhone);
  }

  return null;
}

// ─── Message builders ─────────────────────────────────────────────────────────

/**
 * Telegram/WhatsApp message text — internal summary only.
 * No customer PII beyond the complaint subject.
 */
function buildEscalationNotificationText({ escalation, complaint }) {
  const priority = (complaint.priority || 'medium').toUpperCase();
  const subject = complaint.subject || 'Keluhan pelanggan';
  const triggerType = escalation.triggerType || escalation.trigger_type || 'AUTO';

  return [
    `⚠️ *ESKALASI KELUHAN*`,
    ``,
    `📋 *Keluhan:* ${subject}`,
    `🔴 *Prioritas:* ${priority}`,
    `🔔 *Trigger:* ${formatTriggerType(triggerType)}`,
    `🆔 *ID:* \`${escalation.id?.slice(0, 8)}...\``,
    ``,
    `Buka dashboard untuk melihat detail dan menangani keluhan ini.`,
  ].join('\n');
}

function buildEscalationPushBody({ complaint }) {
  const priority = (complaint.priority || 'medium').toUpperCase();
  const subject = (complaint.subject || 'Keluhan pelanggan').slice(0, 60);
  return `${subject} [${priority}]`;
}

function formatTriggerType(type = '') {
  const map = {
    AUTO_PRIORITY: 'Prioritas Tinggi',
    AUTO_UNASSIGNED: 'Tidak Ada Penanganan',
    AUTO_SLA: 'SLA Mendekati Batas',
    AUTO_CATEGORY: 'Kategori Khusus',
    MANUAL: 'Eskalasi Manual',
    RE_ESCALATION: 'Re-eskalasi',
  };
  return map[type] || type;
}
