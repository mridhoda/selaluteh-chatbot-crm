import { paymentEventsRepository, paymentsRepository, ordersRepository } from '../db/repositories/index.js';
import { sendOrderStatusMessage } from './order.service.js';

export async function processPaymentWebhook({ workspaceId, provider, rawBody, headers }) {
  const adapter = await loadAdapter(provider);
  const { valid, event } = await adapter.verifyWebhook(rawBody, headers);
  if (!valid || !event) return { processed: false, reason: 'invalid_signature' };

  const existingEvent = await paymentEventsRepository.findByProviderEventId(provider, event.providerTransactionId);
  if (existingEvent) return { processed: false, reason: 'duplicate', existingEventId: existingEvent._id };

  const registered = await paymentEventsRepository.create({
    workspaceId, provider, providerEventId: event.providerTransactionId,
    eventType: event.eventType, status: event.status, amount: event.amount,
    currency: event.currency, feeAmount: event.feeAmount, netAmount: event.netAmount,
    paymentMethod: event.paymentMethod, raw: event.raw, processingStatus: 'received',
  });

  const payment = await paymentsRepository.findByMerchantReference({ workspaceId, ref: event.merchantReference });
  if (!payment) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered._id, status: 'rejected', verificationResult: 'no_payment_found' });
    return { processed: false, reason: 'no_payment_found' };
  }

  await paymentEventsRepository.updateReferences({
    eventId: registered._id,
    paymentId: payment._id,
    orderId: payment.orderId,
  });

  if (payment.status === 'paid') {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered._id, status: 'processed' });
    return { processed: false, reason: 'already_paid', event };
  }

  if (event.status !== 'paid') {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered._id, status: 'processed' });
    return { processed: true, event };
  }

  if (payment.amount !== event.amount) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered._id, status: 'rejected', verificationResult: 'amount_mismatch' });
    return { processed: false, reason: 'amount_mismatch' };
  }

  if (payment.currency !== event.currency) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered._id, status: 'rejected', verificationResult: 'currency_mismatch' });
    return { processed: false, reason: 'currency_mismatch' };
  }

  const updatedPayment = await paymentsRepository.atomicStatusUpdate({
    paymentId: payment._id, expectedStatus: 'pending', newStatus: 'paid',
  });
  if (!updatedPayment) return { processed: false, reason: 'concurrent_update' };

  await paymentsRepository.addEvent({ paymentId: payment._id, event: {
    providerEventId: event.providerTransactionId, eventType: 'settlement', status: 'paid',
    amount: event.amount, currency: event.currency, feeAmount: event.feeAmount || 0,
    netAmount: event.netAmount || event.amount, paymentMethod: event.paymentMethod, paidAt: new Date(),
  } });

  const updatedOrder = await ordersRepository.updateOne(
    { _id: payment.orderId, workspaceId },
    { $set: { paymentStatus: 'paid' } },
  );

  await paymentsRepository.updatePayment(payment._id, { reconciliationStatus: 'matched' });
  await paymentEventsRepository.updateProcessingStatus({ eventId: registered._id, status: 'processed', verificationResult: 'paid' });

  if (updatedOrder) {
    try {
      await sendOrderStatusMessage({
        order: updatedOrder,
        from: 'ai',
        messageText: `Pembayaran pesanan ${updatedOrder.orderNumber || ''} sudah kami terima ✅\n\nPesanan akan segera diproses.`,
      });
    } catch (err) {
      console.error('[PaymentWebhook] Failed to send paid notification:', err.message);
    }
  }

  return { processed: true, event };
}

async function loadAdapter(provider) {
  if (provider === 'midtrans') return import('../integrations/payments/midtrans-client.js');
  if (provider === 'xendit') return import('../integrations/payments/xendit-client.js');
  throw new Error(`Unknown payment provider: ${provider}`);
}
