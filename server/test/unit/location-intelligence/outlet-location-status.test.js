import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OutletLocationStatus,
  isValidOutletLocationTransition,
  isEligibleOutletStatus,
  getNextOutletLocationStatuses,
} from '../../../src/services/location-intelligence/outlet-location-status.js';

describe('OutletLocationStatus — Task 1.3', () => {
  describe('State enum values', () => {
    it('has all required statuses', () => {
      assert.equal(OutletLocationStatus.UNRESOLVED, 'UNRESOLVED');
      assert.equal(OutletLocationStatus.RESOLVED, 'RESOLVED');
      assert.equal(OutletLocationStatus.VERIFIED, 'VERIFIED');
      assert.equal(OutletLocationStatus.NEEDS_REVIEW, 'NEEDS_REVIEW');
      assert.equal(OutletLocationStatus.INVALID, 'INVALID');
    });
  });

  describe('State transition validation — valid', () => {
    it('UNRESOLVED → RESOLVED', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.UNRESOLVED, OutletLocationStatus.RESOLVED));
    });

    it('RESOLVED → VERIFIED', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.RESOLVED, OutletLocationStatus.VERIFIED));
    });

    it('VERIFIED → NEEDS_REVIEW', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.VERIFIED, OutletLocationStatus.NEEDS_REVIEW));
    });

    it('NEEDS_REVIEW → VERIFIED', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.NEEDS_REVIEW, OutletLocationStatus.VERIFIED));
    });

    it('NEEDS_REVIEW → INVALID', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.NEEDS_REVIEW, OutletLocationStatus.INVALID));
    });

    it('INVALID → RESOLVED', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.INVALID, OutletLocationStatus.RESOLVED));
    });
  });

  describe('State transition validation — invalid', () => {
    it('UNRESOLVED → VERIFIED (skip resolved)', () => {
      assert.equal(isValidOutletLocationTransition(OutletLocationStatus.UNRESOLVED, OutletLocationStatus.VERIFIED), false);
    });

    it('UNRESOLVED → INVALID', () => {
      assert.equal(isValidOutletLocationTransition(OutletLocationStatus.UNRESOLVED, OutletLocationStatus.INVALID), false);
    });

    it('RESOLVED → UNRESOLVED', () => {
      assert.equal(isValidOutletLocationTransition(OutletLocationStatus.RESOLVED, OutletLocationStatus.UNRESOLVED), false);
    });

    it('VERIFIED → UNRESOLVED', () => {
      assert.equal(isValidOutletLocationTransition(OutletLocationStatus.VERIFIED, OutletLocationStatus.UNRESOLVED), false);
    });

    it('INVALID → VERIFIED', () => {
      assert.equal(isValidOutletLocationTransition(OutletLocationStatus.INVALID, OutletLocationStatus.VERIFIED), false);
    });
  });

  describe('Eligibility — only VERIFIED', () => {
    it('VERIFIED is eligible', () => {
      assert.ok(isEligibleOutletStatus(OutletLocationStatus.VERIFIED));
    });

    it('UNRESOLVED not eligible', () => {
      assert.equal(isEligibleOutletStatus(OutletLocationStatus.UNRESOLVED), false);
    });

    it('RESOLVED not eligible', () => {
      assert.equal(isEligibleOutletStatus(OutletLocationStatus.RESOLVED), false);
    });

    it('NEEDS_REVIEW not eligible', () => {
      assert.equal(isEligibleOutletStatus(OutletLocationStatus.NEEDS_REVIEW), false);
    });

    it('INVALID not eligible', () => {
      assert.equal(isEligibleOutletStatus(OutletLocationStatus.INVALID), false);
    });
  });

  describe('Significant refresh → NEEDS_REVIEW', () => {
    it('VERIFIED → NEEDS_REVIEW is valid for significant change', () => {
      assert.ok(isValidOutletLocationTransition(OutletLocationStatus.VERIFIED, OutletLocationStatus.NEEDS_REVIEW));
    });

    it('VERIFIED no direct transition to INVALID', () => {
      assert.equal(isValidOutletLocationTransition(OutletLocationStatus.VERIFIED, OutletLocationStatus.INVALID), false);
    });
  });

  describe('Invalid coordinates cannot become VERIFIED', () => {
    it('No direct path to VERIFIED from INVALID', () => {
      const next = getNextOutletLocationStatuses(OutletLocationStatus.INVALID);
      assert.ok(next.includes(OutletLocationStatus.RESOLVED));
      assert.equal(next.includes(OutletLocationStatus.VERIFIED), false);
    });
  });
});
