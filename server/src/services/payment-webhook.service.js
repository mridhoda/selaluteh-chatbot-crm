import { paymentEventsRepository, paymentsRepository, ordersRepository } from '../db/repositories/index.js';
import { notifyOrderUpdatedRealtime, notifyPaidOrderRealtime, notifyPaymentUpdatedRealtime, sendOrderStatusMessage } from './order.service.js';
import { AppError } from '../utils/errors.js';
import { redactSecrets } from '../utils/redaction.js';
import { getPaymentRuntimeConfig } from './settings.service.js';

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

  const updatedOrder = await ordersRepository.updateOne({ workspaceId, orderId: payment.orderId, updates: { payment_status: 'paid', status: 'accepted' } });
  notifyPaymentUpdatedRealtime({ workspaceId, outletId: updatedPayment.outletId, payment: updatedPayment, order: updatedOrder });

  await paymentsRepository.updatePayment(payment.id, { reconciliation_status: 'matched' });
  await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: 'paid' });

  if (updatedOrder) {
    notifyPaidOrderRealtime({ workspaceId, outletId: updatedOrder.outletId, order: updatedOrder });
    try {
      const outletName = updatedOrder.outletNameSnapshot || '';
      await sendOrderStatusMessage({
        order: updatedOrder,
        from: 'ai',
        messageText: `Pembayaran pesanan ${updatedOrder.orderNumber || ''} sudah kami terima ✅\n\nPesanan telah dikonfirmasi dan akan segera diproses.\n\nKami akan memberi tahu saat pesanan siap diambil.`,
      });
    } catch (err) {
      console.error('[PaymentWebhook] Failed to send paid notification:', err.message);
    }
  }

  return { processed: true, event };
}

export async function processDokuCheckoutWebhook({ rawBody, headers, requestTarget = '/webhook/doku' }) {
  const parsed = safeJson(rawBody);
  const merchantReference = parsed?.order?.invoice_number;
  if (!merchantReference) throw new AppError('DOKU_WEBHOOK_INVALID', 'Missing DOKU invoice number', 400);

  const targetPayment = await paymentsRepository.findByMerchantReferenceGlobal(merchantReference);
  if (!targetPayment) return { processed: false, reason: 'no_payment_found' };

  const runtime = await getPaymentRuntimeConfig({ workspaceId: targetPayment.workspaceId });
  const adapter = await loadAdapter('doku');
  const { valid, event, reason } = await adapter.verifyWebhook(rawBody, headers, runtime.doku, requestTarget);
  if (!valid || !event) throw new AppError('DOKU_WEBHOOK_UNAUTHORIZED', reason || 'Invalid DOKU webhook signature', 401);

  const eventKey = event.providerEventId || `${event.merchantReference}:${event.eventType}:${event.paidAt || ''}`;
  const existingEvent = await paymentEventsRepository.findByProviderEventId('doku', eventKey);
  if (existingEvent && existingEvent.processingStatus === 'processed') {
    return { processed: false, reason: 'duplicate', existingEventId: existingEvent.id };
  }

  const registered = existingEvent || await paymentEventsRepository.create({
    workspaceId: targetPayment.workspaceId,
    provider: 'doku',
    providerEventId: eventKey,
    eventType: event.eventType,
    status: event.status,
    amount: event.amount,
    currency: event.currency,
    paymentMethod: event.paymentMethod,
    raw: safePaymentSessionPayload(event.raw),
    processingStatus: 'received',
  });
  await paymentEventsRepository.updateReferences({ eventId: registered.id, paymentId: targetPayment.id, orderId: targetPayment.orderId });

  if (Number(targetPayment.amount) !== Number(event.amount)) {
    await paymentsRepository.updatePayment(targetPayment.id, { reconciliation_status: 'amount_mismatch' });
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'amount_mismatch' });
    return { processed: false, reason: 'amount_mismatch' };
  }

  if (event.status !== 'paid') {
    await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: event.status });
    return { processed: true, event: { eventType: event.eventType, status: event.status } };
  }

  const updatedPayment = await paymentsRepository.transitionStatus({
    paymentId: targetPayment.id,
    fromStatuses: ['pending', 'expired'],
    newStatus: 'paid',
    updates: { reconciliation_status: 'matched', paid_at: new Date().toISOString() },
  });

  await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'processed', verificationResult: 'paid' });
  const updatedOrder = await ordersRepository.updateOne({
    workspaceId: targetPayment.workspaceId,
    orderId: targetPayment.orderId,
    updates: { payment_status: 'paid', paid_at: new Date().toISOString(), status: 'accepted' },
  });
  notifyPaymentUpdatedRealtime({ workspaceId: targetPayment.workspaceId, outletId: updatedPayment?.outletId || targetPayment.outletId, payment: updatedPayment || targetPayment, order: updatedOrder });
  notifyPaidOrderRealtime({ workspaceId: targetPayment.workspaceId, outletId: updatedOrder?.outletId, order: updatedOrder });
  await notifyPaidOnce({ order: updatedOrder, paymentId: targetPayment.id, outletName: updatedOrder?.outletNameSnapshot || '' });
  return { processed: true, event: { eventType: event.eventType, status: 'paid' } };
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
  // Only treat fully-processed events as true duplicates.
  // Events stuck in 'received' (e.g. due to a previous crash) are re-processed on retry.
  if (existingEvent && existingEvent.processingStatus === 'processed') {
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

  // If the previous attempt left a stuck 'received' event, reuse that record (avoids unique constraint error on retry).
  let registered;
  if (existingEvent && existingEvent.processingStatus === 'received') {
    console.log(`[PaymentWebhook] Retrying stuck event ${existingEvent.id} for session ${event.providerSessionId}`);
    registered = existingEvent;
  } else {
    registered = await paymentEventsRepository.create({
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
  }

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
    try {
      const confirmed = await adapter.getPaymentSession(event.providerSessionId);
      if (confirmed.status !== 'paid') {
        await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'rejected', verificationResult: 'provider_not_paid' });
        return { processed: false, reason: 'provider_not_paid' };
      }
    } catch (verifyErr) {
      // Secondary verification failed (network/API error). Mark event as 'pending_retry'
      // so the next Xendit retry can re-process it rather than getting blocked by idempotency.
      console.error('[PaymentWebhook] Secondary Xendit verification failed, will retry on next webhook:', verifyErr.message);
      await paymentEventsRepository.updateProcessingStatus({ eventId: registered.id, status: 'received', verificationResult: 'verify_error' });
      throw verifyErr;
    }
  }

  const nextStatus = event.status === 'paid' ? 'paid' : event.status === 'expired' ? 'expired' : targetPayment.status;
  const allowedFrom = nextStatus === 'paid' ? ['pending', 'expired'] : ['pending'];
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
      updates: { payment_status: 'paid', paid_at: new Date().toISOString(), status: 'accepted' },
    });
    notifyPaymentUpdatedRealtime({ workspaceId: targetPayment.workspaceId, outletId: updatedPayment?.outletId || targetPayment.outletId, payment: updatedPayment || targetPayment, order: updatedOrder });
    // Only add a settlement event if this is a fresh processing (not a retry of a stuck event)
    if (!existingEvent) {
      try {
        await paymentsRepository.addEvent({ paymentId: targetPayment.id, event: {
          provider: 'xendit', providerEventId: eventKey, eventType: event.eventType, status: 'paid',
          amount: event.amount, currency: event.currency, paymentMethod: 'LINK_PAYMENT', paidAt: new Date(), rawPayload: safePaymentSessionPayload(event.raw),
        } });
      } catch (evtErr) {
        console.error('[PaymentWebhook] addEvent warning (non-fatal):', evtErr.message);
      }
    }
    const outletName = updatedOrder?.outletNameSnapshot || '';
    notifyPaidOrderRealtime({ workspaceId: targetPayment.workspaceId, outletId: updatedOrder?.outletId, order: updatedOrder });
    await notifyPaidOnce({ order: updatedOrder, paymentId: targetPayment.id, outletName });
  } else if (nextStatus === 'expired') {
    const updatedOrder = await ordersRepository.updateOne({ workspaceId: targetPayment.workspaceId, orderId: targetPayment.orderId, updates: { payment_status: 'expired' } });
    notifyPaymentUpdatedRealtime({ workspaceId: targetPayment.workspaceId, outletId: updatedPayment?.outletId || targetPayment.outletId, payment: updatedPayment || targetPayment, order: updatedOrder });
    notifyOrderUpdatedRealtime({ workspaceId: targetPayment.workspaceId, outletId: updatedOrder?.outletId || targetPayment.outletId, order: updatedOrder });
  }

  return { processed: true, event: { eventType: event.eventType, status: nextStatus } };
}

async function loadAdapter(provider) {
  if (provider === 'xendit') return import('../integrations/payments/xendit-client.js');
  if (provider === 'doku') return import('../integrations/payments/doku-client.js');
  throw new Error(`Unknown payment provider: ${provider}`);
}

function safePaymentSessionPayload(payload = {}) {
  return redactSecrets(payload);
}

function safeJson(rawBody) {
  if (!rawBody) return {};
  if (Buffer.isBuffer(rawBody)) return JSON.parse(rawBody.toString('utf8'));
  if (typeof rawBody === 'string') return JSON.parse(rawBody);
  return rawBody;
}

async function notifyPaidOnce({ order, paymentId, outletName }) {
  if (!order) return;
  const sentPayments = order.metadata?.paid_notification_payment_ids || [];
  if (sentPayments.includes(paymentId)) return;
  try {
    const outletLine = outletName ? `\n\nSilakan ambil di outlet **${outletName}** setelah pesanan siap.` : '\n\nKami akan memberi tahu saat pesanan siap diambil.';
    await sendOrderStatusMessage({
      order,
      from: 'ai',
      messageText: `Pembayaran pesanan ${order.orderNumber || ''} sudah kami terima ✅\n\nPesanan telah dikonfirmasi dan akan segera diproses.${outletLine}`,
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
