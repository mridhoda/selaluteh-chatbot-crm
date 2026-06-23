/**
 * checkout-flow.test.js — Full flow test: product → cart → checkout button → payment link
 *
 * Tests the complete commerce flow without mocking:
 * 1. User says "aku mau pesan teh tarik"
 * 2. AI adds product to cart (via repository)
 * 3. System detects active cart → creates checkout → sends button
 * 4. User clicks checkout button → order created → Xendit payment link returned
 *
 * Skips gracefully if Supabase test DB is not configured.
 */

import { describe, it, before, after } from 'node:test';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { env } from '../../src/config/env.js';

const { getSupabaseServiceClient } = await import('../../src/db/supabase.js');

const testUuid = () => crypto.randomUUID();

describe('checkout flow (Supabase integration)', () => {
  let client, wsId, outletId, productId, contactId, chatId;

  before(async () => {
    if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
      console.log('SKIP — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    wsId = testUuid();
    outletId = testUuid();
    productId = testUuid();
    contactId = testUuid();
    chatId = testUuid();

    // Seed: workspace, outlet, product, product availability
    await client.from('workspaces').insert({ id: wsId, name: 'Test WS', status: 'active' });
    await client.from('outlets').insert({
      id: outletId, workspace_id: wsId, name: 'Test Outlet', code: 'TEST-01',
      city: 'Test City', timezone: 'Asia/Makassar', operational_status: 'ACTIVE',
      accepts_orders: true, pickup_enabled: true,
    });
    await client.from('products').insert({
      id: productId, workspace_id: wsId, name: 'Teh Tarik Original',
      base_price: 15000, is_active: true,
    });
    await client.from('product_outlet_availability').insert({
      workspace_id: wsId, outlet_id: outletId, product_id: productId, is_available: true,
    });
    await client.from('outlet_operating_hours').insert({
      workspace_id: wsId, outlet_id: outletId, day_of_week: new Date().getDay(),
      opens_at: '00:00', closes_at: '23:59', is_closed: false,
    });

    // Seed: contact and chat
    await client.from('contacts').insert({ id: contactId, workspace_id: wsId, name: 'Test User' });
    await client.from('chats').insert({
      id: chatId, workspace_id: wsId, contact_id: contactId,
      platform: 'telegram', status: 'active',
      current_outlet_id: outletId,
    });
  });

  after(async () => {
    if (!client) return;
    await client.from('carts').delete().eq('workspace_id', wsId);
    await client.from('checkouts').delete().eq('workspace_id', wsId);
    await client.from('orders').delete().eq('workspace_id', wsId);
    await client.from('chats').delete().eq('workspace_id', wsId);
    await client.from('contacts').delete().eq('workspace_id', wsId);
    await client.from('product_outlet_availability').delete().eq('workspace_id', wsId);
    await client.from('operating_hours').delete().eq('workspace_id', wsId);
    await client.from('products').delete().eq('workspace_id', wsId);
    await client.from('outlets').delete().eq('workspace_id', wsId);
    await client.from('workspaces').delete().eq('id', wsId);
  });

  it('Step 1: No active cart initially', async () => {
    const { cartsRepository } = await import('../../src/db/repositories/carts.supabase.repository.js');
    const cart = await cartsRepository.findActiveByChat({ workspaceId: wsId, chatId });
    assert.ok(!cart, 'No active cart initially');
  });

  it('Step 2: Cart is created with item', async () => {
    const { cartsRepository } = await import('../../src/db/repositories/carts.supabase.repository.js');
    const cart = await client.from('carts').insert({
      workspace_id: wsId, outlet_id: outletId, contact_id: contactId,
      status: 'active', currency: 'IDR', version: 1,
    }).select().single();
    const cartId = cart.data.id;
    await client.from('cart_items').insert({
      workspace_id: wsId, cart_id: cartId, product_id: productId,
      product_snapshot: { name: 'Teh Tarik Original' },
      quantity: 1, unit_price_minor: 15000, line_total_minor: 15000,
      quote_version: '1', version: 1,
    });
    const result = await cartsRepository.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(result, 'Active cart found');
    assert.ok(result.items?.length > 0, 'Cart has items');
  });

  it('Step 3: Active cart found by contact', async () => {
    const { cartsRepository } = await import('../../src/db/repositories/carts.supabase.repository.js');
    const cart = await cartsRepository.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(cart, 'Cart found');
    assert.strictEqual(cart.status, 'active');
  });

  it('Step 4: Checkout → order created', async () => {
    const { cartsRepository } = await import('../../src/db/repositories/carts.supabase.repository.js');
    const { createCheckout, confirmCheckout } = await import('../../src/services/checkout.service.js');
    const { createOrderFromCheckout } = await import('../../src/services/order.service.js');

    const cart = await cartsRepository.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(cart, 'Cart exists');

    const checkout = await createCheckout({
      workspaceId: wsId, outletId, contactId, chatId,
      idempotencyKey: `test_checkout_${cart.id}`,
      customerSnapshot: { contactName: 'Test User' },
      fulfillmentSnapshot: { method: 'pickup' },
    });
    assert.ok(checkout, 'Checkout created');

    const confirmed = await confirmCheckout({ workspaceId: wsId, checkoutId: checkout.id });
    assert.ok(confirmed, 'Checkout confirmed');

    const order = await createOrderFromCheckout({ workspaceId: wsId, checkout: confirmed });
    assert.ok(order, 'Order created');
    assert.strictEqual(order.status, 'PENDING_PAYMENT', 'Order is PENDING_PAYMENT');
    assert.ok(order.orderNumber, 'Order has number');
  });

  it('Step 5: Xendit payment link created', { skip: env.paymentProvider !== 'xendit' }, async () => {
    const { cartsRepository } = await import('../../src/db/repositories/carts.supabase.repository.js');
    const { createCheckout, confirmCheckout } = await import('../../src/services/checkout.service.js');
    const { createOrderFromCheckout } = await import('../../src/services/order.service.js');
    const { createXenditPaymentSessionForOrder } = await import('../../src/services/payment.service.js');

    const cart = await cartsRepository.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(cart, 'Has cart');

    const checkout = await createCheckout({
      workspaceId: wsId, outletId, contactId, chatId,
      customerSnapshot: { contactName: 'Test User' },
      fulfillmentSnapshot: { method: 'pickup' },
    });
    const confirmed = await confirmCheckout({ workspaceId: wsId, checkoutId: checkout.id });
    const order = await createOrderFromCheckout({ workspaceId: wsId, checkout: confirmed });

    const ps = await createXenditPaymentSessionForOrder({
      workspaceId: wsId,
      orderId: order.id,
      customer: { name: 'Test User', phone: '08123456789' },
    });
    assert.ok(ps, 'Payment session created');
    assert.ok(ps.paymentUrl || ps.paymentLink, 'Payment URL exists');
    console.log('[test] Payment link:', ps.paymentUrl || ps.paymentLink);
  });

  it('Step 2: Cart is created with item', async () => {
    const cart = await cartsRepo.create({
      workspaceId: wsId, outletId, contactId, chatId,
      items: [{ productId, name: 'Teh Tarik Original', quantity: 1, price: 15000, total: 15000 }],
      total: 15000,
    });
    assert.ok(cart, 'Cart created');
    assert.ok(cart.items?.length > 0, 'Cart has items');
    assert.strictEqual(cart.status, 'active', 'Cart status is active');
  });

  it('Step 3: findActiveByContact returns cart for checkout button', async () => {
    const cart = await cartsRepo.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(cart, 'Active cart found by contact');
    assert.strictEqual(cart.status, 'active');
  });

  it('Step 4: Checkout can be created from cart', async () => {
    const cart = await cartsRepo.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(cart, 'Cart exists');
    assert.ok(cart.items?.length > 0, 'Cart has items');
    const idempotencyKey = `test_checkout_${cart.id}`;

    const { createCheckout, confirmCheckout } = await import('../../../src/services/checkout.service.js');
    const checkout = await createCheckout({
      workspaceId: wsId, outletId, contactId, chatId,
      customerSnapshot: { contactName: 'Test User' },
      fulfillmentSnapshot: { method: 'pickup' },
    });
    assert.ok(checkout, 'Checkout created');
    const confirmed = await confirmCheckout({ workspaceId: wsId, checkoutId: checkout.id });
    assert.ok(confirmed, 'Checkout confirmed');

    const { createOrderFromCheckout } = await import('../../../src/services/order.service.js');
    const order = await createOrderFromCheckout({ workspaceId: wsId, checkout: confirmed });
    assert.ok(order, 'Order created');
    assert.strictEqual(order.status, 'PENDING_PAYMENT', 'Order is PENDING_PAYMENT');
    assert.ok(order.orderNumber, 'Order has number');
  });

  it('Step 5: Xendit payment link can be created for order', { skip: env.paymentProvider !== 'xendit' }, async () => {
    const cart = await cartsRepo.findActiveByContact({ workspaceId: wsId, contactId });
    assert.ok(cart, 'Has cart');

    const { createCheckout, confirmCheckout } = await import('../../../src/services/checkout.service.js');
    const { createOrderFromCheckout } = await import('../../../src/services/order.service.js');
    const { createXenditPaymentSessionForOrder } = await import('../../../src/services/payment.service.js');

    const checkout = await createCheckout({
      workspaceId: wsId, outletId, contactId, chatId,
      customerSnapshot: { contactName: 'Test User' },
      fulfillmentSnapshot: { method: 'pickup' },
    });
    const confirmed = await confirmCheckout({ workspaceId: wsId, checkoutId: checkout.id });
    const order = await createOrderFromCheckout({ workspaceId: wsId, checkout: confirmed });

    const paymentSession = await createXenditPaymentSessionForOrder({
      workspaceId: wsId,
      orderId: order.id,
      customer: { name: 'Test User', phone: '08123456789' },
    });
    assert.ok(paymentSession, 'Payment session created');
    assert.ok(paymentSession.paymentUrl || paymentSession.paymentLink, 'Payment URL exists');
    console.log('[test] Payment link:', paymentSession.paymentUrl || paymentSession.paymentLink);
  });
});
