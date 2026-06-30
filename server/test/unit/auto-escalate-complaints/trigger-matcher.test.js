/**
 * trigger-matcher.test.js
 * Spec: auto-escalate-complaints — Task Section 7, 31
 *
 * Unit tests for trigger evaluation logic.
 * Pure function, no DB. No production data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTriggers } from '../../../src/services/auto-escalate-complaints/trigger-matcher.service.js';
import { TRIGGER_TYPE, MATCH_MODE } from '../../../src/services/auto-escalate-complaints/constants.js';

const NOW = new Date('2026-01-10T10:00:00Z');

function makePolicy(overrides = {}) {
  return {
    matchMode: MATCH_MODE.ANY,
    triggerRules: {
      immediatePriorities: ['HIGH', 'CRITICAL'],
      unassignedAfterMinutes: 10,
    },
    ...overrides,
  };
}

describe('TriggerMatcher — evaluateTriggers', () => {
  describe('Manual trigger', () => {
    it('always matches when triggerType=MANUAL', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: {} }),
        complaint: { priority: 'LOW', createdAt: NOW.toISOString() },
        triggerType: TRIGGER_TYPE.MANUAL,
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
      assert.equal(result.triggerType, TRIGGER_TYPE.MANUAL);
      assert.deepEqual(result.matchedRules, ['MANUAL']);
    });
  });

  describe('Priority trigger (AUTO_PRIORITY)', () => {
    it('matches HIGH priority', () => {
      const result = evaluateTriggers({
        policy: makePolicy(),
        complaint: { priority: 'HIGH', createdAt: NOW.toISOString() },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
      assert.ok(result.matchedRules.includes('AUTO_PRIORITY'));
    });

    it('matches CRITICAL priority', () => {
      const result = evaluateTriggers({
        policy: makePolicy(),
        complaint: { priority: 'CRITICAL', createdAt: NOW.toISOString() },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
    });

    it('does not match LOW priority', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { immediatePriorities: ['HIGH', 'CRITICAL'] } }),
        complaint: { priority: 'LOW', createdAt: NOW.toISOString() },
        evaluationTime: NOW,
      });
      assert.ok(!result.matchedRules.includes('AUTO_PRIORITY'));
    });

    it('is case-insensitive for priority comparison', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { immediatePriorities: ['high'] } }),
        complaint: { priority: 'HIGH', createdAt: NOW.toISOString() },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
    });
  });

  describe('Unassigned timeout trigger (AUTO_UNASSIGNED)', () => {
    it('matches when complaint unassigned for >= threshold', () => {
      const createdAt = new Date(NOW.getTime() - 15 * 60000).toISOString(); // 15 min ago
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { unassignedAfterMinutes: 10 }, matchMode: MATCH_MODE.ANY }),
        complaint: { priority: 'LOW', createdAt, assignedToUserId: null },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
      assert.ok(result.matchedRules.includes('AUTO_UNASSIGNED'));
    });

    it('does NOT match when complaint is too recent', () => {
      const createdAt = new Date(NOW.getTime() - 5 * 60000).toISOString(); // 5 min ago
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { unassignedAfterMinutes: 10 }, matchMode: MATCH_MODE.ANY }),
        complaint: { priority: 'LOW', createdAt, assignedToUserId: null },
        evaluationTime: NOW,
      });
      assert.ok(!result.matchedRules.includes('AUTO_UNASSIGNED'));
    });

    it('does NOT match when complaint is assigned', () => {
      const createdAt = new Date(NOW.getTime() - 30 * 60000).toISOString();
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { unassignedAfterMinutes: 10 } }),
        complaint: { priority: 'LOW', createdAt, assignedToUserId: 'some-user-id' },
        evaluationTime: NOW,
      });
      assert.ok(!result.matchedRules.includes('AUTO_UNASSIGNED'));
    });
  });

  describe('SLA threshold trigger (AUTO_SLA)', () => {
    it('matches when slaRemainingMinutes <= threshold', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { slaRemainingMinutes: 30 } }),
        complaint: { priority: 'MEDIUM', createdAt: NOW.toISOString(), slaRemainingMinutes: 20 },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
      assert.ok(result.matchedRules.includes('AUTO_SLA'));
    });

    it('does NOT match when SLA remaining > threshold', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: { slaRemainingMinutes: 30 } }),
        complaint: { priority: 'MEDIUM', createdAt: NOW.toISOString(), slaRemainingMinutes: 60 },
        evaluationTime: NOW,
      });
      assert.ok(!result.matchedRules.includes('AUTO_SLA'));
    });
  });

  describe('ANY vs ALL match mode', () => {
    it('ANY: matches when only one rule matches', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ matchMode: MATCH_MODE.ANY, triggerRules: { immediatePriorities: ['HIGH'], unassignedAfterMinutes: 10 } }),
        complaint: { priority: 'HIGH', createdAt: NOW.toISOString(), assignedToUserId: 'some-user' },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
    });

    it('ALL: requires every configured rule to match', () => {
      // Priority matches HIGH, but not unassigned (has assigned user)
      const result = evaluateTriggers({
        policy: makePolicy({ matchMode: MATCH_MODE.ALL, triggerRules: { immediatePriorities: ['HIGH'], unassignedAfterMinutes: 10 } }),
        complaint: { priority: 'HIGH', createdAt: NOW.toISOString(), assignedToUserId: 'some-user' },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, false);
    });

    it('ALL: matches when all rules match', () => {
      const createdAt = new Date(NOW.getTime() - 20 * 60000).toISOString();
      const result = evaluateTriggers({
        policy: makePolicy({ matchMode: MATCH_MODE.ALL, triggerRules: { immediatePriorities: ['HIGH'], unassignedAfterMinutes: 10 } }),
        complaint: { priority: 'HIGH', createdAt, assignedToUserId: null },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, true);
    });
  });

  describe('Empty policy rules', () => {
    it('returns not matched when no rules configured', () => {
      const result = evaluateTriggers({
        policy: makePolicy({ triggerRules: {} }),
        complaint: { priority: 'HIGH', createdAt: NOW.toISOString() },
        evaluationTime: NOW,
      });
      assert.equal(result.matched, false);
    });
  });

  describe('Determinism', () => {
    it('produces same output for same inputs', () => {
      const args = {
        policy: makePolicy(),
        complaint: { priority: 'HIGH', createdAt: NOW.toISOString() },
        evaluationTime: NOW,
      };
      const r1 = evaluateTriggers(args);
      const r2 = evaluateTriggers(args);
      assert.equal(r1.matched, r2.matched);
      assert.deepEqual(r1.matchedRules, r2.matchedRules);
      assert.equal(r1.triggerType, r2.triggerType);
    });
  });
});
