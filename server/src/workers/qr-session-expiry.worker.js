import { expireQrSessions } from '../services/qr-order-session.service.js';
import { WorkerJobType, runWorkerJob } from './job-contract.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
let intervalHandle = null;

export async function expireQrSessionsOnce({ now = new Date() } = {}) {
  const job = await runWorkerJob({
    jobType: WorkerJobType.EXPIRE_QR_SESSIONS,
    handler: () => expireQrSessions({ now }),
  });
  if (!job.ok) throw Object.assign(new Error(job.error.message), { code: job.error.code });
  return job.result.expiredCount || 0;
}

export function start(intervalMs = CHECK_INTERVAL_MS) {
  if (intervalHandle) return intervalHandle;
  intervalHandle = setInterval(async () => {
    try {
      const count = await expireQrSessionsOnce();
      if (count > 0) console.log(`[QrSessionExpiry] Expired ${count} QR session(s)`);
    } catch (err) {
      console.error('[QrSessionExpiry] Error:', err.message);
    }
  }, intervalMs);
  intervalHandle.unref?.();
  console.log(`[QrSessionExpiry] Worker started (interval: ${intervalMs}ms)`);
  return intervalHandle;
}

export function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
