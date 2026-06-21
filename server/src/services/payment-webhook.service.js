import { paymentEventsRepository, paymentsRepository, ordersRepository } from '../db/repositories/index.js';
import { sendOrderStatusMessage } from './order.service.js';
import { AppError } from '../utils/errors.js';

export async function processPaymentWebhook({ workspaceId, provider, rawBody, headers }) {
  const adapter = await loadAdapter(provider);
  const { valid, event } = await adapter.verifyWebhook(rawBody, headers);
  if (!valid || !event) return { processed: false, reason: 'invalid_signature' };

  const existingEvent = await paymentEventsRepository.findByProviderEventId(provider, event.providerTransactionId);
  if (existingEvent) return { processed: false, reason: 'duplicate', existingEventId: existingEvent.id };

  const registered = await paymentEventsRepository.create({
    workspaceId, provider, providerEventId: event.providerTransactionId,
    eventType: event.eventType, status: event.status, amount: event.amount,
    currency: event.currency, feeAmount: event.feeAmount, netAmount: event.netAmount,
    paymentMethod: event.paymentMethod, raw: event.raw, processingStatus: 'received',
  });

  const payment = await paymentsRepository.findByMerchantReference({ workspaceId, ref: event.merchantReference });
  if (!payment) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'no_payment_found' });
    return { processed: false, reason: 'no_payment_found' };
  }

  await paymentEventsRepository.updateReferences({
    eventId: registered.id,
    paymentId: payment.id,
    orderId: payment.orderId,
  });

  if (payment.status === 'paid') {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed' });
    return { processed: false, reason: 'already_paid', event };
  }

  if (event.status !== 'paid') {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed' });
    return { processed: true, event };
  }

  if (payment.amount !== event.amount) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'amount_mismatch' });
    return { processed: false, reason: 'amount_mismatch' };
  }

  if (payment.currency !== event.currency) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'currency_mismatch' });
    return { processed: false, reason: 'currency_mismatch' };
  }

  const updatedPayment = await paymentsRepository.atomicStatusUpdate({
    paymentId: payment.id, expectedStatus: 'pending', newStatus: 'paid',
  });
  if (!updatedPayment) return { processed: false, reason: 'concurrent_update' };

  await paymentsRepository.addEvent({ paymentId: payment.id, event: {
    providerEventId: event.providerTransactionId, eventType: 'settlement', status: 'paid',
    amount: event.amount, currency: event.currency, feeAmount: event.feeAmount || 0,
    netAmount: event.netAmount || event.amount, paymentMethod: event.paymentMethod, paidAt: new Date(),
  } });

  const updatedOrder = await ordersRepository.updateOne({ workspaceId, orderId: payment.orderId, updates: { payment_status: 'paid' } });

  await paymentsRepository.updatePayment(payment.id, { reconciliation_status: 'matched' });
  await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: 'paid' });

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

export async function processXenditPaymentSessionWebhook({ rawBody, headers }) {
  const adapter = await loadAdapter('xendit');
  const { valid, event, reason } = await adapter.verifyWebhook(rawBody, headers);
  if (!valid || !event) {
    throw new AppError('XENDIT_WEBHOOK_UNAUTHORIZED', reason || 'Invalid Xendit webhook verification token', 401);
  }

  if (!['payment_session.completed', 'payment_session.expired'].includes(event.eventType)) {
    throw new AppError('XENDIT_WEBHOOK_INVALID', 'Unsupported Xendit payment session event', 400);
  }

  const eventKey = event.providerEventId || `${event.providerSessionId}:${event.eventType}:${event.updatedAt || ''}`;
  const existingEvent = await paymentEventsRepository.findByProviderEventId('xendit', eventKey);
  if (existingEvent) {
    return { processed: false, reason: 'duplicate', existingEventId: existingEvent.id };
  }

  const payment = event.providerSessionId
    ? await paymentsRepository.findByProviderTransactionId(event.providerSessionId)
    : null;
  const paymentByReference = !payment && event.merchantReference ? await paymentsRepository.findByMerchantReferenceGlobal(event.merchantReference) : null;
  const targetPayment = payment || paymentByReference;

  if (!targetPayment) {
    return { processed: false, reason: 'no_payment_found' };
  }

  const registered = await paymentEventsRepository.create({
    workspaceId: targetPayment.workspaceId,
    provider: 'xendit',
    providerEventId: eventKey,
    eventType: event.eventType,
    status: event.status,
    amount: event.amount,
    currency: event.currency,
    raw: safePaymentSessionPayload(event.raw),
    processingStatus: 'received',
  });

  await paymentEventsRepository.updateReferences({ eventId: registered.id, paymentId: targetPayment.id, orderId: targetPayment.orderId });

  if (event.providerSessionId && targetPayment.providerTransactionId !== event.providerSessionId) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'provider_session_mismatch' });
    return { processed: false, reason: 'provider_session_mismatch' };
  }
  if (targetPayment.merchantReference !== event.merchantReference) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'reference_mismatch' });
    return { processed: false, reason: 'reference_mismatch' };
  }
  if (Number(targetPayment.amount) !== Number(event.amount)) {
    await paymentsRepository.updatePayment(targetPayment.id, { reconciliation_status: 'amount_mismatch' });
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'amount_mismatch' });
    return { processed: false, reason: 'amount_mismatch' };
  }
  if (targetPayment.currency !== event.currency) {
    await paymentsRepository.updatePayment(targetPayment.id, { reconciliation_status: 'amount_mismatch' });
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'currency_mismatch' });
    return { processed: false, reason: 'currency_mismatch' };
  }

  if (targetPayment.status === 'paid' && event.status !== 'paid') {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: 'stale_no_downgrade' });
    return { processed: false, reason: 'stale_no_downgrade' };
  }

  if (event.status === 'paid') {
    const confirmed = await adapter.getPaymentSession(event.providerSessionId);
    if (confirmed.status !== 'paid') {
      await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'provider_not_paid' });
      return { processed: false, reason: 'provider_not_paid' };
    }
  }

  const nextStatus = event.status === 'paid' ? 'paid' : event.status === 'expired' ? 'expired' : targetPayment.status;
  const allowedFrom = nextStatus === 'paid' ? ['pending', 'created', 'expired'] : ['pending', 'created'];
  const updatedPayment = await paymentsRepository.transitionStatus({
    paymentId: targetPayment.id,
    fromStatuses: allowedFrom,
    newStatus: nextStatus,
    updates: {
      reconciliation_status: nextStatus === 'paid' ? 'matched' : targetPayment.reconciliationStatus || 'pending',
      ...(nextStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    },
  });

  if (!updatedPayment && targetPayment.status !== nextStatus) {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: 'state_conflict_noop' });
    return { processed: false, reason: 'state_conflict_noop' };
  }

  await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: nextStatus });

  if (nextStatus === 'paid') {
    const updatedOrder = await ordersRepository.updateOne({
      workspaceId: targetPayment.workspaceId,
      orderId: targetPayment.orderId,
      updates: { payment_status: 'paid', paid_at: new Date().toISOString() },
    });
    await paymentsRepository.addEvent({ paymentId: targetPayment.id, event: {
      provider: 'xendit', providerEventId: eventKey, eventType: event.eventType, status: 'paid',
      amount: event.amount, currency: event.currency, paymentMethod: 'LINK_PAYMENT', paidAt: new Date(), rawPayload: safePaymentSessionPayload(event.raw),
    } });
    await notifyPaidOnce({ order: updatedOrder, paymentId: targetPayment.id });
  } else if (nextStatus === 'expired') {
    await ordersRepository.updateOne({ workspaceId: targetPayment.workspaceId, orderId: targetPayment.orderId, updates: { payment_status: 'expired' } });
  }

  return { processed: true, event: { eventType: event.eventType, status: nextStatus } };
}

async function loadAdapter(provider) {
  if (provider === 'midtrans') return import('../integrations/payments/midtrans-client.js');
  if (provider === 'xendit') return import('../integrations/payments/xendit-client.js');
  throw new Error(`Unknown payment provider: ${provider}`);
}

function safePaymentSessionPayload(payload = {}) {
  return payload;
}

async function notifyPaidOnce({ order, paymentId }) {
  if (!order) return;
  const sentPayments = order.metadata?.paid_notification_payment_ids || [];
  if (sentPayments.includes(paymentId)) return;
  try {
    await sendOrderStatusMessage({
      order,
      from: 'ai',
      messageText: `Pembayaran pesanan ${order.orderNumber || ''} sudah kami terima.\n\nPesanan telah dikonfirmasi dan akan segera diproses.`,
    });
    await ordersRepository.updateOne({
      workspaceId: order.workspaceId,
      orderId: order.id,
      updates: { metadata: { ...(order.metadata || {}), paid_notification_payment_ids: [...sentPayments, paymentId] } },
    });
  } catch (err) {
    console.error('[PaymentWebhook] Failed to send paid notification:', err.message);
  }
}
