import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { createPayment, createPaymentForOrder, buildPaymentInstruction } from '../../../src/services/payment.service.js';
import { paymentsRepository } from '../../../src/db/repositories/index.js';
import Order from '../../../src/models/Order.js';

function createOrder(workspaceId, overrides = {}) {
  return Order.create({
    workspaceId,
    outletId: new mongoose.Types.ObjectId(),
    chatId: new mongoose.Types.ObjectId(),
    contactId: new mongoose.Types.ObjectId(),
    orderNumber: `ORD-${Date.now()}`,
    items: [{ productId: new mongoose.Types.ObjectId(), name: 'Teh', quantity: 1, unitPrice: 10000, subtotal: 10000 }],
    totals: { subtotal: 10000, total: 10000, currency: 'IDR' },
    status: 'new',
    paymentStatus: 'unpaid',
    ...overrides,
  });
}

describe('payment attempts', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();

  it('creates manual payment for order total and marks order pending', async () => {
    const order = await createOrder(workspaceId);
    const payment = await createPaymentForOrder({ workspaceId, orderId: order._id, customer: { name: 'Customer' }, paymentMethod: 'cod' });

    assert.ok(payment._id);
    assert.strictEqual(payment.provider, 'manual');
    assert.strictEqual(payment.paymentMethod, 'cod');
    assert.strictEqual(payment.amount, 10000);
    assert.strictEqual(payment.status, 'pending');

    const updatedOrder = await Order.findById(order._id);
    assert.strictEqual(updatedOrder.paymentStatus, 'pending');
  });

  it('reuses pending payment attempt for same order', async () => {
    const order = await createOrder(workspaceId);
    const first = await createPaymentForOrder({ workspaceId, orderId: order._id });
    const second = await createPaymentForOrder({ workspaceId, orderId: order._id });

    assert.strictEqual(String(first._id), String(second._id));
    assert.strictEqual(await paymentsRepository.count({ workspaceId, orderId: order._id }), 1);
  });

  it('rejects client-provided amount mismatch', async () => {
    const order = await createOrder(workspaceId);
    await assert.rejects(
      () => createPayment({ workspaceId, orderId: order._id, amount: 5000, currency: 'IDR' }),
      { code: 'AMOUNT_MISMATCH' },
    );
  });

  it('returns manual/COD payment instruction when no payment link exists', async () => {
    const order = await createOrder(workspaceId);
    const payment = await createPaymentForOrder({ workspaceId, orderId: order._id, paymentMethod: 'cod' });
    const instruction = buildPaymentInstruction(payment);

    assert.match(instruction, /manual\/COD/);
    assert.match(instruction, /Rp 10.000/);
  });
});
