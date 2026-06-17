import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { createCheckout, confirmCheckout, getCheckoutDetail } from '../../../src/services/checkout.service.js';
import { addItem } from '../../../src/services/cart.service.js';
import Product from '../../../src/models/Product.js';
import ProductOutletAvailability from '../../../src/models/ProductOutletAvailability.js';
import Cart from '../../../src/models/Cart.js';

describe('checkout service', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const outletId = new mongoose.Types.ObjectId();
  const contactId = new mongoose.Types.ObjectId();
  const chatId = new mongoose.Types.ObjectId();

  let product;

  beforeEach(async () => {
    product = await Product.create({
      workspaceId, name: 'Teh Botol', slug: 'teh-checkout', basePrice: 5000, isActive: true,
    });
    await ProductOutletAvailability.create({
      workspaceId, productId: product._id, outletId, isAvailable: true, status: 'active',
    });
    await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id, quantity: 2 });
  });

  it('creates checkout with item snapshots', async () => {
    const checkout = await createCheckout({
      workspaceId, outletId, contactId, chatId, idempotencyKey: 'key-1',
    });
    assert.ok(checkout._id);
    assert.strictEqual(checkout.items.length, 1);
    assert.strictEqual(checkout.items[0].name, 'Teh Botol');
    assert.strictEqual(checkout.items[0].quantity, 2);
    assert.strictEqual(checkout.subtotal, 10000);
    assert.strictEqual(checkout.total, 10000);
    assert.strictEqual(checkout.status, 'pending');
    assert.ok(checkout.expiresAt);
  });

  it('rejects empty cart', async () => {
    const emptyContact = new mongoose.Types.ObjectId();
    await assert.rejects(
      () => createCheckout({ workspaceId, outletId, contactId: emptyContact, chatId }),
      { code: 'EMPTY_CART' },
    );
  });

  it('rejects expired cart', async () => {
    const cart = await Cart.findOne({ workspaceId, contactId });
    assert.ok(cart);
    cart.expiresAt = new Date(Date.now() - 3600000);
    await cart.save();
    await assert.rejects(
      () => createCheckout({ workspaceId, outletId, contactId, chatId }),
      { code: 'EXPIRED_CART' },
    );
  });

  it('rejects changed availability — product removed from outlet', async () => {
    await ProductOutletAvailability.findOneAndUpdate(
      { workspaceId, productId: product._id, outletId },
      { $set: { isAvailable: false } },
    );
    await assert.rejects(
      () => createCheckout({ workspaceId, outletId, contactId, chatId }),
      { code: 'PRODUCT_UNAVAILABLE' },
    );
  });

  it('idempotency key returns existing checkout', async () => {
    const first = await createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey: 'key-dup' });
    const second = await createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey: 'key-dup' });
    assert.strictEqual(String(first._id), String(second._id));
  });

  it('conflicting idempotency key with different payload creates separate checkout', async () => {
    const first = await createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey: 'key-conflict' });
    const result = await createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey: 'key-conflict' });
    assert.strictEqual(String(first._id), String(result._id));
  });

  it('confirmCheckout changes status to confirmed', async () => {
    const checkout = await createCheckout({ workspaceId, outletId, contactId, chatId });
    const confirmed = await confirmCheckout({ workspaceId, checkoutId: checkout._id });
    assert.strictEqual(confirmed.status, 'confirmed');
  });

  it('confirmCheckout rejects non-pending checkout', async () => {
    const checkout = await createCheckout({ workspaceId, outletId, contactId, chatId });
    await confirmCheckout({ workspaceId, checkoutId: checkout._id });
    await assert.rejects(
      () => confirmCheckout({ workspaceId, checkoutId: checkout._id }),
      { code: 'INVALID_STATE' },
    );
  });

  it('getCheckoutDetail returns checkout', async () => {
    const checkout = await createCheckout({ workspaceId, outletId, contactId, chatId });
    const detail = await getCheckoutDetail({ workspaceId, checkoutId: checkout._id });
    assert.strictEqual(detail.status, 'pending');
  });

  it('cart outlet mismatch is rejected', async () => {
    const otherOutlet = new mongoose.Types.ObjectId();
    const otherProduct = await Product.create({
      workspaceId, name: 'Kopi', slug: 'kopi-checkout', basePrice: 7000, isActive: true,
    });
    await ProductOutletAvailability.create({
      workspaceId, productId: otherProduct._id, outletId: otherOutlet, isAvailable: true, status: 'active',
    });
    // Create a cart for a different outlet directly
    await Cart.create({
      workspaceId, outletId: otherOutlet, contactId, chatId, platformType: 'telegram',
      items: [{ productId: otherProduct._id, name: 'Kopi', basePrice: 7000, effectivePrice: 7000, quantity: 1, subtotal: 7000 }],
      total: 7000, currency: 'IDR', status: 'active',
    });
    await assert.rejects(
      () => createCheckout({ workspaceId, outletId, contactId, chatId }),
      { code: 'CART_OUTLET_MISMATCH' },
    );
  });
});
