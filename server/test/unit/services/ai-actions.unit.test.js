import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAIAction, ALLOWED_AI_ACTIONS, RESTRICTED_AI_ACTIONS } from '../../../src/services/ai-actions.service.js';

describe('ai-actions service', () => {
  it('allows known safe actions with workspace scope', () => {
    const result = validateAIAction({
      workspaceId: 'workspace-1',
      actionType: 'search_product',
      input: {},
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.validationErrors, []);
    assert.equal(ALLOWED_AI_ACTIONS.has('search_product'), true);
  });

  it('requires workspace scope', () => {
    const result = validateAIAction({ actionType: 'search_product', input: {} });

    assert.equal(result.valid, false);
    assert.ok(result.validationErrors.includes('workspace_id is required'));
  });

  it('rejects restricted payment/admin actions', () => {
    const result = validateAIAction({
      workspaceId: 'workspace-1',
      actionType: 'mark_payment_paid',
      input: {},
    });

    assert.equal(result.valid, false);
    assert.equal(RESTRICTED_AI_ACTIONS.has('mark_payment_paid'), true);
    assert.ok(result.validationErrors.some((message) => message.includes('restricted')));
  });

  it('requires outlet scope for commerce mutations', () => {
    const result = validateAIAction({
      workspaceId: 'workspace-1',
      actionType: 'add_to_cart',
      input: { productId: 'product-1' },
    });

    assert.equal(result.valid, false);
    assert.ok(result.validationErrors.includes('outlet_id is required for commerce AI action'));
  });

  it('allows commerce mutations when outlet scope is present', () => {
    const result = validateAIAction({
      workspaceId: 'workspace-1',
      actionType: 'start_checkout',
      input: { outletId: 'outlet-1' },
    });

    assert.equal(result.valid, true);
  });
});
