import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkOperation, runBaseline } from '../../../src/ai/performance/benchmark-harness.js';
import { resetBudget, consumeModelBudget, consumeToolBudget, getRemaining, isExhausted } from '../../../src/ai/performance/time-budget.js';
import { createLangChainAdapter } from '../../../src/ai/orchestration/langchain-adapter.js';
import { routeToSpecialist, SPECIALIST_ROLES } from '../../../src/ai/orchestration/specialist-router.js';

describe('benchmarkHarness', () => {
  it('benchmarkOperation returns stats', async () => {
    const result = await benchmarkOperation('test', async () => 1 + 1, 3);
    assert.equal(result.label, 'test');
    assert.equal(result.samples, 3);
    assert.ok(result.avg >= 0);
    assert.ok(result.p50 >= 0);
  });
});

describe('timeBudget', () => {
  it('resetBudget sets initial budget', () => {
    resetBudget({ totalTurnMs: 50000 });
    resetBudget({ totalTurnMs: 50000 });
    assert.equal(getRemaining(), 50000);
  });

  it('consumeModelBudget reduces remaining', () => {
    resetBudget({ totalTurnMs: 1000 });
    const { consumed, remaining } = consumeModelBudget(300);
    assert.equal(consumed, 300);
    assert.equal(remaining, 700);
  });

  it('consumeToolBudget reduces remaining', () => {
    resetBudget({ totalTurnMs: 1000 });
    consumeToolBudget(400);
    assert.equal(getRemaining(), 600);
  });

  it('isExhausted returns true when budget depleted', () => {
    resetBudget({ totalTurnMs: 100 });
    consumeModelBudget(100);
    assert.equal(isExhausted(), true);
  });
});

describe('langChainAdapter', () => {
  it('returns unconfigured status by default', () => {
    const adapter = createLangChainAdapter();
    assert.equal(adapter.status, 'unconfigured');
    assert.equal(adapter.isConfigured(), false);
  });

  it('prepareMessages returns combined array', async () => {
    const adapter = createLangChainAdapter();
    const result = await adapter.prepareMessages({
      systemMessages: [{ role: 'system', content: 'test' }],
      conversationMessages: [{ role: 'user', content: 'hello' }],
    });
    assert.equal(result.length, 2);
  });
});

describe('specialistRouter', () => {
  it('defines 5 specialist roles', () => {
    assert.equal(Object.keys(SPECIALIST_ROLES).length, 5);
  });

  it('routes commerce intent correctly', () => {
    const result = routeToSpecialist({ intent: 'commerce', fallbackAgent: { id: 'a1' } });
    assert.equal(result.useFallback, false);
    assert.ok(result.specialist.toolAllowlist.includes('search_products'));
    assert.ok(result.specialist.toolAllowlist.includes('add_cart_item'));
  });

  it('routes support intent correctly', () => {
    const result = routeToSpecialist({ intent: 'support', fallbackAgent: { id: 'a1' } });
    assert.equal(result.useFallback, false);
    assert.ok(result.specialist.toolAllowlist.includes('handover_to_human'));
  });

  it('falls back to primary agent for unknown intent', () => {
    const result = routeToSpecialist({ intent: 'unknown_intent', fallbackAgent: { id: 'a1' } });
    assert.equal(result.useFallback, true);
    assert.equal(result.specialist, null);
  });

  it('order_status has read-only tools', () => {
    const result = routeToSpecialist({ intent: 'order_status', fallbackAgent: {} });
    assert.equal(result.useFallback, false);
    assert.ok(result.specialist.toolAllowlist.every((t) => t.startsWith('get_')));
  });
});
