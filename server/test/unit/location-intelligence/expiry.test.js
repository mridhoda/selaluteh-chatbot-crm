import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPendingLocationContext } from '../../helpers/location/index.js';
import { FixedClock } from '../../helpers/location/index.js';

describe('Expiry — Task 2.6', () => {
  it('fixed clock advances correctly', () => {
    const clock = new FixedClock('2026-06-20T00:00:00Z');
    const ctx = buildPendingLocationContext({ createdAt: clock.toISOString() });
    clock.advanceMinutes(30);
    const expired = new Date(ctx.expiresAt).getTime() < clock.toUnixMs();
    assert.equal(expired, false);
  });

  it('context is expired past TTL', () => {
    const clock = new FixedClock('2026-06-20T00:00:00Z');
    const ctx = buildPendingLocationContext({ createdAt: clock.toISOString() });
    clock.advanceMinutes(31);
    const expired = new Date(ctx.expiresAt).getTime() <= clock.toUnixMs();
    assert.equal(expired, true);
  });

  it('confirmed status is terminal', () => {
    const ctx = buildPendingLocationContext({ status: 'CONFIRMED' });
    assert.equal(ctx.status, 'CONFIRMED');
  });

  it('cancelled status is terminal', () => {
    const ctx = buildPendingLocationContext({ status: 'CANCELLED' });
    assert.equal(ctx.status, 'CANCELLED');
  });
});
