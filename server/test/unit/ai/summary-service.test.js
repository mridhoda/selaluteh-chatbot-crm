import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSummary, shouldSummarize } from '../../../src/ai/memory/summary-service.js';

describe('validateSummary', () => {
  it('accepts valid summary', () => {
    const result = validateSummary({
      customerGoal: 'Membeli teh',
      resolvedFacts: ['Suka teh manis'],
      pendingQuestions: [],
      selectedOutletReference: null,
      cartContext: [],
      supportIssue: null,
      commitmentsMade: [],
      doNotRepeat: [],
      lastState: 'browsing',
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects non-object', () => {
    const result = validateSummary(null);
    assert.equal(result.valid, false);
  });

  it('rejects missing required fields', () => {
    const result = validateSummary({ customerGoal: 'test' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
});

describe('shouldSummarize', () => {
  it('returns false below threshold', () => {
    assert.equal(shouldSummarize({ messagesSinceLastSummary: 5 }), false);
  });

  it('returns true at threshold', () => {
    assert.equal(shouldSummarize({ messagesSinceLastSummary: 12 }), true);
  });

  it('respects custom threshold', () => {
    assert.equal(shouldSummarize({ messagesSinceLastSummary: 5, config: { newMessageThreshold: 3 } }), true);
    assert.equal(shouldSummarize({ messagesSinceLastSummary: 2, config: { newMessageThreshold: 3 } }), false);
  });
});
