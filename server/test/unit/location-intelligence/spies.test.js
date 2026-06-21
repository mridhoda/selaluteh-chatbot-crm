import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCacheSpy, createRateLimitSpy, createConfirmationSpy,
  createScopeSecurityGateSpy, createMarketplaceSpy, createHumanTakeoverFixture,
} from '../../helpers/location/spies.js';

describe('Location Spies', () => {
  describe('createCacheSpy', () => {
    it('returns null for missing key', async () => {
      const spy = createCacheSpy();
      const val = await spy.get('nonexistent');
      assert.equal(val, null);
    });

    it('stores and retrieves values', async () => {
      const spy = createCacheSpy();
      await spy.set('key1', { data: 'test' }, 60000);
      const val = await spy.get('key1');
      assert.deepEqual(val, { data: 'test' });
    });

    it('tracks operation counts', async () => {
      const spy = createCacheSpy();
      await spy.get('a');
      await spy.set('a', 1);
      await spy.delete('a');
      assert.equal(spy.getGetCount(), 1);
      assert.equal(spy.getSetCount(), 1);
      assert.equal(spy.getDeleteCount(), 1);
    });

    it('reset clears all state', async () => {
      const spy = createCacheSpy();
      await spy.set('a', 1);
      spy.reset();
      assert.equal(spy.getGetCount(), 0);
      assert.equal(spy.getSetCount(), 0);
      assert.equal(spy.getDeleteCount(), 0);
    });
  });

  describe('createRateLimitSpy', () => {
    it('always returns allowed', async () => {
      const spy = createRateLimitSpy();
      const result = await spy.check('key', 5, 600000);
      assert.equal(result.allowed, true);
      assert.equal(result.remaining, 4);
    });

    it('tracks calls', async () => {
      const spy = createRateLimitSpy();
      await spy.consume('key', 5, 600000);
      assert.equal(spy.getCheckCount(), 1);
    });
  });

  describe('createConfirmationSpy', () => {
    it('requestConfirmation returns success', async () => {
      const spy = createConfirmationSpy();
      const r = await spy.requestConfirmation('flow1', 'outlet1', 'contact1');
      assert(r.success);
    });
  });

  describe('createScopeSecurityGateSpy', () => {
    it('always allows OUTLET intent', async () => {
      const spy = createScopeSecurityGateSpy();
      const r = await spy.check('OUTLET', 'ws1', 'Jalan Biawan Samarinda');
      assert.equal(r.allowed, true);
      assert.equal(r.intent, 'OUTLET');
    });
  });

  describe('createMarketplaceSpy', () => {
    it('selectOutlet returns success', async () => {
      const spy = createMarketplaceSpy();
      const r = await spy.selectOutlet('ws1', 'contact1', 'outlet1', 'idemp-1');
      assert(r.success);
    });
  });

  describe('createHumanTakeoverFixture', () => {
    it('defaults to not taken over', () => {
      const fixture = createHumanTakeoverFixture();
      assert.equal(fixture.isTakenOver, false);
    });

    it('allows override', () => {
      const fixture = createHumanTakeoverFixture({ isTakenOver: true, takenOverByUserId: 'user-1' });
      assert.equal(fixture.isTakenOver, true);
      assert.equal(fixture.takenOverByUserId, 'user-1');
    });
  });
});
