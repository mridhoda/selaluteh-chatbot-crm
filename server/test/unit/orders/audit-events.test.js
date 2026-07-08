import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitiveDetails } from '../../../src/services/audit.service.js';
import { FulfillmentStatus, ORDER_ERRORS, PaymentStatus } from '../../../src/orders/order-types.js';
import { startPreparing } from '../../../src/services/order.service.js';
import { ordersRepository, auditLogsRepository } from '../../../src/db/repositories/index.js';

describe('audit: cart-order-lifecycle', () => {
  it('redacts sensitive details', () => {
    const redacted = redactSensitiveDetails({
      amount: 50000,
      api_key: 'sk_live_xxx',
      webhook_secret: 'whsec_xxx',
    });
    assert.match(JSON.stringify(redacted), /REDACTED/);
  });

  it('redacts secret keys, raw auth headers, and unsafe provider payloads', () => {
    const redacted = redactSensitiveDetails({
      secret_key: 'sk_live_abc123456789',
      webhook_secret: 'whsec_abc123456789',
      raw_auth_headers: { authorization: 'Bearer abcdefghijklmnop' },
      raw_provider_payload: { invoice_id: 'INV-123', nested: { api_key: 'hidden' } },
      safe: { status: 'manual_review' },
    });

    assert.equal(redacted.secret_key, '[REDACTED]');
    assert.equal(redacted.webhook_secret, '[REDACTED]');
    assert.equal(redacted.raw_auth_headers, '[REDACTED]');
    assert.equal(redacted.raw_provider_payload, '[REDACTED]');
    assert.deepEqual(redacted.safe, { status: 'manual_review' });
  });

  it('records order status transition audit events', async (t) => {
    t.mock.method(ordersRepository, 'workspaceFindById', async () => ({
      id: 'order-1',
      outletId: 'outlet-1',
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.ACCEPTED,
    }));
    t.mock.method(ordersRepository, 'atomicFulfillmentStatusUpdate', async () => ({
      id: 'order-1',
      outletId: 'outlet-1',
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PREPARING,
    }));
    t.mock.method(ordersRepository, 'addTimelineEntry', async () => ({}));
    t.mock.method(auditLogsRepository, 'log', async (entry) => entry);

    await startPreparing({ workspaceId: 'workspace-1', orderId: 'order-1', outletId: 'outlet-1', userId: 'user-1' });

    const auditCall = auditLogsRepository.log.mock.calls[0].arguments[0];
    assert.equal(auditCall.action, 'order.preparing');
    assert.equal(auditCall.resourceType, 'order');
    assert.equal(auditCall.resourceId, 'order-1');
    assert.deepEqual(auditCall.details, { fromStatus: FulfillmentStatus.ACCEPTED, toStatus: FulfillmentStatus.PREPARING });
  });

  it('preserves non-sensitive details', () => {
    const redacted = redactSensitiveDetails({
      orderNumber: 'ORD-001',
      total: 50000,
      currency: 'IDR',
    });
    assert.strictEqual(redacted.orderNumber, 'ORD-001');
    assert.strictEqual(redacted.total, 50000);
  });

  it('handles null/undefined safely', () => {
    const redacted = redactSensitiveDetails(null);
    assert.strictEqual(redacted, null);
  });

  it('defines ORDER_ERRORS for all critical states', () => {
    const codes = Object.values(ORDER_ERRORS).map(e => e.code);
    assert.ok(codes.includes('CART_NOT_FOUND'));
    assert.ok(codes.includes('ORDER_NOT_FOUND'));
    assert.ok(codes.includes('ORDER_INVALID_TRANSITION'));
    assert.ok(codes.includes('ORDER_PAYMENT_NOT_PAID'));
    assert.ok(codes.includes('OUTLET_NOT_ACCEPTING_ORDERS'));
    assert.ok(codes.includes('ORDER_PRICING_CHANGED'));
    assert.ok(codes.includes('VERSION_CONFLICT'));
    assert.ok(codes.includes('ORDER_INVENTORY_COMMIT_FAILED'));
  });
});
