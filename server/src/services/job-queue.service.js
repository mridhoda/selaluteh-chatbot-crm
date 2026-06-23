import { computeNextRun, classifyError } from '../utils/retry-policy.js';
import { jobsRepository } from '../db/repositories/jobs.supabase.repository.js';

export { computeNextRun, classifyError };
export { computeBackoff, isRetriableError } from '../utils/retry-policy.js';

export async function enqueueJob({ workspaceId, type, referenceType, referenceId, payload, deduplicationKey, maxAttempts = 3 }) {
  return jobsRepository.create({ workspaceId, type, referenceType, referenceId, payload, deduplicationKey, maxAttempts });
}

export async function processJob(job, handler) {
  if (!job || job.status !== 'running') return;

  try {
    await handler(job);
    await jobsRepository.complete(job.id);
  } catch (err) {
    const errorClass = classifyError(err);
    const nextRun = errorClass === 'retriable' ? computeNextRun(job.attempt_count, job.max_attempts) : null;
    await jobsRepository.fail(job.id, err.message, nextRun);
  }
}

export async function enqueueReconciliationJob({ workspaceId, paymentId }) {
  return enqueueJob({
    workspaceId,
    type: 'payment_reconciliation',
    referenceType: 'payment',
    referenceId: paymentId,
    payload: { paymentId },
    deduplicationKey: `reconcile:${paymentId}`,
  });
}

export async function enqueueCheckoutCleanupJob({ workspaceId, checkoutId }) {
  return enqueueJob({
    workspaceId,
    type: 'checkout_cleanup',
    referenceType: 'checkout',
    referenceId: checkoutId,
    payload: { checkoutId },
    deduplicationKey: `cleanup:${checkoutId}`,
  });
}
