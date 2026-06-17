import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { generateOrderNumber, isValidTransition, createOrderFromCheckout, transitionOrderStatus } from '../../../src/services/order.service.js';
import { createCheckout, confirmCheckout } from '../../../src/services/checkout.service.js';
import { addItem } from '../../../src/services/cart.service.js';
import Product from '../../../src/models/Product.js';
import ProductOutletAvailability from '../../../src/models/ProductOutletAvailability.js';
import Order from '../../../src/models/Order.js';

describe('order service', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const outletId = new mongoose.Types.ObjectId();
  const contactId = new mongoose.Types.ObjectId();
  const chatId = new mongoose.Types.ObjectId();

  let checkout;

  beforeEach(async () => {
    const product = await Product.create({
      workspaceId, name: 'Teh Botol', slug: 'teh-order', basePrice: 5000, isActive: true,
    });
    await ProductOutletAvailability.create({
      workspaceId, productId: product._id, outletId, isAvailable: true, status: 'active',
    });
    await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id, quantity: 2 });
    checkout = await createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey: 'order-test' });
    checkout = await confirmCheckout({ workspaceId, checkoutId: checkout._id });
  });

  it('generateOrderNumber creates unique number', async () => {
    const num = await generateOrderNumber(workspaceId);
    assert.ok(num.startsWith('ORD-'));
  });

  it('isValidTransition allows valid transitions', () => {
    assert.strictEqual(isValidTransition('new', 'accepted'), true);
    assert.strictEqual(isValidTransition('new', 'cancelled'), true);
    assert.strictEqual(isValidTransition('accepted', 'preparing'), true);
    assert.strictEqual(isValidTransition('preparing', 'ready'), true);
    assert.strictEqual(isValidTransition('ready', 'completed'), true);
  });

  it('isValidTransition rejects invalid transitions', () => {
    assert.strictEqual(isValidTransition('new', 'completed'), false);
    assert.strictEqual(isValidTransition('completed', 'new'), false);
    assert.strictEqual(isValidTransition('cancelled', 'new'), false);
  });

  it('createOrderFromCheckout creates order with snapshots', async () => {
    const user = { name: 'Admin' };
    const order = await createOrderFromCheckout({ workspaceId, checkout, user });
    assert.strictEqual(order.items.length, 1);
    assert.strictEqual(order.items[0].name, 'Teh Botol');
    assert.strictEqual(order.totals.total, 10000);
    assert.strictEqual(order.status, 'new');
    assert.strictEqual(order.paymentStatus, 'unpaid');
    assert.ok(order.orderNumber);
    assert.ok(order.timeline.length >= 1);
    assert.strictEqual(String(order.checkoutId), String(checkout._id));
  });

  it('transitionOrderStatus moves through valid states', async () => {
    const user = { name: 'Admin' };
    let order = await createOrderFromCheckout({ workspaceId, checkout, user });

    order = await transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'accepted', actor: 'Admin' });
    assert.strictEqual(order.status, 'accepted');

    order = await transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'preparing', actor: 'Admin' });
    assert.strictEqual(order.status, 'preparing');

    order = await transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'ready', actor: 'Admin' });
    assert.strictEqual(order.status, 'ready');

    order = await transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'completed', actor: 'Admin' });
    assert.strictEqual(order.status, 'completed');
  });

  it('transitionOrderStatus rejects invalid transition', async () => {
    const user = { name: 'Admin' };
    const order = await createOrderFromCheckout({ workspaceId, checkout, user });
    await assert.rejects(
      () => transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'completed', actor: 'Admin' }),
      { code: 'INVALID_TRANSITION' },
    );
  });

  it('transitionOrderStatus rejects cancelled order transitions', async () => {
    const user = { name: 'Admin' };
    let order = await createOrderFromCheckout({ workspaceId, checkout, user });
    order = await transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'cancelled', actor: 'Admin' });
    assert.strictEqual(order.status, 'cancelled');
    await assert.rejects(
      () => transitionOrderStatus({ workspaceId, orderId: order._id, newStatus: 'accepted', actor: 'Admin' }),
      { code: 'INVALID_TRANSITION' },
    );
  });

  it('createOrderFromCheckout workspace isolation', async () => {
    const user = { name: 'Admin' };
    const order = await createOrderFromCheckout({ workspaceId, checkout, user });
    const otherWs = new mongoose.Types.ObjectId();
    const found = await Order.findOne({ _id: order._id, workspaceId: otherWs });
    assert.strictEqual(found, null);
  });
});
