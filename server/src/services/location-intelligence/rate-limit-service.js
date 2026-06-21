export const DEFAULT_LIMITS = {
  customerResolution: { maxRequests: 5, windowMinutes: 10 },
  customerDirections: { maxRequests: 10, windowMinutes: 10 },
  adminResolution: { maxRequests: 20, windowMinutes: 10 },
  scheduledVerification: { maxRequests: 50, windowMinutes: 60 },
};

export function createRateLimiter(config) {
  const counter = new Map();

  return {
    check: async (key) => {
      const now = Date.now();
      const windowMs = config.windowMinutes * 60 * 1000;
      const entry = counter.get(key) || { count: 0, resetAt: now + windowMs };

      if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + windowMs;
      }

      entry.count++;
      counter.set(key, entry);

      return {
        allowed: entry.count <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetAt: entry.resetAt,
      };
    },
    checkCacheHit: () => ({ quotaConsumed: false }),
    reset: () => counter.clear(),
  };
}
