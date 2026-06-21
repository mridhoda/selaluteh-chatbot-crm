import { createCircuitBreaker } from '../../ai/models/circuit-breaker.js';

const DEFAULT_THRESHOLD = 5;
const DEFAULT_RECOVERY_MS = 30000;

export function createLocationCircuitBreaker({ name, threshold = DEFAULT_THRESHOLD, recoveryMs = DEFAULT_RECOVERY_MS } = {}) {
  const breaker = createCircuitBreaker({ name: `loc-${name || 'default'}`, threshold, recoveryMs });

  return {
    async call(operation) {
      if (!breaker.allowRequest()) {
        return { success: false, error: 'PROVIDER_UNAVAILABLE', circuitState: breaker.state() };
      }
      try {
        const result = await operation();
        breaker.recordSuccess();
        return { success: true, data: result, circuitState: breaker.state() };
      } catch (err) {
        breaker.recordFailure();
        return { success: false, error: err.message || 'PROVIDER_UNAVAILABLE', circuitState: breaker.state() };
      }
    },
    state: () => breaker.state(),
    stats: () => breaker.stats(),
    reset: () => breaker.reset(),
  };
}
