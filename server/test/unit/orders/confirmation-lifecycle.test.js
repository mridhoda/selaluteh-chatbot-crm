import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { derivePublicOrderStatus, FulfillmentStatus, OrderStatus, PaymentStatus } from '../../../src/orders/order-types.js';

describe('public order confirmation lifecycle', () => {
  it('shows confirmation before payment and payment pending after outlet acceptance', () => {
    assert.equal(derivePublicOrderStatus({
      status: OrderStatus.AWAITING_OUTLET_APPROVAL,
      fulfillmentStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
      paymentStatus: PaymentStatus.UNPAID,
    }), 'unconfirmed');
    assert.equal(derivePublicOrderStatus({
      status: OrderStatus.APPROVED,
      fulfillmentStatus: FulfillmentStatus.ACCEPTED,
      paymentStatus: PaymentStatus.UNPAID,
    }), 'unpaid');
  });
});
