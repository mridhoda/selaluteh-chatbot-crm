import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LocationFlowStatus,
  isValidFlowTransition,
  getNextFlowStatuses,
  isFlowTerminal,
} from '../../../src/services/location-intelligence/flow-status.js';

describe('LocationFlowStatus — Task 1.1', () => {
  describe('Status enum values', () => {
    it('has all required statuses', () => {
      assert.equal(LocationFlowStatus.EMPTY, 'EMPTY');
      assert.equal(LocationFlowStatus.MISSING_CITY, 'MISSING_CITY');
      assert.equal(LocationFlowStatus.MISSING_DETAIL, 'MISSING_DETAIL');
      assert.equal(LocationFlowStatus.READY_TO_RESOLVE, 'READY_TO_RESOLVE');
      assert.equal(LocationFlowStatus.RESOLVING, 'RESOLVING');
      assert.equal(LocationFlowStatus.AMBIGUOUS, 'AMBIGUOUS');
      assert.equal(LocationFlowStatus.READY_TO_CALCULATE, 'READY_TO_CALCULATE');
      assert.equal(LocationFlowStatus.RESULTS_READY, 'RESULTS_READY');
      assert.equal(LocationFlowStatus.CONFIRMING_OUTLET, 'CONFIRMING_OUTLET');
      assert.equal(LocationFlowStatus.CONFIRMED, 'CONFIRMED');
      assert.equal(LocationFlowStatus.CANCELLED, 'CANCELLED');
      assert.equal(LocationFlowStatus.EXPIRED, 'EXPIRED');
    });
  });

  describe('Valid transitions accepted', () => {
    it('EMPTY → MISSING_CITY when detail without city', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.EMPTY, LocationFlowStatus.MISSING_CITY));
    });

    it('EMPTY → MISSING_DETAIL when city only', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.EMPTY, LocationFlowStatus.MISSING_DETAIL));
    });

    it('EMPTY → READY_TO_RESOLVE when city + detail', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.EMPTY, LocationFlowStatus.READY_TO_RESOLVE));
    });

    it('EMPTY → READY_TO_CALCULATE when shared coordinates', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.EMPTY, LocationFlowStatus.READY_TO_CALCULATE));
    });

    it('MISSING_CITY → READY_TO_RESOLVE when city supplied', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.MISSING_CITY, LocationFlowStatus.READY_TO_RESOLVE));
    });

    it('MISSING_CITY → CANCELLED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.MISSING_CITY, LocationFlowStatus.CANCELLED));
    });

    it('MISSING_CITY → EXPIRED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.MISSING_CITY, LocationFlowStatus.EXPIRED));
    });

    it('MISSING_DETAIL → READY_TO_RESOLVE when detail supplied', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.MISSING_DETAIL, LocationFlowStatus.READY_TO_RESOLVE));
    });

    it('MISSING_DETAIL → CANCELLED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.MISSING_DETAIL, LocationFlowStatus.CANCELLED));
    });

    it('MISSING_DETAIL → EXPIRED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.MISSING_DETAIL, LocationFlowStatus.EXPIRED));
    });

    it('READY_TO_RESOLVE → RESOLVING', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.READY_TO_RESOLVE, LocationFlowStatus.RESOLVING));
    });

    it('RESOLVING → AMBIGUOUS', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.RESOLVING, LocationFlowStatus.AMBIGUOUS));
    });

    it('RESOLVING → READY_TO_CALCULATE when resolved', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.RESOLVING, LocationFlowStatus.READY_TO_CALCULATE));
    });

    it('AMBIGUOUS → READY_TO_CALCULATE when candidate chosen', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.AMBIGUOUS, LocationFlowStatus.READY_TO_CALCULATE));
    });

    it('AMBIGUOUS → READY_TO_RESOLVE for corrected query', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.AMBIGUOUS, LocationFlowStatus.READY_TO_RESOLVE));
    });

    it('AMBIGUOUS → CANCELLED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.AMBIGUOUS, LocationFlowStatus.CANCELLED));
    });

    it('AMBIGUOUS → EXPIRED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.AMBIGUOUS, LocationFlowStatus.EXPIRED));
    });

    it('READY_TO_CALCULATE → RESULTS_READY', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.READY_TO_CALCULATE, LocationFlowStatus.RESULTS_READY));
    });

    it('RESULTS_READY → CONFIRMING_OUTLET', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.RESULTS_READY, LocationFlowStatus.CONFIRMING_OUTLET));
    });

    it('CONFIRMING_OUTLET → CONFIRMED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.CONFIRMING_OUTLET, LocationFlowStatus.CONFIRMED));
    });

    it('CONFIRMING_OUTLET → READY_TO_RESOLVE for new location', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.CONFIRMING_OUTLET, LocationFlowStatus.READY_TO_RESOLVE));
    });

    it('CONFIRMING_OUTLET → CANCELLED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.CONFIRMING_OUTLET, LocationFlowStatus.CANCELLED));
    });

    it('CONFIRMING_OUTLET → EXPIRED', () => {
      assert.ok(isValidFlowTransition(LocationFlowStatus.CONFIRMING_OUTLET, LocationFlowStatus.EXPIRED));
    });
  });

  describe('Invalid transitions rejected', () => {
    it('EMPTY → CONFIRMED', () => {
      assert.equal(isValidFlowTransition(LocationFlowStatus.EMPTY, LocationFlowStatus.CONFIRMED), false);
    });

    it('TERMINAL cannot transition (CONFIRMED → EMPTY)', () => {
      assert.equal(isValidFlowTransition(LocationFlowStatus.CONFIRMED, LocationFlowStatus.EMPTY), false);
    });

    it('TERMINAL cannot transition (CANCELLED → EMPTY)', () => {
      assert.equal(isValidFlowTransition(LocationFlowStatus.CANCELLED, LocationFlowStatus.EMPTY), false);
    });

    it('TERMINAL cannot transition (EXPIRED → EMPTY)', () => {
      assert.equal(isValidFlowTransition(LocationFlowStatus.EXPIRED, LocationFlowStatus.EMPTY), false);
    });

    it('RESOLVING → CONFIRMED (skip results)', () => {
      assert.equal(isValidFlowTransition(LocationFlowStatus.RESOLVING, LocationFlowStatus.CONFIRMED), false);
    });

    it('EMPTY → RESOLVING', () => {
      assert.equal(isValidFlowTransition(LocationFlowStatus.EMPTY, LocationFlowStatus.RESOLVING), false);
    });
  });

  describe('Terminal state behavior', () => {
    it('CONFIRMED is terminal', () => {
      assert.ok(isFlowTerminal(LocationFlowStatus.CONFIRMED));
    });

    it('CANCELLED is terminal', () => {
      assert.ok(isFlowTerminal(LocationFlowStatus.CANCELLED));
    });

    it('EXPIRED is terminal', () => {
      assert.ok(isFlowTerminal(LocationFlowStatus.EXPIRED));
    });

    it('EMPTY is not terminal', () => {
      assert.equal(isFlowTerminal(LocationFlowStatus.EMPTY), false);
    });

    it('READY_TO_RESOLVE is not terminal', () => {
      assert.equal(isFlowTerminal(LocationFlowStatus.READY_TO_RESOLVE), false);
    });
  });

  describe('Expired cannot resume silently', () => {
    it('EXPIRED has no valid outgoing transitions', () => {
      const next = getNextFlowStatuses(LocationFlowStatus.EXPIRED);
      assert.equal(next.length, 0);
    });
  });

  describe('Confirmed cannot be reconfirmed without idempotency', () => {
    it('CONFIRMED has no valid outgoing transitions', () => {
      const next = getNextFlowStatuses(LocationFlowStatus.CONFIRMED);
      assert.equal(next.length, 0);
    });
  });
});
