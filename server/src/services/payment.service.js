import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { ordersRepository, paymentsRepository } from '../db/repositories/index.js';

export async function createPayment({ workspaceId, outletId, orderId, customer, amount, currency = 'IDR', paymentMethod = null }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

  const expectedAmount = order.totals?.total || 0;
  const requestedAmount = amount ?? expectedAmount;
  if (requestedAmount !== expectedAmount) {
    throw new AppError('AMOUNT_MISMATCH', 'Payment amount must match order total', 400);
  }

  const existingReusable = await paymentsRepository.findReusableAttempt({ workspaceId, orderId });
  if (existingReusable) return existingReusable;

  const existingAttempts = await paymentsRepository.count({ workspaceId, orderId });
  const attemptNumber = existingAttempts + 1;

  const merchantReference = `PAY-${workspaceId.toString().slice(-6)}-${orderId.toString().slice(-6)}-${Date.now()}`;

  let providerTransactionId = null;
  let paymentUrl = null;

  if (env.paymentProvider !== 'manual') {
    try {
      const adapter = await loadPaymentAdapter(env.paymentProvider);
      const result = await adapter.createPayment({
        orderId: orderId.toString(),
        merchantReference,
        amount,
        currency,
        customer: customer || { name: '', email: '', phone: '' },
      });
      providerTransactionId = result.providerTransactionId;
      paymentUrl = result.paymentUrl;
    } catch (err) {
      console.error(`[Payment] Provider error:`, err.message);
      throw new AppError('PAYMENT_PROVIDER_ERROR', 'Payment provider temporarily unavailable', 502);
    }
  } else {
    paymentUrl = '';
  }

  const payment = await paymentsRepository.create({
    workspaceId,
    outletId: outletId || order.outletId,
    orderId,
    attemptNumber,
    provider: env.paymentProvider,
    providerTransactionId,
    merchantReference,
    status: 'pending',
    amount: requestedAmount,
    currency,
    paymentUrl,
    paymentMethod: paymentMethod || (env.paymentProvider === 'manual' ? 'manual' : null),
    customerSnapshot: customer || {},
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await ordersRepository.updateOne(
    { _id: orderId, workspaceId },
    { $set: { paymentStatus: 'pending' } },
  );

  return payment;
}

export async function createPaymentForOrder({ workspaceId, orderId, customer, paymentMethod }) {
  const order = await ordersRepository.workspaceFindById({ workspaceId, orderId });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
  return createPayment({
    workspaceId,
    outletId: order.outletId,
    orderId,
    amount: order.totals?.total || 0,
    currency: order.totals?.currency || 'IDR',
    customer,
    paymentMethod,
  });
}

export function buildPaymentInstruction(payment) {
  if (!payment) return '';
  const total = Number(payment.amount || 0).toLocaleString('id-ID');
  if (payment.provider === 'manual' || !payment.paymentUrl) {
    return `Pembayaran: manual/COD\nTotal: Rp ${total}\nSilakan bayar saat pengambilan atau sesuai instruksi outlet.`;
  }
  return `Link pembayaran:\n${payment.paymentUrl}\n\nTotal: Rp ${total}`;
}

export async function getPaymentDetail({ workspaceId, paymentId }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  return payment;
}

export async function listPayments({ workspaceId, orderId, status, page, limit, sort }) {
  const data = await paymentsRepository.list({ workspaceId, orderId, status, page, limit, sort });
  const total = await paymentsRepository.count({ workspaceId, orderId, status });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function syncPaymentWithProvider({ workspaceId, paymentId }) {
  const payment = await paymentsRepository.findById({ workspaceId, paymentId });
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
  if (!payment.providerTransactionId || payment.provider === 'manual') {
    throw new AppError('NO_PROVIDER_TRANSACTION', 'No provider transaction to sync', 400);
  }

  const adapter = await loadPaymentAdapter(payment.provider);
  const result = await adapter.getPayment(payment.providerTransactionId);

  if (result.status !== payment.status && result.status === 'paid') {
    await processPaidPayment({ payment, providerEvent: result });
  }

  return paymentsRepository.findById({ workspaceId, paymentId });
}

async function processPaidPayment({ payment, providerEvent }) {
  const paidAmount = providerEvent.amount || payment.amount;
  const updated = await paymentsRepository.atomicStatusUpdate({
    paymentId: payment._id,
    expectedStatus: 'pending',
    newStatus: 'paid',
  });
  if (!updated) return; // concurrent update won

  await paymentsRepository.addEvent({
    paymentId: payment._id,
    event: {
      providerEventId: providerEvent.providerTransactionId || providerEvent.providerEventId,
      eventType: 'settlement',
      status: 'paid',
      amount: paidAmount,
      currency: providerEvent.currency || 'IDR',
      feeAmount: providerEvent.feeAmount || 0,
      netAmount: providerEvent.netAmount || (paidAmount - (providerEvent.feeAmount || 0)),
      paymentMethod: providerEvent.paymentMethod,
      paidAt: providerEvent.paidAt ? new Date(providerEvent.paidAt) : new Date(),
    },
  });

  await ordersRepository.updateOne(
    { _id: payment.orderId, workspaceId: payment.workspaceId },
    { $set: { paymentStatus: 'paid' } },
  );
}

async function loadPaymentAdapter(provider) {
  if (provider === 'midtrans') {
    return import('../integrations/payments/midtrans-client.js');
  }
  if (provider === 'xendit') {
    return import('../integrations/payments/xendit-client.js');
  }
  throw new AppError('UNKNOWN_PROVIDER', `Unknown payment provider: ${provider}`, 400);
}
