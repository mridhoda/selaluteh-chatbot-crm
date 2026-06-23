import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeOpenState } from '../../../src/outlets/operating-hours.js';
import { OutletOpenState } from '../../../src/outlets/outlet-status.js';

const TIMEZONE = 'Asia/Makassar';

const regularHours = [
  { day_of_week: 1, opens_at: '08:00', closes_at: '17:00', sequence: 0, is_closed: false },
  { day_of_week: 2, opens_at: '08:00', closes_at: '17:00', sequence: 0, is_closed: false },
  { day_of_week: 3, opens_at: '08:00', closes_at: '17:00', sequence: 0, is_closed: false },
  { day_of_week: 4, opens_at: '08:00', closes_at: '17:00', sequence: 0, is_closed: false },
  { day_of_week: 5, opens_at: '08:00', closes_at: '17:00', sequence: 0, is_closed: false },
  { day_of_week: 6, opens_at: '09:00', closes_at: '15:00', sequence: 0, is_closed: false },
];

// referenceDate adjusted for WITA: 2026-06-23T10:00:00+08:00 = Tuesday 10:00 WITA
const TUES_10AM = '2026-06-23T02:00:00.000Z';
const TUES_07AM = '2026-06-22T23:00:00.000Z';
const TUES_16_45 = '2026-06-23T08:45:00.000Z';

describe('operating-hours', () => {
  describe('computeOpenState', () => {
    it('returns OPEN during regular hours', () => {
      const result = computeOpenState({ timezone: TIMEZONE, regularHours, referenceDate: TUES_10AM });
      assert.strictEqual(result.state, OutletOpenState.OPEN);
      assert.ok(result.nextTransitionAt);
    });

    it('returns CLOSED before opening', () => {
      const result = computeOpenState({ timezone: TIMEZONE, regularHours, referenceDate: TUES_07AM });
      assert.strictEqual(result.state, OutletOpenState.CLOSED);
    });

    it('returns CLOSING_SOON within 30 min of close', () => {
      const result = computeOpenState({ timezone: TIMEZONE, regularHours, referenceDate: TUES_16_45 });
      assert.strictEqual(result.state, OutletOpenState.CLOSING_SOON);
    });

    it('returns UNKNOWN when no schedule', () => {
      const result = computeOpenState({ timezone: TIMEZONE, regularHours: [], referenceDate: TUES_10AM });
      assert.strictEqual(result.state, OutletOpenState.UNKNOWN);
      assert.strictEqual(result.reason, 'no_schedule');
    });

    it('respects special hours over regular hours', () => {
      const specialHours = [{ date: '2026-06-23', is_closed: true }];
      const result = computeOpenState({ timezone: TIMEZONE, regularHours, specialHours, referenceDate: TUES_10AM });
      assert.strictEqual(result.state, OutletOpenState.CLOSED);
      assert.strictEqual(result.reason, 'special_closure');
    });
  });
});
