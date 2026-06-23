import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitiveDetails } from '../../../src/services/audit.service.js';
import { ORDER_ERRORS } from '../../../src/orders/order-types.js';

describe('audit: cart-order-lifecycle', () => {
  it('redacts sensitive details', () => {
    const redacted = redactSensitiveDetails({
      amount: 50000,
      api_key: 'sk_live_xxx',
      webhook_secret: 'whsec_xxx',
    });
    assert.match(JSON.stringify(redacted), /REDACTED/);
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
