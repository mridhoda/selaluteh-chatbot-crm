import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResolutionStatus,
  isStableResolutionStatus,
  isValidResolutionStatus,
} from '../../../src/services/location-intelligence/resolution-status.js';

describe('ResolutionStatus — Task 1.2', () => {
  describe('Stable enum values', () => {
    it('has all required statuses', () => {
      assert.equal(ResolutionStatus.RESOLVED, 'RESOLVED');
      assert.equal(ResolutionStatus.AMBIGUOUS, 'AMBIGUOUS');
      assert.equal(ResolutionStatus.NOT_FOUND, 'NOT_FOUND');
      assert.equal(ResolutionStatus.OUTSIDE_SUPPORTED_CITY, 'OUTSIDE_SUPPORTED_CITY');
      assert.equal(ResolutionStatus.INVALID_INPUT, 'INVALID_INPUT');
      assert.equal(ResolutionStatus.PROVIDER_UNAVAILABLE, 'PROVIDER_UNAVAILABLE');
      assert.equal(ResolutionStatus.RATE_LIMITED, 'RATE_LIMITED');
    });
  });

  describe('Serialization', () => {
    it('RESOLVED is stable', () => {
      assert.equal(isStableResolutionStatus(ResolutionStatus.RESOLVED), true);
    });

    it('PROVIDER_UNAVAILABLE is stable', () => {
      assert.equal(isStableResolutionStatus(ResolutionStatus.PROVIDER_UNAVAILABLE), true);
    });

    it('string value round-trips', () => {
      const value = String(ResolutionStatus.RESOLVED);
      assert.equal(value, 'RESOLVED');
      assert.equal(isValidResolutionStatus(value), true);
    });
  });

  describe('Unknown status rejected', () => {
    it('unknown string returns false', () => {
      assert.equal(isValidResolutionStatus('UNKNOWN_STATUS'), false);
    });

    it('empty string returns false', () => {
      assert.equal(isValidResolutionStatus(''), false);
    });

    it('null returns false', () => {
      assert.equal(isValidResolutionStatus(null), false);
    });

    it('undefined returns false', () => {
      assert.equal(isValidResolutionStatus(undefined), false);
    });
  });
});
