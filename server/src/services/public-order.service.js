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

  const customer = order.customerSnapshot || {};
  const paymentUrlAllowed = ['unpaid', 'pending', 'processing'].includes(String(order.paymentStatus || '').toLowerCase());
  return {
    id: order.publicOrderToken,
    orderNumber: order.orderNumber,
    channel: order.channel || order.source || 'online_store',
    publicOrderStatus: derivePublicOrderStatus(order),
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillmentType: order.fulfillmentType || 'pickup',
    outlet: {
      name: order.outlet?.name || order.outletNameSnapshot || null,
      code: order.outlet?.code || null,
    },
    qr: {
      tableId: order.tableId || null,
      locationLabel: order.qrLocationLabel || null,
    },
    customer: {
      name: customer.name || customer.contactName || order.customerNameSnapshot || null,
      phone: maskPhone(customer.phone || order.customerPhoneSnapshot),
    },
    totals: order.totals,
    items: (order.items || []).map((item) => ({
      name: item.productNameSnapshot || item.name,
      quantity: item.quantity,
      subtotal: item.subtotalAmount || item.subtotal,
    })),
    payment: {
      status: order.paymentStatus,
      paymentUrl: paymentUrlAllowed ? order.paymentUrl || order.paymentLink || null : null,
      paidAt: order.paidAt || null,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
