/**
 * integration-outbox-dispatch.worker.js
 *
 * Drains integration_outbox, sending each row to TATA-POS via
 * tata-pos-client.js and marking it delivered/failed. Mirrors
 * payment-reconciliation.worker.js's shape (setInterval, `.unref()`,
 * `start(intervalMs)` export).
 *
 * Registered in server/src/index.js's bootstrap() alongside the other
 * workers; order.service.js's markOrderPaidPreparing()/
 * notifyOrderUpdatedRealtime() are what enqueue rows for it to drain.
 */
import { integrationOutboxRepository } from '../db/repositories/integration-outbox.supabase.repository.js';
import { ordersRepository } from '../db/repositories/index.js';
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
      const result = await sendIntegrationEvent(row.payload);
      await integrationOutboxRepository.markDelivered({ id: row.id });
      delivered++;

      // Best-effort: TATA-POS's own generated order_number is cosmetic
      // (customer lookup still uses this repo's own orderNumber) -- a
      // failure here must never undo the markDelivered above.
      //
      // TATA-POS's HTTP layer wraps every controller response in a global
      // { data, meta } envelope -- verified live (POST /integrations/orders
      // actually returns { data: { order_number, ... }, meta: { request_id } },
      // not the bare RPC shape { order_number, ... }). Falling back to the
      // bare shape too in case a future TATA-POS endpoint ever returns it
      // unwrapped.
      const posReceiptNumber = result?.data?.order_number || result?.order_number;
      if (posReceiptNumber && row.orderId) {
        try {
          await ordersRepository.updateOne({
            workspaceId: row.workspaceId,
            orderId: row.orderId,
            updates: { pos_receipt_number: posReceiptNumber },
          });
        } catch (updateErr) {
          console.error(`[IntegrationOutboxDispatch] Row ${row.id}: failed to persist pos_receipt_number: ${updateErr.message}`);
        }
      }
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
