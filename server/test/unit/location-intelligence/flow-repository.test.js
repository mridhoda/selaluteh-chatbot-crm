import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFlowRepository, buildMemoryRepo } from '../../../src/services/location-intelligence/flow-repository.js';

describe('FlowRepository — Section 2.5', () => {
  it('creates and reads flow', async () => {
    const repo = createFlowRepository(buildMemoryRepo());
    const flow = await repo.create({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1' });
    const read = await repo.getById(flow.flowId);
    assert.equal(read.workspaceId, 'ws-1');
  });

  it('rejects create without workspace', async () => {
    const repo = createFlowRepository(buildMemoryRepo());
    await assert.rejects(() => repo.create({ contactId: 'c-1' }), /workspace/);
  });

  it('duplicate message idempotent', async () => {
    const repo = createFlowRepository(buildMemoryRepo());
    const flow = await repo.create({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', lastMessageId: 'msg-1' });
    const dup = await repo.create({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', lastMessageId: 'msg-1' });
    assert.equal(dup.flowId, flow.flowId);
  });

  it('cross-workspace access denied', async () => {
    const repo = createFlowRepository(buildMemoryRepo());
    const flow = await repo.create({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1' });
    const read = await repo.getById(flow.flowId, 'ws-2');
    assert.equal(read, null);
  });

  it('expiry returns null for expired flow', async () => {
    const repo = createFlowRepository(buildMemoryRepo());
    const flow = await repo.create({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1' });
    flow.expiresAt = new Date(Date.now() - 1000).toISOString();
    const expired = await repo.getById(flow.flowId);
    assert.equal(expired, null);
  });

  it('delete works', async () => {
    const repo = createFlowRepository(buildMemoryRepo());
    const flow = await repo.create({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1' });
    await repo.delete(flow.flowId);
    const read = await repo.getById(flow.flowId);
    assert.equal(read, null);
  });
});
