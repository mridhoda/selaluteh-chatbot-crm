/**
 * webhook-idempotency.service.js — Supabase-backed (task 24.16)
 *
 * Idempotency layer for inbound webhooks (Telegram, Meta, payment providers).
 * Migrated from Mongoose WebhookEvent model to webhookEventsSupabaseRepository.
 */

import crypto from 'crypto';
import { webhookEventsSupabaseRepository } from '../db/repositories/index.js';

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

  const existing = await webhookEventsSupabaseRepository.findByProviderPlatformEvent({
    provider,
    platformId,
    externalEventId,
  });
  if (existing) {
    const event = await webhookEventsSupabaseRepository.incrementAttempt(existing.id);
    return { event, duplicate: true };
  }

  try {
    const event = await webhookEventsSupabaseRepository.create({
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
    // Unique constraint violation (duplicate insert race)
    if (err?.code === '23505' || err?.code === 11000) {
      const event = await webhookEventsSupabaseRepository.findByProviderPlatformEvent({
        provider,
        platformId,
        externalEventId,
      });
      if (event) {
        const updated = await webhookEventsSupabaseRepository.incrementAttempt(event.id);
        return { updated, duplicate: true };
      }
    }
    throw err;
  }
}

export async function markWebhookProcessed(event) {
  const id = event?.id;
  if (!id) return null;
  return webhookEventsSupabaseRepository.markProcessed(id);
}

export async function markWebhookFailed(event, err) {
  const id = event?.id;
  if (!id) return null;
  return webhookEventsSupabaseRepository.markFailed(id, err?.message || String(err));
}
