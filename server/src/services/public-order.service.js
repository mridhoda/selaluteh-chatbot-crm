import { ordersRepository } from '../db/repositories/index.js';
import { derivePublicOrderStatus } from '../orders/order-types.js';
import { AppError } from '../utils/errors.js';

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length <= 4) return digits ? '****' : null;
  return `${digits.slice(0, 2)}${'*'.repeat(Math.max(digits.length - 5, 4))}${digits.slice(-3)}`;
}

export async function getPublicOrderByToken(publicOrderToken) {
  const order = await ordersRepository.findByPublicOrderToken({ token: publicOrderToken });
  if (!order) throw new AppError('PUBLIC_ORDER_NOT_FOUND', 'Order not found', 404);

  return transformOrderToPublic(order);
}

export function transformOrderToPublic(order) {
  const customer = order.customerSnapshot || {};
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
    order_number: order.orderNumber,
    orderNumber: order.orderNumber,
    orderNumberPublic: order.orderNumber,
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
    { status: 'payment_pending', label: 'Menunggu Pembayaran', timestamp: createdAt },
    { status: 'order_received', label: 'Pesanan Diterima', timestamp: paidAt || order.approvedAt || null },
    { status: 'preparing', label: 'Pesanan Sedang Dibuat', timestamp: preparingAt },
    { status: 'ready', label: 'Pesanan Siap Diambil', timestamp: readyAt },
    { status: 'completed', label: 'Pesanan Selesai', timestamp: completedAt },
  ];
  const orderIndex = statuses.findIndex((entry) => entry.status === publicStatus);
  return statuses.map((entry, index) => ({
    ...entry,
    completed: Boolean(entry.timestamp) || (orderIndex >= 0 && index <= orderIndex),
  })).filter((entry) => entry.completed || ['payment_pending', 'order_received', 'preparing', 'ready', 'completed'].includes(entry.status));
}
