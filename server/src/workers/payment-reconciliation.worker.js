import { getSupabaseServiceClient } from '../db/supabase.js';
import { paymentsRepository } from '../db/repositories/index.js';
import { expirePendingPayments } from '../services/payment-expiry.service.js';
import { detectMissingWebhooks, reconcileMissingWebhook, reconcilePendingProviderPayment } from '../services/payment-reconciliation.service.js';
import { WorkerJobType, runWorkerJob } from './job-contract.js';

const CHECK_INTERVAL_MS = 60_000;
// Only check payments that have been pending for at least this long (avoid checking brand-new ones)
const MIN_PENDING_AGE_MINUTES = 2;

/**
 * Reconcile payments already flagged as 'missing_webhook' — pull from provider and update.
 */
export async function reconcilePayments(workspaceId) {
  const { data } = await detectMissingWebhooks({ workspaceId, limit: 20 });
  if (data.length === 0) return 0;

  let reconciled = 0;
  for (const payment of data) {
    try {
      await reconcileMissingWebhook({ workspaceId, paymentId: payment.id });
      reconciled++;
    } catch (err) {
      console.error(`[ReconWorker] Payment ${payment.id}: ${err.message}`);
    }
  }
  return reconciled;
}

/**
 * Proactively check pending payments against configured providers to catch missed webhooks.
 * If the provider says paid but webhook never arrived (or got stuck),
 * this worker will detect it and update the order automatically.
 */
export async function reconcilePendingPayments(workspaceId) {
  const cutoffTime = new Date(Date.now() - MIN_PENDING_AGE_MINUTES * 60 * 1000).toISOString();
  const pendingPayments = await paymentsRepository.findPendingForReconciliation({ workspaceId, olderThan: cutoffTime, limit: 20 });
  if (!pendingPayments?.length) return 0;

  let synced = 0;
  for (const row of pendingPayments) {
    try {
      const result = await reconcilePendingProviderPayment({ workspaceId, paymentId: row.id });
      if (result.providerStatus === 'paid' && result.payment?.status === 'paid') {
        console.log(`[ReconWorker] Synced missed payment ${row.id} -> paid (order ${row.orderId || row.order_id})`);
        synced++;
      }
    } catch (err) {
      console.error(`[ReconWorker] reconcilePending payment ${row.id}: ${err.message}`);
    }
  }
  return synced;
}

export async function expirePayments(workspaceId, { now = new Date() } = {}) {
  const job = await runWorkerJob({
    jobType: WorkerJobType.EXPIRE_PENDING_PAYMENTS,
    workspaceId,
    handler: () => expirePendingPayments({ workspaceId, now, limit: 100 }),
  });
  if (!job.ok) throw Object.assign(new Error(job.error.message), { code: job.error.code });
  return job.result.expired || 0;
}

export function start(intervalMs = CHECK_INTERVAL_MS) {
  const timer = setInterval(async () => {
    const client = getSupabaseServiceClient();
    const { data: workspaces } = await client.from('workspaces').select('id').limit(10);
    for (const ws of workspaces ?? []) {
      try {
        // 0. Expire by backend/provider timestamp. This path never touches paid payments.
        const expired = await expirePayments(ws.id);
        if (expired > 0) console.log(`[PaymentExpiry] Expired ${expired} payment(s) for workspace ${ws.id}`);

        // 1. Handle payments flagged as 'missing_webhook'
        const count = await reconcilePayments(ws.id);
        if (count > 0) console.log(`[ReconWorker] Reconciled ${count} missing-webhook payments for workspace ${ws.id}`);

        // 2. Proactively sync pending payments that providers may have already settled
        const synced = await reconcilePendingPayments(ws.id);
        if (synced > 0) console.log(`[ReconWorker] Synced ${synced} pending→paid payments for workspace ${ws.id}`);
      } catch (err) {
        console.error(`[ReconWorker] Workspace ${ws.id}: ${err.message}`);
      }
    }
  }, intervalMs).unref();
  return timer;
}
