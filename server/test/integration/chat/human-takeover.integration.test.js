import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTakeoverActive, assertNoActiveTakeover } from '../../../src/services/human-takeover.service.js';


describe('human-takeover service', () => {
  it('detects Supabase takeover field', () => {
    assert.equal(isTakeoverActive({ takenOverByUserId: 'user-1' }), true);
    assert.equal(isTakeoverActive({ takenOverByUserId: null }), false);
  });

  it('keeps compatibility with legacy takeover field while services are normalized', () => {
    assert.equal(isTakeoverActive({ takeoverBy: 'user-1' }), true);
  });

  it('throws when AI attempts to reply during active takeover', () => {
    assert.throws(
      () => assertNoActiveTakeover({ takenOverByUserId: 'user-1' }),
      (err) => err.code === 'TAKEOVER_ACTIVE' && err.status === 403,
    );
  });
});
