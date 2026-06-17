import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import AIAction from '../../../src/models/AIAction.js';
import {
  executeAIAction,
  proposeAIAction,
  validateAIAction,
} from '../../../src/services/ai-actions.service.js';
import { clearTestDb, connectTestDb, disconnectTestDb, objectId } from '../../helpers/mongoMemory.js';

describe('AI action guardrails', () => {
  before(connectTestDb);
  afterEach(clearTestDb);
  after(disconnectTestDb);

  it('allows known non-sensitive AI actions', () => {
    const result = validateAIAction({
      workspaceId: objectId(),
      actionType: 'search_product',
      input: { query: 'teh' },
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.validationErrors, []);
  });

  it('rejects restricted payment/order state actions', () => {
    const result = validateAIAction({
      workspaceId: objectId(),
      actionType: 'mark_payment_paid',
      input: { orderId: objectId() },
    });

    assert.equal(result.valid, false);
    assert.match(result.validationErrors.join(' '), /restricted/);
  });

  it('rejects unknown action types', () => {
    const result = validateAIAction({
      workspaceId: objectId(),
      actionType: 'teleport_order',
    });

    assert.equal(result.valid, false);
    assert.match(result.validationErrors.join(' '), /not allowed/);
  });

  it('requires workspace id for every AI action', async () => {
    await assert.rejects(
      () => proposeAIAction({ actionType: 'search_product', input: { query: 'teh' } }),
      /workspace_id is required/,
    );
  });

  it('requires outlet id for commerce actions that need outlet context', () => {
    const result = validateAIAction({
      workspaceId: objectId(),
      actionType: 'add_to_cart',
      input: { productId: objectId(), quantity: 1 },
    });

    assert.equal(result.valid, false);
    assert.match(result.validationErrors.join(' '), /outlet_id is required/);
  });

  it('logs rejected AI action proposals', async () => {
    const workspaceId = objectId();
    const result = await proposeAIAction({
      workspaceId,
      actionType: 'refund_payment',
      input: { paymentId: objectId() },
    });

    const row = await AIAction.findById(result.action._id);

    assert.equal(result.valid, false);
    assert.equal(row.status, 'rejected');
    assert.equal(row.workspaceId.toString(), workspaceId.toString());
    assert.match(row.validationErrors.join(' '), /restricted/);
  });

  it('executes allowed action and records audit output', async () => {
    const workspaceId = objectId();
    const createdId = objectId();
    const result = await executeAIAction({
      workspaceId,
      chatId: objectId(),
      agentId: objectId(),
      actionType: 'create_legacy_complaint',
      input: { text: 'Keluhan customer' },
      executor: async () => ({ _id: createdId, status: 'open' }),
    });

    const row = await AIAction.findById(result.action._id);

    assert.equal(result.valid, true);
    assert.equal(row.status, 'executed');
    assert.equal(row.output._id.toString(), createdId.toString());
    assert.equal(row.output.status, 'open');
    assert.ok(row.executedAt);
  });

  it('records failed allowed action execution', async () => {
    const result = await executeAIAction({
      workspaceId: objectId(),
      actionType: 'create_legacy_order',
      input: { formName: 'Order' },
      executor: async () => {
        throw new Error('executor failed');
      },
    });

    const row = await AIAction.findById(result.action._id);

    assert.equal(result.valid, false);
    assert.equal(row.status, 'failed');
    assert.match(row.error, /executor failed/);
  });
});
