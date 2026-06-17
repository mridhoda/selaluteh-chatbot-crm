import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { processPaymentWebhook } from '../../../src/services/payment-webhook.service.js';
import { paymentEventsRepository, paymentsRepository } from '../../../src/db/repositories/index.js';
import Order from '../../../src/models/Order.js';

describe('payment webhook processing', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();

  it('rejects no-payment-found event', async () => {
    const payload = { transaction_id: 'tx-nf', order_id: 'no-payment', transaction_status: 'settlement', gross_amount: '50000', currency: 'IDR', payment_type: 'transfer' };
    const result = await processPaymentWebhook({ workspaceId, provider: 'midtrans', rawBody: payload, headers: {} });
    assert.strictEqual(result.processed, false);
    assert.strictEqual(result.reason, 'no_payment_found');
  });

  it('rejects duplicate event via providerEventId', async () => {
    const order = await Order.create({ workspaceId, _id: new mongoose.Types.ObjectId(), chatId: new mongoose.Types.ObjectId(), contactId: new mongoose.Types.ObjectId(), agentId: new mongoose.Types.ObjectId(), formName: 'Test' });
    await paymentsRepository.create({ workspaceId, orderId: order._id, status: 'pending', amount: 50000, currency: 'IDR', merchantReference: 'pay-dup' });
    const payload = { transaction_id: 'tx-dup', order_id: 'pay-dup', transaction_status: 'settlement', gross_amount: '50000', currency: 'IDR', payment_type: 'bank_transfer' };
    const first = await processPaymentWebhook({ workspaceId, provider: 'midtrans', rawBody: payload, headers: {} });
    assert.strictEqual(first.processed, true);
    const second = await processPaymentWebhook({ workspaceId, provider: 'midtrans', rawBody: payload, headers: {} });
    assert.strictEqual(second.processed, false);
    assert.strictEqual(second.reason, 'duplicate');
  });

  it('processes valid settlement, updates payment and order', async () => {
    const order = await Order.create({ workspaceId, _id: new mongoose.Types.ObjectId(), chatId: new mongoose.Types.ObjectId(), contactId: new mongoose.Types.ObjectId(), agentId: new mongoose.Types.ObjectId(), formName: 'Test' });
    await paymentsRepository.create({ workspaceId, orderId: order._id, status: 'pending', amount: 50000, currency: 'IDR', merchantReference: 'pay-valid' });
    const payload = { transaction_id: 'tx-valid', order_id: 'pay-valid', transaction_status: 'settlement', gross_amount: '50000', currency: 'IDR', payment_type: 'gopay' };
    const result = await processPaymentWebhook({ workspaceId, provider: 'midtrans', rawBody: payload, headers: {} });
    assert.strictEqual(result.processed, true);
    const payment = await paymentsRepository.findByMerchantReference({ workspaceId, ref: 'pay-valid' });
    assert.strictEqual(payment.status, 'paid');
    const updatedOrder = await Order.findById(order._id);
    assert.strictEqual(updatedOrder.paymentStatus, 'paid');
    const events = await paymentEventsRepository.findByPayment({ workspaceId, paymentId: payment._id });
    assert.strictEqual(events.length, 1);
    assert.strictEqual(String(events[0].orderId), String(order._id));
    assert.strictEqual(events[0].processingStatus, 'processed');
  });

  it('rejects amount mismatch', async () => {
    const order = await Order.create({ workspaceId, _id: new mongoose.Types.ObjectId(), chatId: new mongoose.Types.ObjectId(), contactId: new mongoose.Types.ObjectId(), agentId: new mongoose.Types.ObjectId(), formName: 'Test' });
    await paymentsRepository.create({ workspaceId, orderId: order._id, status: 'pending', amount: 50000, currency: 'IDR', merchantReference: 'pay-amt' });
    const payload = { transaction_id: 'tx-amt', order_id: 'pay-amt', transaction_status: 'settlement', gross_amount: '10000', currency: 'IDR', payment_type: 'transfer' };
    const result = await processPaymentWebhook({ workspaceId, provider: 'midtrans', rawBody: payload, headers: {} });
    assert.strictEqual(result.processed, false);
    assert.strictEqual(result.reason, 'amount_mismatch');
  });

  it('no-downgrade for already paid payments', async () => {
    const order = await Order.create({ workspaceId, _id: new mongoose.Types.ObjectId(), chatId: new mongoose.Types.ObjectId(), contactId: new mongoose.Types.ObjectId(), agentId: new mongoose.Types.ObjectId(), formName: 'Test' });
    const payment = await paymentsRepository.create({ workspaceId, orderId: order._id, status: 'paid', amount: 50000, currency: 'IDR', merchantReference: 'pay-no-downgrade' });
    const payload = { transaction_id: 'tx-no-downgrade', order_id: 'pay-no-downgrade', transaction_status: 'pending', gross_amount: '50000', currency: 'IDR', payment_type: 'transfer' };
    const result = await processPaymentWebhook({ workspaceId, provider: 'midtrans', rawBody: payload, headers: {} });
    assert.strictEqual(result.processed, false);
    const updated = await paymentsRepository.findById({ workspaceId, paymentId: payment._id });
    assert.strictEqual(updated.status, 'paid');
  });
});
