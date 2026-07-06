import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_MODES } from '../../../../src/ai/security/agent-mode.js';
import {
  RESTRICTED_ACTIONS,
  evaluateRestrictedActionPolicy,
} from '../../../../src/ai/security/restricted-action-policy.js';
import {
  createAIToolRegistry,
} from '../../../../src/ai/tools/tool-registry.js';
import {
  createToolGateway,
  validateToolPayloadSchema,
} from '../../../../src/ai/tools/tool-gateway.js';
import {
  stripLegacyAIActionMarkers,
} from '../../../../src/services/ai.service.js';
import {
  normalizeToolResult,
} from '../../../../src/ai/tools/result-redactor.js';

const testTools = [
  {
    name: 'search_products',
    description: 'Search products',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    permission: 'commerce_read',
    confirmation: 'none',
    mutation: false,
    timeoutMs: 1000,
  },
  {
    name: 'add_cart_item',
    description: 'Add cart item',
    inputSchema: {
      type: 'object',
      properties: { productId: { type: 'string' }, quantity: { type: 'integer', minimum: 1 } },
      required: ['productId', 'quantity'],
    },
    permission: 'commerce_write',
    confirmation: 'customer',
    mutation: true,
    timeoutMs: 1000,
  },
];

describe('AISG Phase 2 versioned tool registry', () => {
  it('exposes immutable versioned tool definitions', () => {
    const registry = createAIToolRegistry({ version: 'aisg-v1', tools: testTools });
    const definitions = registry.listDefinitions();

    assert.equal(registry.version, 'aisg-v1');
    assert.equal(definitions.length, 2);
    assert.equal(Object.isFrozen(definitions[0]), true);
    assert.equal(registry.get('search_products').name, 'search_products');
  });
});

describe('AISG Phase 2 deny-by-default tool gateway', () => {
  it('denies known tools unless server policy explicitly allowlists them', () => {
    const gateway = createToolGateway({ tools: testTools });

    const denied = gateway.validateToolCall({
      toolName: 'search_products',
      args: { query: 'teh' },
      agent: { mode: AGENT_MODES.COMMERCE_READ },
    });
    assert.equal(denied.valid, false);
    assert.equal(denied.code, 'AI_TOOL_DENIED_BY_DEFAULT');

    const allowed = gateway.validateToolCall({
      toolName: 'search_products',
      args: { query: 'teh' },
      agent: { mode: AGENT_MODES.COMMERCE_READ, toolPolicy: { allowlist: ['search_products'] } },
    });
    assert.equal(allowed.valid, true);
  });

  it('rejects unknown fields and model-supplied authority fields', () => {
    const gateway = createToolGateway({ tools: testTools });

    assert.throws(
      () => validateToolPayloadSchema({ tool: testTools[0], args: { query: 'teh', extra: true } }),
      /AI_TOOL_SCHEMA_UNKNOWN_FIELD/,
    );
    assert.throws(
      () => validateToolPayloadSchema({ tool: testTools[0], args: { query: 'teh', workspaceId: 'evil' } }),
      /AI_TOOL_AUTHORITY_FIELD_REJECTED/,
    );

    const result = gateway.validateToolCall({
      toolName: 'search_products',
      args: { query: 'teh', extra: true },
      agent: { toolPolicy: { allowlist: ['search_products'] } },
    });
    assert.equal(result.valid, false);
    assert.equal(result.code, 'AI_TOOL_SCHEMA_UNKNOWN_FIELD');
  });

  it('applies tool iteration, payload, timeout, and dependency circuit breaker limits', async () => {
    const dependency = { allowRequest: () => false };
    const gateway = createToolGateway({ tools: testTools, limits: { maxToolCalls: 1, maxPayloadBytes: 30 }, dependencyBreakers: { search_products: dependency } });
    const agent = { toolPolicy: { allowlist: ['search_products'] } };

    const first = gateway.validateToolCall({ toolName: 'search_products', args: { query: 'teh' }, agent });
    assert.equal(first.valid, false);
    assert.equal(first.code, 'AI_TOOL_DEPENDENCY_UNAVAILABLE');

    const healthyGateway = createToolGateway({ tools: testTools, limits: { maxToolCalls: 1, maxPayloadBytes: 30 } });
    const execution = await healthyGateway.executeToolCall({
      toolName: 'search_products',
      args: { query: 'teh' },
      agent,
      executor: mock.fn(async () => ({ products: [] })),
    });
    assert.equal(execution.ok, true);

    const second = await healthyGateway.executeToolCall({
      toolName: 'search_products',
      args: { query: 'teh' },
      agent,
      executor: mock.fn(async () => ({ products: [] })),
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, 'AI_TOOL_LIMIT_EXCEEDED');
  });
});

describe('AISG Phase 2 policy and safe result normalizer', () => {
  it('deterministically blocks restricted payment/admin actions', () => {
    assert.ok(RESTRICTED_ACTIONS.has('mark_payment_paid'));
    const decision = evaluateRestrictedActionPolicy({ action: 'mark_payment_paid' });
    assert.equal(decision.allowed, false);
    assert.equal(decision.code, 'AI_RESTRICTED_ACTION_DENIED');
  });

  it('normalizes results without secrets or internal stack traces', () => {
    const ok = normalizeToolResult({ token: 'secret', products: [{ name: 'Teh Susu' }] });
    assert.equal(ok.ok, true);
    assert.equal(ok.data.token, '[REDACTED]');

    const error = normalizeToolResult(new Error('database password leaked'), { fallbackMessage: 'Data belum bisa dimuat.' });
    assert.equal(error.ok, false);
    assert.equal(error.userSafeMessage, 'Data belum bisa dimuat.');
    assert.equal(error.data, null);
  });

  it('strips legacy AI mutation markers before customer-facing output', () => {
    const reply = stripLegacyAIActionMarkers('FILE_ORDER_JSON: {"formName":"Order"}\nPesanan diterima');
    assert.equal(reply, 'Pesanan diterima');
  });
});
