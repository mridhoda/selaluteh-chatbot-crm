import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OutletOperationalStatus, OutletHealthStatus, OutletOpenState,
  isValidTransition, canAcceptOrders, OUTLET_ERRORS,
} from '../../../src/outlets/outlet-status.js';

describe('outlet-status', () => {
  describe('isValidTransition', () => {
    it('allows DRAFT → COMING_SOON', () => {
      assert.ok(isValidTransition(OutletOperationalStatus.DRAFT, OutletOperationalStatus.COMING_SOON));
    });
    it('allows DRAFT → ACTIVE', () => {
      assert.ok(isValidTransition(OutletOperationalStatus.DRAFT, OutletOperationalStatus.ACTIVE));
    });
    it('allows ACTIVE → PAUSED', () => {
      assert.ok(isValidTransition(OutletOperationalStatus.ACTIVE, OutletOperationalStatus.PAUSED));
    });
    it('allows PAUSED → ACTIVE', () => {
      assert.ok(isValidTransition(OutletOperationalStatus.PAUSED, OutletOperationalStatus.ACTIVE));
    });
    it('allows ARCHIVED → DRAFT', () => {
      assert.ok(isValidTransition(OutletOperationalStatus.ARCHIVED, OutletOperationalStatus.DRAFT));
    });
    it('rejects ACTIVE → DRAFT', () => {
      assert.ok(!isValidTransition(OutletOperationalStatus.ACTIVE, OutletOperationalStatus.DRAFT));
    });
    it('rejects DRAFT → ARCHIVED directly', () => {
      assert.ok(isValidTransition(OutletOperationalStatus.DRAFT, OutletOperationalStatus.ARCHIVED));
    });
    it('rejects unknown status', () => {
      assert.ok(!isValidTransition('UNKNOWN', 'ACTIVE'));
    });
  });

  describe('canAcceptOrders', () => {
    it('returns true for ACTIVE', () => {
      assert.ok(canAcceptOrders(OutletOperationalStatus.ACTIVE));
    });
    it('returns false for PAUSED', () => {
      assert.ok(!canAcceptOrders(OutletOperationalStatus.PAUSED));
    });
    it('returns false for ARCHIVED', () => {
      assert.ok(!canAcceptOrders(OutletOperationalStatus.ARCHIVED));
    });
    it('returns false for DRAFT', () => {
      assert.ok(!canAcceptOrders(OutletOperationalStatus.DRAFT));
    });
  });

  describe('OUTLET_ERRORS', () => {
    it('has expected error codes', () => {
      assert.strictEqual(OUTLET_ERRORS.NOT_FOUND.code, 'OUTLET_NOT_FOUND');
      assert.strictEqual(OUTLET_ERRORS.VERSION_CONFLICT.code, 'OUTLET_VERSION_CONFLICT');
      assert.strictEqual(OUTLET_ERRORS.INVALID_TRANSITION.code, 'OUTLET_INVALID_STATUS_TRANSITION');
    });
  });
});
