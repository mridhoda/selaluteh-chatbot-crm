import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimit } from '../../../src/middleware/rate-limit.js';

describe('rate limit middleware', () => {
  it('rejects after threshold', () => {
    const middleware = createRateLimit({ keyPrefix: 'test', windowMs: 1000, max: 1 });
    const req = { ip: '127.0.0.1', headers: {} };
    let err = null;
    middleware(req, {}, (nextErr) => { err = nextErr || null; });
    assert.equal(err, null);
    middleware(req, {}, (nextErr) => { err = nextErr; });
    assert.equal(err.code, 'RATE_LIMITED');
    assert.equal(err.status, 429);
  });
});
