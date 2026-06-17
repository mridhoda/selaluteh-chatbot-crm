import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { getOrCreateActiveCart, addItem, updateQuantity, removeItem, clearCart, getCartSummary } from '../../../src/services/cart.service.js';
import { cartsRepository } from '../../../src/db/repositories/index.js';
import Product from '../../../src/models/Product.js';
import ProductOutletAvailability from '../../../src/models/ProductOutletAvailability.js';
import Cart from '../../../src/models/Cart.js';

describe('cart service', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const outletId = new mongoose.Types.ObjectId();
  const outletId2 = new mongoose.Types.ObjectId();
  const contactId = new mongoose.Types.ObjectId();
  const chatId = new mongoose.Types.ObjectId();

  let product;

  beforeEach(async () => {
    product = await Product.create({
      workspaceId, name: 'Teh Botol', slug: 'teh-botol', basePrice: 5000, currency: 'IDR', isActive: true,
    });
    await ProductOutletAvailability.create({
      workspaceId, productId: product._id, outletId, isAvailable: true, status: 'active',
    });
  });

  it('getOrCreateActiveCart creates new cart', async () => {
    const cart = await getOrCreateActiveCart({ workspaceId, outletId, contactId, chatId, platformType: 'telegram' });
    assert.ok(cart._id);
    assert.strictEqual(cart.status, 'active');
    assert.strictEqual(String(cart.outletId), String(outletId));
    assert.ok(cart.expiresAt);
  });

  it('getOrCreateActiveCart returns existing active cart', async () => {
    const first = await getOrCreateActiveCart({ workspaceId, outletId, contactId, chatId, platformType: 'telegram' });
    const second = await getOrCreateActiveCart({ workspaceId, outletId, contactId, chatId, platformType: 'telegram' });
    assert.strictEqual(String(first._id), String(second._id));
  });

  it('addItem adds product to cart', async () => {
    const cart = await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id, quantity: 2 });
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items[0].name, 'Teh Botol');
    assert.strictEqual(cart.items[0].quantity, 2);
    assert.strictEqual(cart.items[0].subtotal, 10000);
    assert.strictEqual(cart.total, 10000);
  });

  it('addItem increments quantity for existing product', async () => {
    await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id, quantity: 1 });
    const cart = await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id, quantity: 2 });
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items[0].quantity, 3);
  });

  it('rejects product not available at outlet', async () => {
    const otherProduct = await Product.create({
      workspaceId, name: 'Kopi', slug: 'kopi', basePrice: 7000, isActive: true,
    });
    await assert.rejects(
      () => addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: otherProduct._id }),
      { code: 'PRODUCT_UNAVAILABLE' },
    );
  });

  it('rejects cart outlet mismatch', async () => {
    const cart = await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id });
    await Cart.findByIdAndUpdate(cart._id, { $set: { outletId: outletId2 } });
    await assert.rejects(
      () => addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id }),
      { code: 'CART_OUTLET_MISMATCH' },
    );
  });

  it('updateQuantity modifies item quantity', async () => {
    const cart = await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id });
    const updated = await updateQuantity({ workspaceId, cartId: cart._id, productId: product._id, quantity: 5 });
    const item = updated.items.find((i) => String(i.productId) === String(product._id));
    assert.strictEqual(item.quantity, 5);
    assert.strictEqual(item.subtotal, 25000);
  });

  it('removeItem removes product from cart', async () => {
    const cart = await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id });
    const updated = await removeItem({ workspaceId, cartId: cart._id, productId: product._id });
    assert.strictEqual(updated.items.length, 0);
    assert.strictEqual(updated.total, 0);
  });

  it('clearCart empties cart items', async () => {
    await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: product._id });
    const secondProduct = await Product.create({ workspaceId, name: 'Snack', slug: 'snack', basePrice: 3000, isActive: true });
    await ProductOutletAvailability.create({ workspaceId, productId: secondProduct._id, outletId, isAvailable: true, status: 'active' });
    const cart = await addItem({ workspaceId, outletId, contactId, chatId, platformType: 'telegram', productId: secondProduct._id });
    const cleared = await clearCart({ workspaceId, cartId: cart._id });
    assert.strictEqual(cleared.items.length, 0);
    assert.strictEqual(cleared.total, 0);
  });

  it('getCartSummary returns summary object', () => {
    const cart = { _id: 'abc', outletId, items: [{ productId: product._id, name: 'Teh', price: 5000, quantity: 2, subtotal: 10000 }], total: 10000, currency: 'IDR' };
    const summary = getCartSummary(cart);
    assert.strictEqual(summary.itemCount, 1);
    assert.strictEqual(summary.total, 10000);
  });
});
