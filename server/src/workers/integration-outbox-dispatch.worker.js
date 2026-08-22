/**
 * integration-outbox-dispatch.worker.js
 *
 * Drains integration_outbox, sending each row to TATA-POS via
 * tata-pos-client.js and marking it delivered/failed. Mirrors
 * payment-reconciliation.worker.js's shape (setInterval, `.unref()`,
 * `start(intervalMs)` export).
 *
 * NOT registered in server/src/index.js yet -- nothing enqueues into
 * integration_outbox yet either, so starting this worker now would just
 * poll an empty table. Wiring it into bootstrap happens alongside the
 * enqueue hooks (separate, later change) so both land together for review.
 */
import { integrationOutboxRepository } from '../db/repositories/integration-outbox.supabase.repository.js';
import { sendIntegrationEvent } from '../integrations/tata-pos/tata-pos-client.js';
import { computeWorkerBackoffMs } from './job-contract.js';

const DISPATCH_INTERVAL_MS = 60_000;
// Matches payment-reconciliation.worker.js's own per-cycle batch size --
// conservative default so a TATA-POS outage doesn't turn the next tick,
// once it recovers, into a retry-storm against it.
const BATCH_LIMIT = 20;

/**
 * One dispatch cycle: claim a batch, send each row, ack/backoff per row.
 * A single row's failure never stops the rest of the batch.
 */
export async function dispatchOnce(limit = BATCH_LIMIT) {
  const rows = await integrationOutboxRepository.claimBatch({ limit });
  let delivered = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await sendIntegrationEvent(row.payload);
      await integrationOutboxRepository.markDelivered({ id: row.id });
      delivered++;
    } catch (err) {
      const backoffMs = computeWorkerBackoffMs((row.attempts ?? 0) + 1);
      try {
        await integrationOutboxRepository.markFailed({ id: row.id, error: err, backoffMs });
      } catch (markErr) {
        console.error(`[IntegrationOutboxDispatch] Row ${row.id}: failed to record failure: ${markErr.message}`);
      }
      console.error(`[IntegrationOutboxDispatch] Row ${row.id} (${row.eventType}) delivery failed: ${err.message}`);
      failed++;
    }
  }

  return { claimed: rows.length, delivered, failed };
}

export function start(intervalMs = DISPATCH_INTERVAL_MS) {
  const timer = setInterval(async () => {
    try {
      const { claimed, delivered, failed } = await dispatchOnce();
      if (claimed > 0) {
        console.log(`[IntegrationOutboxDispatch] Claimed ${claimed}, delivered ${delivered}, failed ${failed}`);
      }
    } catch (err) {
      console.error(`[IntegrationOutboxDispatch] Tick error: ${err.message}`);
    }
  }, intervalMs).unref();
  return timer;
}
