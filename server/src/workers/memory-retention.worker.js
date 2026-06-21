import { contactMemoriesRepository } from '../db/repositories/index.js';

const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;

let intervalHandle = null;

export function startMemoryRetention({ onError } = {}) {
  if (intervalHandle) return;

  async function run() {
    try {
      const count = await contactMemoriesRepository.deleteExpired();
      if (count > 0) {
        console.log(`[memory-retention] Cleaned ${count} expired/deleted memory record(s)`);
      }
    } catch (err) {
      console.error('[memory-retention] Error:', err.message);
      if (onError) onError(err);
    }
  }

  intervalHandle = setInterval(run, RUN_INTERVAL_MS);
  run();

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  };
}

export function stopMemoryRetention() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
