/**
 * effective-policy.test.js
 * Spec: auto-escalate-complaints — Task Section 5
 *
 * Unit tests for effective policy resolver and validator.
 * No DB. Pure logic.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePolicy } from '../../../src/services/auto-escalate-complaints/effective-policy.service.js';
import { POLICY_SOURCE } from '../../../src/services/auto-escalate-complaints/constants.js';

describe('validatePolicy', () => {
  it('returns errors when no triggers configured', () => {
    const errors = validatePolicy({ recipientStrategy: 'PRIMARY_ONLY', triggerRules: {} });
    assert.ok(errors.some(e => e.includes('trigger')));
  });

  it('passes when immediatePriorities is set', () => {
    const errors = validatePolicy({
      recipientStrategy: 'PRIMARY_ONLY',
      triggerRules: { immediatePriorities: ['HIGH'] },
    });
    assert.equal(errors.length, 0);
  });

  it('returns error for invalid recipientStrategy', () => {
    const errors = validatePolicy({
      recipientStrategy: 'INVALID_STRATEGY',
      triggerRules: { immediatePriorities: ['HIGH'] },
    });
    assert.ok(errors.some(e => e.includes('recipientStrategy')));
  });

  it('returns error when acknowledgementMinutes < 1', () => {
    const errors = validatePolicy({
      recipientStrategy: 'PRIMARY_ONLY',
      triggerRules: { immediatePriorities: ['HIGH'] },
      supervisorSla: { acknowledgementMinutes: 0 },
    });
    assert.ok(errors.some(e => e.includes('acknowledgementMinutes')));
  });

  it('passes with valid full policy', () => {
    const errors = validatePolicy({
      recipientStrategy: 'PRIMARY_ONLY',
      triggerRules: { immediatePriorities: ['HIGH', 'CRITICAL'], unassignedAfterMinutes: 10 },
      supervisorSla: { acknowledgementMinutes: 15, firstResponseMinutes: 60 },
    });
    assert.equal(errors.length, 0);
  });

  it('returns error for null policy', () => {
    const errors = validatePolicy(null);
    assert.ok(errors.length > 0);
  });
});
