import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRouter } from '../../../src/ai/orchestration/agent-router.js';
import { createModelRouter } from '../../../src/ai/orchestration/model-router.js';
import { createToolGateway } from '../../../src/ai/tools/tool-gateway.js';

const sampleTools = [
  { name: 'search_products', permission: 'commerce_read', mutation: false, confirmation: 'none' },
  { name: 'add_cart_item', permission: 'commerce_write', mutation: true, confirmation: 'customer' },
  { name: 'handover_to_human', permission: 'support', mutation: true, confirmation: 'none' },
];

describe('agentRouter', () => {
  it('returns first active agent when no agent on chat', async () => {
    const repo = {
      list: mock.fn(async () => [
        { id: 'a1', platformId: null, status: 'active' },
      ]),
      findById: mock.fn(async () => null),
    };
    const router = createAgentRouter({ repository: repo });
    const agent = await router.resolveAgent({ workspaceId: 'ws-1', chat: {} });
    assert.ok(agent);
    assert.equal(agent.id, 'a1');
  });

  it('returns chat-bound agent when present', async () => {
    const repo = {
      findById: mock.fn(async ({ agentId }) => ({ id: agentId, status: 'active' })),
      list: mock.fn(async () => []),
    };
    const router = createAgentRouter({ repository: repo });
    const agent = await router.resolveAgent({ workspaceId: 'ws-1', chat: { agentId: 'a2' } });
    assert.equal(agent.id, 'a2');
  });

  it('returns null when no active agents', async () => {
    const repo = {
      list: mock.fn(async () => []),
    };
    const router = createAgentRouter({ repository: repo });
    const agent = await router.resolveAgent({ workspaceId: 'ws-1', chat: {} });
    assert.equal(agent, null);
  });
});

describe('modelRouter', () => {
  it('returns default config when no agent settings', async () => {
    const router = createModelRouter();
    const config = await router.routeTask({ taskType: 'chat', agent: {} });
    assert.equal(config.provider, 'local_openai_compatible');
    assert.equal(config.model, 'default');
    assert.equal(config.temperature, 0.7);
  });

  it('reads provider from agent aiSettings', async () => {
    const router = createModelRouter();
    const config = await router.routeTask({ taskType: 'chat', agent: { aiSettings: { provider: 'openai', model: 'gpt-4o' } } });
    assert.equal(config.provider, 'openai');
    assert.equal(config.model, 'gpt-4o');
  });

  it('validateProvider returns true for known providers', () => {
    const router = createModelRouter();
    assert.equal(router.validateProvider('openai'), true);
    assert.equal(router.validateProvider('gemini'), true);
    assert.equal(router.validateProvider('unknown'), false);
  });
});

describe('toolGateway', () => {
  it('returns all tool definitions', () => {
    const gateway = createToolGateway({ tools: sampleTools });
    const defs = gateway.getToolDefinitions();
    assert.equal(defs.length, 3);
  });

  it('validates known tool', () => {
    const gateway = createToolGateway({ tools: sampleTools });
    const result = gateway.validateToolCall({ toolName: 'search_products', args: {}, agent: {} });
    assert.equal(result.valid, true);
  });

  it('rejects unknown tool', () => {
    const gateway = createToolGateway({ tools: sampleTools });
    const result = gateway.validateToolCall({ toolName: 'unknown_tool', args: {}, agent: {} });
    assert.equal(result.valid, false);
  });

  it('rejects tool not in agent allowlist', () => {
    const gateway = createToolGateway({ tools: sampleTools });
    const result = gateway.validateToolCall({
      toolName: 'add_cart_item', args: {}, agent: { toolPolicy: { allowlist: ['search_products'] } },
    });
    assert.equal(result.valid, false);
  });

  it('requiresConfirmation returns correct policy', () => {
    const gateway = createToolGateway({ tools: sampleTools });
    assert.equal(gateway.requiresConfirmation({ toolName: 'search_products' }), 'none');
    assert.equal(gateway.requiresConfirmation({ toolName: 'add_cart_item' }), 'customer');
  });
});
