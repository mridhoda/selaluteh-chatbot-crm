import { cartsRepository } from '../db/repositories/index.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
let intervalHandle = null;

export async function expireCarts() {
  const now = new Date();
  const expired = await cartsRepository.findExpired(now);
  if (expired.length === 0) return 0;

  const ids = expired.map((c) => c._id);
  await cartsRepository.expireMany(ids);
  return expired.length;
}

export function start(intervalMs = CHECK_INTERVAL_MS) {
  if (intervalHandle) return;
  intervalHandle = setInterval(async () => {
    try {
      const count = await expireCarts();
      if (count > 0) console.log(`[CartExpiry] Expired ${count} cart(s)`);
    } catch (err) {
      console.error('[CartExpiry] Error:', err.message);
    }
  }, intervalMs).unref();
  console.log(`[CartExpiry] Worker started (interval: ${intervalMs}ms)`);
}

export function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
