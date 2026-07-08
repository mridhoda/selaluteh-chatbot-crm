import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRateLimit,
  publicCartValidateRateLimit,
  publicCheckoutRateLimit,
  publicOrderRateLimit,
  publicPaymentStatusRateLimit,
  publicQrRateLimit,
} from '../../../src/middleware/rate-limit.js';

function makeReq({ ip = '127.0.0.1', headers = {}, params = {} } = {}) {
  return { ip, headers, params };
}

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (err) => resolve(err || null));
  });
}

describe('rate limit middleware', () => {
  it('uses custom key generator for token-scoped public endpoints', async () => {
    const limit = createRateLimit({
      keyPrefix: `test-public-order-${Date.now()}`,
      windowMs: 60 * 1000,
      max: 1,
      keyGenerator: (req) => `${req.ip}:${req.params.publicOrderToken}`,
    });

    assert.equal(await runMiddleware(limit, makeReq({ params: { publicOrderToken: 'token-a' } })), null);
    const blocked = await runMiddleware(limit, makeReq({ params: { publicOrderToken: 'token-a' } }));
    assert.equal(blocked.code, 'RATE_LIMITED');
    assert.equal(await runMiddleware(limit, makeReq({ params: { publicOrderToken: 'token-b' } })), null);
  });

  it('enforces configured public endpoint thresholds', async () => {
    const cases = [
      { name: 'qr', middleware: publicQrRateLimit, max: 60 },
      { name: 'cart', middleware: publicCartValidateRateLimit, max: 30 },
      { name: 'checkout', middleware: publicCheckoutRateLimit, max: 10 },
      { name: 'payment', middleware: publicPaymentStatusRateLimit, max: 30, params: { paymentId: 'pay-1' } },
      { name: 'order', middleware: publicOrderRateLimit, max: 60, params: { publicOrderToken: 'po-1' } },
    ];

    for (const testCase of cases) {
      const req = makeReq({ ip: `10.0.0.${testCase.max}`, params: testCase.params || {} });
      for (let i = 0; i < testCase.max; i += 1) {
        assert.equal(await runMiddleware(testCase.middleware, req), null, testCase.name);
      }
      const blocked = await runMiddleware(testCase.middleware, req);
      assert.equal(blocked.code, 'RATE_LIMITED', testCase.name);
      assert.equal(blocked.details.limit, testCase.max, testCase.name);
    }
  });
});
