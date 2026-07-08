import crypto from 'node:crypto';

export const WorkerJobType = Object.freeze({
  EXPIRE_CHECKOUT_SESSIONS: 'checkout.expire_sessions',
  EXPIRE_QR_SESSIONS: 'qr_session.expire',
  EXPIRE_PENDING_PAYMENTS: 'payment.expire_pending',
  PAYMENT_RECONCILIATION: 'payment.reconcile',
  WEBHOOK_PROCESSING: 'webhook.process',
  NOTIFICATION_RETRY: 'notification.retry',
  ANALYTICS_AGGREGATION: 'analytics.aggregate',
  CLEANUP: 'cleanup.housekeeping',
  PROVIDER_HEALTH_CHECK: 'provider.health_check',
});

export function createJobPayload({ jobType, workspaceId = null, entityType = null, entityId = null, attempt = 1, scheduledAt = new Date(), metadata = {} } = {}) {
  return {
    jobId: crypto.randomUUID(),
    jobType,
    workspaceId,
    entityType,
    entityId,
    attempt,
    createdAt: new Date().toISOString(),
    scheduledAt: new Date(scheduledAt).toISOString(),
    metadata,
  };
}

export function computeWorkerBackoffMs(attempt, { baseMs = 30_000, maxMs = 30 * 60_000, strategy = 'exponential' } = {}) {
  const safeAttempt = Math.max(1, Number(attempt || 1));
  if (strategy === 'linear') return Math.min(maxMs, baseMs * safeAttempt);
  return Math.min(maxMs, baseMs * (2 ** Math.min(safeAttempt - 1, 8)));
}

export function sanitizeWorkerError(error) {
  return {
    code: error?.code || 'WORKER_ERROR',
    message: String(error?.message || error || 'Worker failed')
      .replace(/bot[0-9]+:[A-Za-z0-9_-]+/g, 'bot[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .slice(0, 500),
  };
}

export async function runWorkerJob({ jobType, workspaceId = null, entityId = null, attempt = 1, handler }) {
  const startedAt = Date.now();
  try {
    const result = await handler();
    return {
      ok: true,
      jobType,
      workspaceId,
      entityId,
      attempt,
      durationMs: Date.now() - startedAt,
      result,
    };
  } catch (error) {
    const safeError = sanitizeWorkerError(error);
    return {
      ok: false,
      jobType,
      workspaceId,
      entityId,
      attempt,
      durationMs: Date.now() - startedAt,
      error: safeError,
    };
  }
}
