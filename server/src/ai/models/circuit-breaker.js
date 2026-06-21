const DEFAULT_THRESHOLD = 5;
const DEFAULT_RECOVERY_MS = 30000;

const states = new Map();

export function createCircuitBreaker({ name, threshold = DEFAULT_THRESHOLD, recoveryMs = DEFAULT_RECOVERY_MS } = {}) {
  const key = name || 'default';
  let entry = states.get(key) || { failures: 0, state: 'closed', lastFailure: 0, lastSuccess: 0 };
  states.set(key, entry);

  return {
    name: key,
    state: () => entry.state,
    recordSuccess() {
      entry.failures = 0;
      entry.state = 'closed';
      entry.lastSuccess = Date.now();
    },
    recordFailure() {
      entry.failures++;
      entry.lastFailure = Date.now();
      if (entry.failures >= threshold) entry.state = 'open';
    },
    allowRequest() {
      if (entry.state === 'closed') return true;
      if (entry.state === 'open') {
        if (Date.now() - entry.lastFailure >= recoveryMs) {
          entry.state = 'half-open';
          return true;
        }
        return false;
      }
      return true;
    },
    reset() { entry.failures = 0; entry.state = 'closed'; },
    stats: () => ({ failures: entry.failures, state: entry.state, lastFailure: entry.lastFailure, lastSuccess: entry.lastSuccess }),
  };
}

export { states as circuitBreakerStates };
