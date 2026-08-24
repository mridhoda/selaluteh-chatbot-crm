import { ordersRepository } from '../db/repositories/index.js';
import { derivePublicOrderStatus, FulfillmentStatus, OrderStatus } from '../orders/order-types.js';
import { AppError } from '../utils/errors.js';

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length <= 4) return digits ? '****' : null;
  return `${digits.slice(0, 2)}${'*'.repeat(Math.max(digits.length - 5, 4))}${digits.slice(-3)}`;
}

export async function getPublicOrderByToken(publicOrderToken) {
  let order = await ordersRepository.findByPublicOrderToken({ token: publicOrderToken });
  if (!order) throw new AppError('PUBLIC_ORDER_NOT_FOUND', 'Order not found', 404);

  const confirmationExpiresAt = order.metadata?.confirmationExpiresAt;
  if (order.fulfillmentStatus === FulfillmentStatus.AWAITING_ACCEPTANCE && confirmationExpiresAt && new Date(confirmationExpiresAt).getTime() <= Date.now()) {
    const expired = await ordersRepository.atomicFulfillmentStatusUpdate({
      workspaceId: order.workspaceId,
      orderId: order.id,
      expectedStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
      newStatus: FulfillmentStatus.CANCELLED,
      updates: {
        status: OrderStatus.REJECTED,
        rejected_at: new Date().toISOString(),
        cancel_reason: 'Outlet tidak mengonfirmasi ketersediaan pesanan dalam 30 detik.',
        metadata: { ...(order.metadata || {}), confirmationExpired: true },
      },
    });
    if (expired) {
      order = expired;
      // Dynamic import to avoid a static circular dependency: order.service.js
      // imports buildPublicOrderEvent from this file (for its own realtime
      // broadcast), so this file can't statically import back from it.
      const { notifyOrderUpdatedRealtime } = await import('./order.service.js');
      notifyOrderUpdatedRealtime({ workspaceId: order.workspaceId, outletId: order.outletId, order, actor: { type: 'system', reason: 'confirmation_timeout' } });
    }
  }

  return transformOrderToPublic(order);
}

// Thin whitelist for the public per-order SSE channel (Stage D) -- deliberately
// NOT transformOrderToPublic(order) verbatim: that shape also carries raw
// paymentStatus/payment_status/fulfillmentStatus/fulfillment_status (kept
// there for existing REST/admin-ish consumers), which must never reach an
// unauthenticated guest over the wire, only the derived public_order_status.
export function buildPublicOrderEvent(order) {
  const { paymentStatus, payment_status, fulfillmentStatus, fulfillment_status, ...safe } = transformOrderToPublic(order);
  return safe;
}

export function transformOrderToPublic(order) {
  const customer = order.customerSnapshot || {};
  const orderNumber = order.orderNumber || '';
  const orderSequence = orderNumber.split('-').at(-1);
  const queueNumber = /^A\d+$/.test(orderNumber)
    ? orderNumber
    : /^\d+$/.test(orderSequence) ? `A${Number(orderSequence)}` : null;
  const paymentUrlAllowed = ['unpaid', 'pending', 'processing'].includes(String(order.paymentStatus || '').toLowerCase());
  const publicStatus = derivePublicOrderStatus(order);
  const amounts = {
    subtotal_amount: Number(order.subtotalAmount || order.totals?.subtotal || 0),
    discount_amount: Number(order.discountAmount || order.totals?.discount || 0),
    service_fee_amount: 0,
    tax_amount: 0,
    total_amount: Number(order.totalAmount || order.totals?.total || 0),
    currency: order.currency || order.totals?.currency || 'IDR',
  };
  const timeline = buildPublicTimeline({ order, publicStatus });

  return {
    public_order_token: order.publicOrderToken || order.public_order_token,
    publicOrderToken: order.publicOrderToken || order.public_order_token,
    order_number: orderNumber,
    orderNumber,
    orderNumberPublic: orderNumber,
    // TATA-POS's own generated receipt number, filled in best-effort by the
    // outbox dispatch worker once order.paid is delivered -- null until then
    // (or if the order never synced). Not a replacement for orderNumber
    // above, which stays the customer-facing lookup id.
    pos_receipt_number: order.posReceiptNumber || null,
    posReceiptNumber: order.posReceiptNumber || null,
    queueNumber,
    queue_number: queueNumber,
    channel: order.channel || order.source || 'online_store',
    public_order_status: publicStatus,
    publicOrderStatus: publicStatus,
    payment_status: order.paymentStatus,
    paymentStatus: order.paymentStatus,
    fulfillment_status: order.fulfillmentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillment_type: order.fulfillmentType || 'pickup',
    fulfillmentType: order.fulfillmentType || 'pickup',
    outlet: {
      name: order.outlet?.name || order.outletNameSnapshot || null,
      code: order.outlet?.code || null,
      address: order.outlet?.address || null,
    },
    qr_context: {
      location_label: order.qrLocationLabel || null,
    },
    customer: {
      name: customer.name || customer.contactName || order.customerNameSnapshot || null,
      phone: maskPhone(customer.phone || order.customerPhoneSnapshot),
      phoneMasked: maskPhone(customer.phone || order.customerPhoneSnapshot),
    },
    customerNote: order.fulfillmentSnapshot?.customerNote || order.notes || null,
    amounts,
    totals: {
      subtotalMinor: amounts.subtotal_amount,
      discountMinor: amounts.discount_amount,
      serviceFeeMinor: amounts.service_fee_amount,
      taxMinor: amounts.tax_amount,
      totalMinor: amounts.total_amount,
    },
    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      imageUrl: item.imageUrl || item.image_url || item.metadata?.imageUrl || item.metadata?.image_url || null,
      name: item.productNameSnapshot || item.name,
      productName: item.productNameSnapshot || item.name,
      quantity: item.quantity,
      modifiers: (item.metadata?.modifiers || []).map((modifier) => modifier.option_name || modifier.optionName || modifier.name || modifier.option_id || modifier.optionId).filter(Boolean),
      modifierSummary: (item.metadata?.modifiers || []).map((modifier) => modifier.option_name || modifier.optionName || modifier.name || modifier.option_id || modifier.optionId).filter(Boolean),
      line_total: item.subtotalAmount || item.subtotal,
      lineTotalMinor: item.subtotalAmount || item.subtotal,
      subtotal: item.subtotalAmount || item.subtotal,
    })),
    payment: {
      status: order.paymentStatus,
      payment_url: paymentUrlAllowed ? order.paymentUrl || order.paymentLink || null : null,
      paymentUrl: paymentUrlAllowed ? order.paymentUrl || order.paymentLink || null : null,
      paid_at: order.paidAt || null,
      paidAt: order.paidAt || null,
    },
    confirmationExpiresAt: order.metadata?.confirmationExpiresAt || null,
    confirmationExpired: Boolean(order.metadata?.confirmationExpired),
    timeline,
    created_at: order.createdAt,
    createdAt: order.createdAt,
    updated_at: order.updatedAt,
    updatedAt: order.updatedAt,
  };
}

export const publicOrderInternals = {
  maskPhone,
};

function buildPublicTimeline({ order, publicStatus }) {
  const createdAt = order.createdAt || null;
  const paidAt = order.paidAt || null;
  const preparingAt = order.preparingAt || null;
  const readyAt = order.readyAt || null;
  const completedAt = order.completedAt || null;
  const statuses = [
    { status: 'unconfirmed', label: 'Menunggu Konfirmasi Pesanan', timestamp: createdAt },
    { status: 'unpaid', label: 'Menunggu Pembayaran', timestamp: order.approvedAt || null },
    { status: 'order_received', label: 'Pesanan Diterima', timestamp: paidAt || order.approvedAt || null },
    { status: 'preparing', label: 'Pesanan Sedang Dibuat', timestamp: preparingAt },
    { status: 'ready', label: 'Pesanan Siap Diambil', timestamp: readyAt },
    { status: 'completed', label: 'Pesanan Selesai', timestamp: completedAt },
  ];
  const orderIndex = statuses.findIndex((entry) => entry.status === publicStatus);
  return statuses.map((entry, index) => ({
    ...entry,
    completed: Boolean(entry.timestamp) || (orderIndex >= 0 && index <= orderIndex),
  })).filter((entry) => entry.completed || ['unconfirmed', 'unpaid', 'order_received', 'preparing', 'ready', 'completed'].includes(entry.status));
}
