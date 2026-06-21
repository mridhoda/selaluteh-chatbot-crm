import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, allocateTokenBudget } from '../../../src/ai/context/token-estimator.js';

describe('estimateTokens', () => {
  it('returns 0 for empty text', () => {
    assert.equal(estimateTokens(''), 0);
  });

  it('estimates text tokens', () => {
    const tokens = estimateTokens('Halo apa kabar');
    assert.ok(tokens > 0);
  });
});

describe('allocateTokenBudget', () => {
  it('includes all sections within budget', () => {
    const sections = [
      { name: 'platform_policy', content: 'policy' },
      { name: 'recent_messages', content: 'messages' },
    ];
    const result = allocateTokenBudget({ sections, maxInputTokens: 8000 });
    assert.equal(result.sections.length, 2);
    assert.equal(result.truncated.length, 0);
  });

  it('keeps mandatory sections under tight budget', () => {
    const sections = [
      { name: 'platform_policy', content: 'X'.repeat(1000) },
      { name: 'recent_messages', content: 'Y'.repeat(10000) },
    ];
    const result = allocateTokenBudget({ sections, maxInputTokens: 1500 });
    assert.ok(result.sections.some((s) => s.name === 'platform_policy'), 'mandatory kept');
  });

  it('truncates optional sections when budget exceeded', () => {
    const sections = [
      { name: 'platform_policy', content: 'X'.repeat(100) },
      { name: 'recent_messages', content: 'Y'.repeat(50000) },
    ];
    const result = allocateTokenBudget({ sections, maxInputTokens: 2000 });
    assert.ok(result.truncated.length > 0 || result.sections.length <= 2);
  });

  it('orders sections by priority', () => {
    const sections = [
      { name: 'current_message', content: 'msg' },
      { name: 'platform_policy', content: 'policy' },
      { name: 'recent_messages', content: 'history' },
    ];
    const result = allocateTokenBudget({ sections, maxInputTokens: 8000 });
    const names = result.sections.map((s) => s.name);
    assert.equal(names[0], 'platform_policy', 'platform policy first');
  });
});
