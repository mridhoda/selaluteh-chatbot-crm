import { paymentsRepository, ordersRepository } from '../db/repositories/index.js';
import { notifyOrderUpdatedRealtime, notifyPaymentUpdatedRealtime } from './order.service.js';
import { PaymentStatus } from '../orders/order-types.js';

export async function expirePayment({ workspaceId, paymentId, now = new Date() }, deps = {}) {
  const paymentsRepo = deps.paymentsRepository || paymentsRepository;
  const ordersRepo = deps.ordersRepository || ordersRepository;
  const notifyPaymentUpdated = deps.notifyPaymentUpdatedRealtime || notifyPaymentUpdatedRealtime;
  const notifyOrderUpdated = deps.notifyOrderUpdatedRealtime || notifyOrderUpdatedRealtime;
  const payment = await paymentsRepo.findById({ workspaceId, paymentId });
  if (!payment) return { expired: false, reason: 'not_found' };
  if (!['pending', 'processing'].includes(payment.status)) return { expired: false, reason: 'not_expirable', payment };
  if (payment.expiresAt && new Date(payment.expiresAt).getTime() > new Date(now).getTime()) return { expired: false, reason: 'not_due', payment };

  const updatedPayment = await paymentsRepo.transitionStatus({
    workspaceId,
    paymentId,
    fromStatuses: ['pending', 'processing'],
    newStatus: PaymentStatus.EXPIRED,
    updates: { reconciliation_status: payment.reconciliationStatus || 'pending' },
  });
  if (!updatedPayment) return { expired: false, reason: 'state_conflict', payment };

  const updatedOrder = payment.orderId
    ? await ordersRepo.updateOne({ workspaceId, orderId: payment.orderId, updates: { payment_status: PaymentStatus.EXPIRED } })
    : null;

  notifyPaymentUpdated({ workspaceId, outletId: updatedPayment.outletId || payment.outletId, payment: updatedPayment, order: updatedOrder });
  if (updatedOrder) notifyOrderUpdated({ workspaceId, outletId: updatedOrder.outletId || updatedPayment.outletId, order: updatedOrder });
  return { expired: true, payment: updatedPayment, order: updatedOrder };
}

export async function expirePendingPayments({ workspaceId, payments = [], now = new Date(), limit = 100 }, deps = {}) {
  const paymentsRepo = deps.paymentsRepository || paymentsRepository;
  const duePayments = payments.length > 0 ? payments : await paymentsRepo.findDueForExpiry({ workspaceId, now, limit });
  let expired = 0;
  for (const payment of duePayments) {
    const result = await expirePayment({ workspaceId: payment.workspaceId || workspaceId, paymentId: payment.id, now }, deps);
    if (result.expired) expired += 1;
  }
  return { expired };
}
