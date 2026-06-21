import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, DEFAULT_LIMITS } from '../../../src/services/location-intelligence/rate-limit-service.js';

describe('RateLimitService — Section 20', () => {
  it('has customer resolution default 5/10min', () => {
    assert.equal(DEFAULT_LIMITS.customerResolution.maxRequests, 5);
    assert.equal(DEFAULT_LIMITS.customerResolution.windowMinutes, 10);
  });

  it('has directions default 10/10min', () => {
    assert.equal(DEFAULT_LIMITS.customerDirections.maxRequests, 10);
  });

  it('has admin resolution default 20/10min', () => {
    assert.equal(DEFAULT_LIMITS.adminResolution.maxRequests, 20);
  });

  it('rate limiter allows requests within limit', async () => {
    const limiter = createRateLimiter(DEFAULT_LIMITS.customerResolution);
    const result = await limiter.check('ws-1:chat-1');
    assert.equal(result.allowed, true);
  });

  it('cache hits do not consume quota', () => {
    const limiter = createRateLimiter(DEFAULT_LIMITS.customerResolution);
    const result = limiter.checkCacheHit();
    assert.equal(result.quotaConsumed, false);
  });
});
