import { closeIdleSessions } from '../ai/memory/session-cleanup.js';

const RUN_INTERVAL_MS = 15 * 60 * 1000;

let intervalHandle = null;

export function startSessionCleanup({ onError } = {}) {
  if (intervalHandle) return;

  async function run() {
    try {
      const result = await closeIdleSessions({ workspaceId: null });
      if (result.closedCount > 0) {
        console.log(`[session-cleanup] Closed ${result.closedCount} idle session(s)`);
      }
    } catch (err) {
      console.error('[session-cleanup] Error:', err.message);
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

export function stopSessionCleanup() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
