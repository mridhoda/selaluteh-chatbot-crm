import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeBackoff, isRetriableError, computeNextRun, classifyError } from '../../../src/utils/retry-policy.js';

describe('retry-policy', () => {
  describe('computeBackoff', () => {
    it('increases with each attempt', () => {
      const b1 = computeBackoff(1);
      const b2 = computeBackoff(2);
      assert.ok(b2 >= b1);
    });

    it('caps at maxMs', () => {
      for (let i = 0; i < 10; i++) {
        const b = computeBackoff(10, 1000, 5000);
        assert.ok(b <= 5000, `backoff ${b} exceeded cap`);
      }
    });

    it('adds jitter', () => {
      const results = new Set();
      for (let i = 0; i < 10; i++) results.add(computeBackoff(1));
      assert.ok(results.size > 1, 'jitter should produce variation');
    });
  });

  describe('isRetriableError', () => {
    it('returns true for timeout', () => {
      assert.ok(isRetriableError(new Error('timeout')));
    });
    it('returns true for rate limit', () => {
      assert.ok(isRetriableError(new Error('rate limit exceeded')));
    });
    it('returns false for other errors', () => {
      assert.ok(!isRetriableError(new Error('not found')));
    });
    it('handles null', () => {
      assert.ok(!isRetriableError(null));
    });
  });

  describe('computeNextRun', () => {
    it('returns null when at max attempts', () => {
      assert.strictEqual(computeNextRun(3, 3), null);
    });
    it('returns future date when within limits', () => {
      const next = computeNextRun(1, 3);
      assert.ok(next instanceof Date);
      assert.ok(next.getTime() > Date.now());
    });
  });

  describe('classifyError', () => {
    it('classifies timeout as retriable', () => {
      assert.strictEqual(classifyError(new Error('timeout')), 'retriable');
    });
    it('classifies generic error as permanent', () => {
      assert.strictEqual(classifyError(new Error('invalid input')), 'permanent');
    });
  });
});
