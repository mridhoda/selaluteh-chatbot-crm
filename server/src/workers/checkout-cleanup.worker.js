import { checkoutsRepository } from '../db/repositories/index.js';

const CHECK_INTERVAL_MS = 10 * 60 * 1000;

const EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function cleanupExpiredCheckouts() {
  const cutoff = new Date(Date.now() - EXPIRY_MS);
  const expired = await checkoutsRepository.findExpired(cutoff);
  if (expired.length === 0) return 0;
  const ids = expired.map(c => c.id);
  await checkoutsRepository.expireMany(ids);
  return expired.length;
}

export function start(intervalMs = CHECK_INTERVAL_MS) {
  const timer = setInterval(async () => {
    try {
      const count = await cleanupExpiredCheckouts();
      if (count > 0) console.log(`[CheckoutCleanup] Expired ${count} checkout(s)`);
    } catch (err) {
      console.error('[CheckoutCleanup] Error:', err.message);
    }
  }, intervalMs).unref();
  return timer;
}
