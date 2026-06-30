import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConfirmationToken, validateConfirmation, invalidateConfirmation } from '../../../src/ai/tools/confirmation-service.js';
import { generateIdempotencyKey, checkIdempotency, setIdempotencyResult, cleanupIdempotency } from '../../../src/ai/tools/idempotency-service.js';
import { safeResult, safeError } from '../../../src/ai/tools/result-redactor.js';
import { commerceToolDefinitions, FORBIDDEN_TOOLS } from '../../../src/ai/tools/domain-tools.js';
import { createToolGateway } from '../../../src/ai/tools/tool-gateway.js';
import { memoryToolDefinitions } from '../../../src/ai/tools/memory-tools.js';

const allTools = [...commerceToolDefinitions, ...memoryToolDefinitions];

describe('confirmationService', () => {
  it('creates valid confirmation token', () => {
    const token = createConfirmationToken({ chatId: 'chat-1', contactId: 'c-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    assert.ok(token.id);
    assert.equal(token.state, 'pending');
    assert.ok(token.expiresAt > Date.now());
  });

  it('validates correct confirmation', () => {
    const token = createConfirmationToken({ chatId: 'chat-1', contactId: 'c-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    const result = validateConfirmation({ id: token.id, chatId: 'chat-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    assert.equal(result.valid, true);
  });

  it('rejects confirmation for wrong chat', () => {
    const token = createConfirmationToken({ chatId: 'chat-1', contactId: 'c-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    const result = validateConfirmation({ id: token.id, chatId: 'chat-2', toolName: 'add_cart_item', args: { productId: 'p1' } });
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'wrong_chat');
  });

  it('rejects already used confirmation', () => {
    const token = createConfirmationToken({ chatId: 'chat-1', contactId: 'c-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    validateConfirmation({ id: token.id, chatId: 'chat-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    const result = validateConfirmation({ id: token.id, chatId: 'chat-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'already_used');
  });

  it('rejects changed arguments', () => {
    const token = createConfirmationToken({ chatId: 'chat-1', contactId: 'c-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    const result = validateConfirmation({ id: token.id, chatId: 'chat-1', toolName: 'add_cart_item', args: { productId: 'p2' } });
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'args_changed');
  });

  it('invalidate removes token', () => {
    const token = createConfirmationToken({ chatId: 'chat-1', contactId: 'c-1', toolName: 'test', args: {} });
    invalidateConfirmation({ id: token.id });
    const result = validateConfirmation({ id: token.id, chatId: 'chat-1', toolName: 'test', args: {} });
    assert.equal(result.valid, false);
  });
});

describe('idempotencyService', () => {
  after(() => cleanupIdempotency());

  it('generates stable key', () => {
    const k1 = generateIdempotencyKey({ chatId: 'chat-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    const k2 = generateIdempotencyKey({ chatId: 'chat-1', toolName: 'add_cart_item', args: { productId: 'p1' } });
    assert.equal(k1, k2);
  });

  it('returns null for unknown key', () => {
    assert.equal(checkIdempotency('unknown'), null);
  });

  it('returns prior result for same key', () => {
    const key = generateIdempotencyKey({ chatId: 'chat-1', toolName: 'test', args: {} });
    setIdempotencyResult(key, { ok: true, data: { id: 'order-1' } });
    const result = checkIdempotency(key);
    assert.equal(result.ok, true);
    assert.equal(result.data.id, 'order-1');
  });
});

describe('resultRedactor', () => {
  it('redacts sensitive fields', () => {
    const result = safeResult({ token: 'secret123', name: 'Teh Manis', credentials: { apiKey: 'key123' } });
    assert.equal(result.data.token, '[REDACTED]');
    assert.equal(result.data.name, 'Teh Manis');
    assert.equal(result.data.credentials, '[REDACTED]');
  });

  it('safeError produces error shape', () => {
    const result = safeError('DB_ERROR', 'Database error');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'DB_ERROR');
    assert.equal(result.retryable, false);
  });
});

describe('domainTools', () => {
  it('exports 14 commerce tools', () => {
    assert.equal(commerceToolDefinitions.length, 14);
  });

  it('FORBIDDEN_TOOLS includes mark_payment_paid', () => {
    assert.ok(FORBIDDEN_TOOLS.has('mark_payment_paid'));
  });

  it('payment tools are all read-only (get_payment_status, get_payment_methods)', () => {
    const paymentRead = commerceToolDefinitions.filter((t) => t.name.startsWith('get_payment'));
    paymentRead.forEach((t) => assert.equal(t.confirmation, 'none'));
  });

  it('create_payment_link is idempotent', () => {
    const tool = commerceToolDefinitions.find((t) => t.name === 'create_payment_link');
    assert.equal(tool.idempotent, true);
  });

  it('handover_to_human is mutation without confirmation', () => {
    const tool = commerceToolDefinitions.find((t) => t.name === 'handover_to_human');
    assert.equal(tool.mutation, true);
    assert.equal(tool.confirmation, 'none');
  });
});
