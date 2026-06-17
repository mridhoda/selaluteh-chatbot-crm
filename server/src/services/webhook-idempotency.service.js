import crypto from 'crypto';
import { webhookEventsRepository } from '../db/repositories/webhook-events.repository.js';

export function hashPayload(payload = {}) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function getTelegramEventId(update = {}) {
  if (update.update_id !== undefined) return `update:${update.update_id}`;
  const message = update.message || update.edited_message || update.callback_query?.message;
  if (message?.message_id) return `message:${message.chat?.id || 'unknown'}:${message.message_id}`;
  if (update.callback_query?.id) return `callback:${update.callback_query.id}`;
  return `payload:${hashPayload(update)}`;
}

export function getMetaMessageEventId(message = {}, fallback = {}) {
  if (message.id) return `message:${message.id}`;
  if (message.mid) return `message:${message.mid}`;
  const sender = fallback.senderId || message.from || 'unknown_sender';
  const timestamp = message.timestamp || fallback.timestamp || Date.now();
  return `message:${sender}:${timestamp}:${hashPayload(message).slice(0, 12)}`;
}

export function getPaymentEventId(provider, payload = {}) {
  return String(
    payload.id ||
    payload.event_id ||
    payload.transaction_id ||
    payload.order_id ||
    payload.external_id ||
    `${provider}:${hashPayload(payload)}`,
  );
}

export async function beginWebhookEvent({
  provider,
  eventType = 'unknown',
  externalEventId,
  workspaceId = null,
  platformId = null,
  payload = {},
  signatureValid = null,
}) {
  const payloadHash = hashPayload(payload);

  const existing = await webhookEventsRepository.findByProviderPlatformEvent({ provider, platformId, externalEventId });
  if (existing) {
    const event = await webhookEventsRepository.incrementAttempt(existing._id);

    return { event, duplicate: true };
  }

  try {
    const event = await webhookEventsRepository.create({
      provider,
      eventType,
      externalEventId,
      workspaceId,
      platformId,
      payloadHash,
      payload,
      signatureValid,
      status: 'processing',
    });
    return { event, duplicate: false };
  } catch (err) {
    if (err?.code !== 11000) throw err;

    const event = await webhookEventsRepository.incrementAttemptByKey({ provider, platformId, externalEventId });

    return { event, duplicate: true };
  }
}

export async function markWebhookProcessed(event) {
  if (!event?._id) return null;
  return webhookEventsRepository.markProcessed(event._id);
}

export async function markWebhookFailed(event, err) {
  if (!event?._id) return null;
  return webhookEventsRepository.markFailed(event._id, err?.message || String(err));
}
