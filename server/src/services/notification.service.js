/**
 * notification.service.js — Task 17.2
 *
 * Notification orchestration layer.
 * Handles channel-specific adapters, idempotency, and delivery tracking.
 */

import { tgSendSplit } from '../integrations/telegram/telegram-client.js';
import { getSupabaseServiceClient } from '../db/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const NOTIFICATION_TYPES = {
  PAYMENT_LINK: 'payment_link',
  PAYMENT_PAID: 'payment_paid',
  ORDER_READY: 'order_ready',
  ORDER_CANCELLED: 'order_cancelled',
  CONTACT_WELCOME: 'contact_welcome',
  OUTLET_SELECTION: 'outlet_selection',
  PRODUCT_CATALOG: 'product_catalog',
  CART_SUMMARY: 'cart_summary',
};

export const NOTIFICATION_CHANNELS = {
  TELEGRAM: 'telegram',
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
};

export const IDENTITY_TYPES = {
  PAYMENT: 'payment',
  ORDER: 'order',
  CONTACT: 'contact',
  OUTLET: 'outlet',
  CART: 'cart',
};

export function buildNotificationIdempotencyKey(type, identityType, identityId, channel) {
  return `notify:${type}:${identityType}:${identityId}:${channel}`;
}

export function isValidNotificationType(type) {
  return Object.values(NOTIFICATION_TYPES).includes(type);
}

export function isValidNotificationChannel(channel) {
  return Object.values(NOTIFICATION_CHANNELS).includes(channel);
}

export function buildNotificationTemplate(template, variables = {}) {
  let message = template || '';
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(value ?? ''));
  }
  return message.replace(/{[^{}]+}/g, '');
}

export async function deliverNotificationMessage({ channel, message, recipientId, priority = 'normal' }) {
  if (!isValidNotificationChannel(channel)) {
    throw new AppError('INVALID_CHANNEL', `Invalid notification channel: ${channel}`, 400);
  }
  return deliverMessage({ channel, message, recipientId, priority });
}

export async function sendNotification({
  workspaceId,
  contactId,
  outletId,
  type,
  template,
  variables = {},
  channel = NOTIFICATION_CHANNELS.TELEGRAM,
  idempotencyKey = null,
  priority = 'normal',
}) {
  if (!isValidNotificationType(type)) {
    throw new AppError('INVALID_NOTIFICATION_TYPE', `Invalid notification type: ${type}`, 400);
  }

  if (!isValidNotificationChannel(channel)) {
    throw new AppError('INVALID_CHANNEL', `Invalid notification channel: ${channel}`, 400);
  }

  if (idempotencyKey) {
    const existing = await checkIdempotentNotification({ workspaceId, idempotencyKey });
    if (existing) {
      console.log(`[Notification] Idempotent notification skipped: ${idempotencyKey}`);
      return { skipped: true, messageId: existing.message_id };
    }
  }

  const message = buildNotificationTemplate(template, variables);
  const result = await deliverNotificationMessage({ channel, message, recipientId: variables.recipientId || contactId, priority });

  if (result.success) {
    await recordNotificationDelivery({
      workspaceId,
      idempotencyKey,
      type,
      channel,
      contactId,
      outletId,
      messageId: result.messageId,
      template,
      variables,
      priority,
    });
  }

  return result;
}

export async function sendTelegramNotification({
  workspaceId,
  contactId,
  outletId,
  type,
  template,
  variables = {},
  idempotencyKey = null,
  priority = 'normal',
}) {
  return sendNotification({
    workspaceId,
    contactId,
    outletId,
    type,
    template,
    variables,
    channel: NOTIFICATION_CHANNELS.TELEGRAM,
    idempotencyKey,
    priority,
  });
}

export async function enqueueNotification({
  workspaceId,
  contactId = null,
  outletId = null,
  type,
  template,
  variables = {},
  channel = NOTIFICATION_CHANNELS.TELEGRAM,
  idempotencyKey = null,
  priority = 'normal',
}) {
  if (!isValidNotificationType(type)) {
    throw new AppError('INVALID_NOTIFICATION_TYPE', `Invalid notification type: ${type}`, 400);
  }
  if (!isValidNotificationChannel(channel)) {
    throw new AppError('INVALID_CHANNEL', `Invalid notification channel: ${channel}`, 400);
  }

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from('notification_deliveries')
    .insert({
      workspace_id: workspaceId,
      idempotency_key: idempotencyKey,
      notification_type: type,
      channel,
      contact_id: contactId,
      outlet_id: outletId,
      template,
      variables,
      priority,
      status: 'pending',
    })
    .select()
    .single();

  if (error?.code === '23505') return { skipped: true, idempotencyKey };
  if (error) throw new AppError('NOTIFICATION_QUEUE_ERROR', 'Failed to queue notification', 500, { detail: error.message }, error);
  return data;
}

export async function sendWhatsAppNotification({
  workspaceId,
  contactId,
  outletId,
  type,
  template,
  variables = {},
  idempotencyKey = null,
  priority = 'normal',
}) {
  return sendNotification({
    workspaceId,
    contactId,
    outletId,
    type,
    template,
    variables,
    channel: NOTIFICATION_CHANNELS.WHATSAPP,
    idempotencyKey,
    priority,
  });
}

async function deliverMessage({ channel, message, contactId, recipientId, priority }) {
  if (channel === NOTIFICATION_CHANNELS.TELEGRAM) {
    return await deliverTelegramMessage(message, recipientId || contactId, priority);
  }
  if (channel === NOTIFICATION_CHANNELS.WHATSAPP) {
    return await deliverWhatsAppMessage(message, recipientId || contactId, priority);
  }
  if (channel === NOTIFICATION_CHANNELS.INSTAGRAM) {
    return await deliverInstagramMessage(message, contactId, priority);
  }
  throw new AppError('NOT_IMPLEMENTED', `Channel ${channel} not yet implemented`, 501);
}

async function deliverTelegramMessage(message, contactId, priority) {
  if (!env.telegramBotToken) {
    throw new AppError('TELEGRAM_NOT_CONFIGURED', 'Telegram bot token is not configured', 500);
  }
  const result = await tgSendSplit(env.telegramBotToken, contactId, message, null, { priority });
  return { success: true, messageId: result?.message_id || null, channel: 'telegram' };
}

async function deliverWhatsAppMessage(message, contactId, priority) {
  throw new AppError('WHATSAPP_NOT_IMPLEMENTED', 'WhatsApp notification delivery is not implemented yet', 501, {
    contactId,
    priority,
  });
}

async function deliverInstagramMessage(message, contactId, priority) {
  throw new AppError('INSTAGRAM_NOT_IMPLEMENTED', 'Instagram notification delivery is not implemented yet', 501, {
    contactId,
    priority,
  });
}

async function checkIdempotentNotification({ workspaceId, idempotencyKey }) {
  if (!idempotencyKey) return null;
  const client = getSupabaseServiceClient();
  const result = await client
    .from('notification_deliveries')
    .select('message_id, created_at')
    .eq('workspace_id', workspaceId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  return result.data;
}

async function recordNotificationDelivery({
  workspaceId,
  idempotencyKey,
  type,
  channel,
  contactId,
  outletId,
  messageId,
  template,
  variables,
  priority,
}) {
  const client = getSupabaseServiceClient();
  await client.from('notification_deliveries').insert({
    workspace_id: workspaceId,
    idempotency_key: idempotencyKey,
    notification_type: type,
    channel,
    contact_id: contactId,
    outlet_id: outletId,
    message_id: messageId,
    template,
    variables,
    priority,
    status: 'delivered',
    delivered_at: new Date().toISOString(),
  });
}
