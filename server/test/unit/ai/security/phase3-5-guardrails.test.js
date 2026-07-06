import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createAIActionConfirmation,
  consumeAIActionConfirmation,
  buildPayloadHash,
} from '../../../../src/ai/security/confirmation-guard.js';
import {
  classifyCommerceAmbiguity,
  buildCheckoutSummaryConfirmation,
  buildOutletRecommendation,
  confirmRecommendedOutlet,
} from '../../../../src/ai/security/commerce-confirmation.js';
import {
  searchCustomerVisibleProducts,
  assertOutletOrderable,
  addCanonicalCartItem,
  buildCartVersionIdempotencyKey,
  assertPickupCheckout,
} from '../../../../src/ai/security/commerce-guardrails.js';
import {
  assertPaymentProviderAuthority,
  assertPaymentSnapshot,
  assertPaidOnlyFromVerifiedProvider,
  assertCanonicalOrderCreation,
} from '../../../../src/ai/security/payment-order-guardrails.js';

describe('AISG Phase 3 confirmation guard', () => {
  it('creates opaque single-use confirmation bound to context and payload hash', async () => {
    const confirmation = await createAIActionConfirmation({
      context: { workspaceId: 'ws-1', channelConnectionId: 'conn-1', conversationId: 'chat-1', activeCartId: 'cart-1', cartVersion: 3 },
      action: 'add_cart_item',
      payload: { productId: 'p1', quantity: 2 },
      stateVersion: 'cart-1:3',
    });

    assert.match(confirmation.token, /^aic_/);
    assert.equal(confirmation.payloadHash, buildPayloadHash({ productId: 'p1', quantity: 2 }));

    const consumed = await consumeAIActionConfirmation({
      token: confirmation.token,
      context: { workspaceId: 'ws-1', channelConnectionId: 'conn-1', conversationId: 'chat-1', activeCartId: 'cart-1', cartVersion: 3 },
      action: 'add_cart_item',
      payload: { productId: 'p1', quantity: 2 },
      stateVersion: 'cart-1:3',
    });
    assert.equal(consumed.valid, true);

    const reused = await consumeAIActionConfirmation({
      token: confirmation.token,
      context: { workspaceId: 'ws-1', channelConnectionId: 'conn-1', conversationId: 'chat-1', activeCartId: 'cart-1', cartVersion: 3 },
      action: 'add_cart_item',
      payload: { productId: 'p1', quantity: 2 },
      stateVersion: 'cart-1:3',
    });
    assert.equal(reused.valid, false);
    assert.equal(reused.reason, 'already_consumed');
  });

  it('prevents hypothetical/menu requests from mutating and separates recommendations from selection', () => {
    assert.equal(classifyCommerceAmbiguity('berapa harga teh susu kalau beli 2?').mutationAllowed, false);
    const recommendation = buildOutletRecommendation({ outlet: { id: 'outlet-1', name: 'SelaluTeh A' } });
    assert.equal(recommendation.selectedOutletId, null);
    assert.equal(confirmRecommendedOutlet({ recommendation, customerConfirmedOutletId: 'outlet-1' }).selectedOutletId, 'outlet-1');
  });

  it('builds canonical checkout summary confirmation from server cart', () => {
    const summary = buildCheckoutSummaryConfirmation({ cart: { id: 'cart-1', version: 2, outletId: 'outlet-1', items: [{ name: 'Teh Susu', quantity: 2, effectivePrice: 10000, subtotal: 20000 }], total: 20000 } });
    assert.equal(summary.action, 'checkout_cart');
    assert.equal(summary.totalAmount, 20000);
    assert.match(summary.confirmationText, /Teh Susu/);
  });
});

describe('AISG Phase 4 product, outlet, cart, and pricing guards', () => {
  it('searches only active customer-visible products with outlet-aware effective pricing', () => {
    const products = searchCustomerVisibleProducts({
      query: 'teh',
      products: [
        { id: 'p1', name: 'Teh Susu', isActive: true, customerVisible: true, basePrice: 10000 },
        { id: 'p2', name: 'Hidden Tea', isActive: true, customerVisible: false, basePrice: 1 },
      ],
      availability: [{ productId: 'p1', outletId: 'outlet-1', isAvailable: true, priceOverride: 12000 }],
      outletId: 'outlet-1',
    });
    assert.deepEqual(searchesToIds(searchProductsShape(searchesToIds, products)), ['p1']);
    assert.equal(products[0].effectivePrice, 12000);
  });

  it('fails closed for non-orderable outlets and validates cart invariants', () => {
    assert.throws(() => assertOutletOrderable({ id: 'o1', status: 'inactive', pickupEnabled: true, channelAssigned: true }), /OUTLET_NOT_ORDERABLE/);
    const cart = addCanonicalCartItem({ cart: { outletId: 'o1', items: [] }, outletId: 'o1', product: { id: 'p1', name: 'Teh', basePrice: 10000, isActive: true }, quantity: 2, availability: { isAvailable: true, priceOverride: 9000 } });
    assert.equal(cart.items[0].effectivePrice, 9000);
    const merged = addCanonicalCartItem({ cart, outletId: 'o1', product: { id: 'p1', name: 'Teh', basePrice: 10000, isActive: true }, quantity: 3, availability: { isAvailable: true, priceOverride: 9000 } });
    assert.equal(merged.items[0].quantity, 5);
    assert.throws(() => addCanonicalCartItem({ cart: merged, outletId: 'o1', product: { id: 'p2', name: 'X', basePrice: 1, isActive: true }, quantity: 1000, availability: { isAvailable: true } }), /QUANTITY_LIMIT_EXCEEDED/);
  });

  it('uses central freshness/idempotency and pickup checkout rules', () => {
    assert.equal(buildCartVersionIdempotencyKey({ cartId: 'cart-1', cartVersion: 7 }), 'checkout:cart-1:v7');
    assert.doesNotThrow(() => assertPickupCheckout({ fulfillmentSnapshot: { method: 'pickup' }, selectedOutletId: 'outlet-1' }));
    assert.throws(() => assertPickupCheckout({ fulfillmentSnapshot: { method: 'delivery' }, selectedOutletId: 'outlet-1' }), /PICKUP_ONLY/);
  });
});

describe('AISG Phase 5 checkout, order, payment, and fulfillment guards', () => {
  it('enforces workspace payment provider authority and payment snapshots', () => {
    assert.equal(assertPaymentProviderAuthority({ runtimeProvider: 'bayargg', requestedProvider: 'xendit' }).provider, 'bayargg');
    assert.doesNotThrow(() => assertPaymentSnapshot({ amount: 20000, currency: 'IDR', expiresAt: new Date(Date.now() + 60000) }));
    assert.throws(() => assertPaymentSnapshot({ amount: 0, currency: 'USD', expiresAt: new Date(Date.now() - 1) }), /INVALID_PAYMENT_AMOUNT/);
  });

  it('allows PAID only from verified provider paths and canonical order creation only', () => {
    assert.doesNotThrow(() => assertPaidOnlyFromVerifiedProvider({ source: 'verified_webhook', verified: true }));
    assert.throws(() => assertPaidOnlyFromVerifiedProvider({ source: 'ai_tool', verified: false }), /PAYMENT_PAID_AUTHORITY_REQUIRED/);
    assert.doesNotThrow(() => assertCanonicalOrderCreation({ source: 'cart_checkout_order', checkoutId: 'checkout-1' }));
    assert.throws(() => assertCanonicalOrderCreation({ source: 'create_legacy_order' }), /ORDER_CANONICAL_FLOW_REQUIRED/);
  });
});

function searchesToIds(items) {
  return items.map((item) => item.id);
}

function searchProductsShape(_mapper, items) {
  return items;
}
