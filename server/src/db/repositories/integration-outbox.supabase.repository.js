/**
 * integration-outbox.supabase.repository.js
 *
 * Durable outbox for pushing order lifecycle / fulfillment events to
 * TATA-POS's ingestion endpoint (Fase 4, TATA-POS repo's
 * specs/backlog/modul-online-store-ingestion/requirements.md R10). Nothing
 * calls `enqueue()` yet -- that hook-up (payment/fulfillment transition
 * points) is a separate, later change. This repository only implements the
 * storage/claim/ack primitives.
 */
import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractSingle, extractData } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'integration_outbox';

function mapOutboxRow(row) {
  return row ? mapRow(row) : null;
}

export const integrationOutboxRepository = {
  async enqueue({ workspaceId, orderId, eventType, payload }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        order_id: orderId,
        event_type: eventType,
        payload: payload || {},
        status: 'pending',
      })
      .select()
      .single();
    return mapOutboxRow(extractSingle(result, 'integrationOutbox.enqueue'));
  },

  /**
   * Claim up to `limit` due rows, oldest first (created_at asc -- important
   * for in-order delivery per order: a slow retry should not be able to
   * deliver a stale event after a newer one for the same order already
   * landed).
   *
   * No existing repository in this codebase does an atomic
   * "claim N rows" (jobs.supabase.repository.js's claimNext() claims a
   * single row via update+select in one call, and
   * telegram-webhook-events.supabase.repository.js's claimNext() claims a
   * single row via select-then-guarded-update). This mirrors the latter
   * pattern, batched: select the candidate ids ordered by created_at, then
   * flip them to 'sending' with a `.eq('status', 'pending')` guard on the
   * update so a concurrent claimer racing on the same ids only succeeds on
   * whichever rows are still 'pending' at the time its update runs.
   */
  async claimBatch({ limit = 20, now = new Date() } = {}) {
    const client = getSupabaseServiceClient();
    const nowIso = now.toISOString();

    const candidates = await client
      .from(TABLE)
      .select('*')
      .eq('status', 'pending')
      .lte('next_attempt_at', nowIso)
      .order('created_at', { ascending: true })
      .limit(limit);
    const rows = extractData(candidates, 'integrationOutbox.claimBatch.select') ?? [];
    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);
    const claimed = await client
      .from(TABLE)
      .update({ status: 'sending' })
      .in('id', ids)
      .eq('status', 'pending')
      .select('id');
    const claimedRows = extractData(claimed, 'integrationOutbox.claimBatch.update') ?? [];
    const claimedIds = new Set(claimedRows.map((row) => row.id));

    // Return the originally selected rows (already oldest-first), filtered
    // to only those this call actually won the claim on.
    return mapRows(rows.filter((row) => claimedIds.has(row.id)).map((row) => ({ ...row, status: 'sending' })));
  },

  async markDelivered({ id }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapOutboxRow(extractSingle(result, 'integrationOutbox.markDelivered'));
  },

  /**
   * Increment attempts; 'dead' once attempts reaches max_attempts, else back
   * to 'pending' with next_attempt_at pushed out by backoffMs.
   */
  async markFailed({ id, error, backoffMs = 0 }) {
    const client = getSupabaseServiceClient();
    const current = await client.from(TABLE).select('attempts, max_attempts').eq('id', id).maybeSingle();
    const row = extractSingle(current, 'integrationOutbox.markFailed.select');
    const nextAttempts = (row?.attempts ?? 0) + 1;
    const maxAttempts = row?.max_attempts ?? 8;
    const isDead = nextAttempts >= maxAttempts;

    const result = await client
      .from(TABLE)
      .update({
        attempts: nextAttempts,
        status: isDead ? 'dead' : 'pending',
        next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
        last_error: String(error?.message || error || '').slice(0, 2000),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapOutboxRow(extractSingle(result, 'integrationOutbox.markFailed.update'));
  },
};
