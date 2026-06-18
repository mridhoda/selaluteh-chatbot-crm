/**
 * webhook-events.supabase.repository.js — Supabase-backed (task 24.16)
 *
 * Replaces Mongoose WebhookEvent model.
 * DB table: webhook_events
 *
 * Webhook idempotency: unique external_event_id per provider+platform_id.
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle } from '../supabase-errors.js';

const TABLE = 'webhook_events';

export const webhookEventsSupabaseRepository = {
  async create(data) {
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId || null,
      platform_id: data.platformId || null,
      provider: data.provider,
      event_type: data.eventType || data.event_type || '',
      external_event_id: data.externalEventId || data.external_event_id || '',
      status: data.status || 'received',
      payload_hash: data.payloadHash || null,
      payload: data.payload || {},
      signature_valid: data.signatureValid ?? null,
      attempt_count: 1,
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'webhookEvents.create'));
  },

  async findByProviderPlatformEvent({ provider, platformId, externalEventId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('provider', provider)
      .eq('platform_id', platformId)
      .eq('external_event_id', externalEventId)
      .maybeSingle();
    const row = extractSingle(result, 'webhookEvents.findByProviderPlatformEvent');
    return row ? mapRow(row) : null;
  },

  async incrementAttempt(id) {
    const client = getSupabaseServiceClient();
    // Read-then-write (no $inc in Supabase JS client)
    const { data: current } = await client.from(TABLE).select('attempt_count').eq('id', id).single();
    const newCount = (current?.attempt_count ?? 0) + 1;
    const result = await client
      .from(TABLE)
      .update({ attempt_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'webhookEvents.incrementAttempt');
    return row ? mapRow(row) : null;
  },

  async incrementAttemptByKey({ provider, platformId, externalEventId }) {
    const existing = await this.findByProviderPlatformEvent({ provider, platformId, externalEventId });
    if (!existing) return null;
    return this.incrementAttempt(existing.id);
  },

  async markProcessed(id) {
    const client = getSupabaseServiceClient();
    await client.from(TABLE).update({ status: 'processed', processed_at: new Date().toISOString(), error: null }).eq('id', id);
  },

  async markFailed(id, error) {
    const client = getSupabaseServiceClient();
    await client.from(TABLE).update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      error: typeof error === 'string' ? error : error?.message || String(error),
    }).eq('id', id);
  },
};
