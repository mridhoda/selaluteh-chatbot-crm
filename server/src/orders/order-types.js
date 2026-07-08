export const CartStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  CONFIRMATION_REQUIRED: 'CONFIRMATION_REQUIRED',
  CONFIRMED: 'CONFIRMED',
  CHECKOUT_LOCKED: 'CHECKOUT_LOCKED',
  CONVERTED: 'CONVERTED',
  ABANDONED: 'ABANDONED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  AWAITING_OUTLET_APPROVAL: 'AWAITING_OUTLET_APPROVAL',
  APPROVED: 'APPROVED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

export const FulfillmentType = {
  PICKUP: 'PICKUP',
  pickup: 'pickup',
};

export const PublicOrderChannel = {
  ONLINE_STORE: 'online_store',
  QR_STORE: 'qr_store',
};

export const RuntimeFulfillmentType = {
  PICKUP: 'pickup',
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
};

export const RuntimeQrLocationType = {
  TABLE: 'table',
  COUNTER: 'counter',
  PICKUP_AREA: 'pickup_area',
  TAKEAWAY_AREA: 'takeaway_area',
  GENERAL_STORE: 'general_store',
  PICKUP_LEGACY: 'pickup',
  AREA_LEGACY: 'area',
  ROOM_LEGACY: 'room',
  OTHER_LEGACY: 'other',
};

export const RuntimeQrStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  ARCHIVED: 'archived',
};

export const RuntimeQrSessionStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const RuntimePaymentProviderCode = {
  BAYARGG: 'bayargg',
  XENDIT: 'xendit',
  DOKU: 'doku',
  MANUAL: 'manual',
};

export const RuntimePaymentProviderMode = {
  SANDBOX: 'sandbox',
  TEST: 'test',
  PRODUCTION: 'production',
};

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  MANUAL_REVIEW: 'manual_review',
};

export const FulfillmentStatus = {
  NOT_STARTED: 'not_started',
  AWAITING_ACCEPTANCE: 'awaiting_acceptance',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PublicOrderStatus = {
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_EXPIRED: 'payment_expired',
  ORDER_RECEIVED: 'order_received',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ActorType = {
  CUSTOMER: 'CUSTOMER',
  HUMAN_AGENT: 'HUMAN_AGENT',
  AI: 'AI',
  SYSTEM: 'SYSTEM',
  PROVIDER_EVENT: 'PROVIDER_EVENT',
  BACKGROUND_JOB: 'BACKGROUND_JOB',
};

export const CART_TRANSITIONS = {
  [CartStatus.DRAFT]: [CartStatus.ACTIVE, CartStatus.CANCELLED],
  [CartStatus.ACTIVE]: [CartStatus.CONFIRMATION_REQUIRED, CartStatus.CANCELLED, CartStatus.ABANDONED, CartStatus.EXPIRED],
  [CartStatus.CONFIRMATION_REQUIRED]: [CartStatus.CONFIRMED, CartStatus.ACTIVE, CartStatus.CANCELLED],
  [CartStatus.CONFIRMED]: [CartStatus.CHECKOUT_LOCKED, CartStatus.ACTIVE],
  [CartStatus.CHECKOUT_LOCKED]: [CartStatus.CONVERTED, CartStatus.ACTIVE],
  [CartStatus.CONVERTED]: [],
  [CartStatus.ABANDONED]: [],
  [CartStatus.EXPIRED]: [],
  [CartStatus.CANCELLED]: [],
};

export const ORDER_TRANSITIONS = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAYMENT_PROCESSING, OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.EXPIRED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PROCESSING]: [OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.PENDING_PAYMENT],
  [OrderStatus.AWAITING_OUTLET_APPROVAL]: [OrderStatus.APPROVED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.APPROVED]: [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.EXPIRED]: [],
};

export const PAYMENT_TRANSITIONS = {
  [PaymentStatus.UNPAID]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
  [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING, PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.EXPIRED, PaymentStatus.CANCELLED],
  [PaymentStatus.PROCESSING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.MANUAL_REVIEW],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED, PaymentStatus.MANUAL_REVIEW],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.EXPIRED]: [],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.CANCELLED]: [],
  [PaymentStatus.MANUAL_REVIEW]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.REFUNDED, PaymentStatus.CANCELLED],
};

export const FULFILLMENT_TRANSITIONS = {
  [FulfillmentStatus.NOT_STARTED]: [FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.AWAITING_ACCEPTANCE]: [FulfillmentStatus.ACCEPTED, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.ACCEPTED]: [FulfillmentStatus.PREPARING, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.PREPARING]: [FulfillmentStatus.READY, FulfillmentStatus.CANCELLED],
  [FulfillmentStatus.READY]: [FulfillmentStatus.COMPLETED],
  [FulfillmentStatus.COMPLETED]: [],
  [FulfillmentStatus.CANCELLED]: [],
};

export function isValidCartTransition(from, to) {
  const allowed = CART_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isValidOrderTransition(from, to) {
  const allowed = ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function canTransitionPayment(from, to) {
  const allowed = PAYMENT_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function canTransitionFulfillment(from, to) {
  const normalizedFrom = normalizeFulfillmentStatus(from);
  const normalizedTo = normalizeFulfillmentStatus(to);
  const allowed = FULFILLMENT_TRANSITIONS[normalizedFrom];
  return allowed ? allowed.includes(normalizedTo) : false;
}

export function normalizeFulfillmentStatus(status) {
  if (status === 'unfulfilled' || !status) return FulfillmentStatus.NOT_STARTED;
  if (status === OrderStatus.AWAITING_OUTLET_APPROVAL) return FulfillmentStatus.AWAITING_ACCEPTANCE;
  if (status === OrderStatus.APPROVED) return FulfillmentStatus.ACCEPTED;
  if (status === OrderStatus.PREPARING) return FulfillmentStatus.PREPARING;
  if (status === OrderStatus.READY_FOR_PICKUP) return FulfillmentStatus.READY;
  if (status === OrderStatus.COMPLETED) return FulfillmentStatus.COMPLETED;
  if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED || status === OrderStatus.EXPIRED) return FulfillmentStatus.CANCELLED;
  return String(status).toLowerCase();
}

export function derivePublicOrderStatus(order = {}) {
  const paymentStatus = String(order.paymentStatus || order.payment_status || PaymentStatus.UNPAID).toLowerCase();
  const fulfillmentStatus = normalizeFulfillmentStatus(order.fulfillmentStatus || order.fulfillment_status || order.status);

  if (fulfillmentStatus === FulfillmentStatus.CANCELLED) return PublicOrderStatus.CANCELLED;
  if (paymentStatus === PaymentStatus.FAILED) return PublicOrderStatus.PAYMENT_FAILED;
  if (paymentStatus === PaymentStatus.EXPIRED) return PublicOrderStatus.PAYMENT_EXPIRED;
  if (paymentStatus !== PaymentStatus.PAID) return PublicOrderStatus.PAYMENT_PENDING;
  if ([FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.NOT_STARTED].includes(fulfillmentStatus)) return PublicOrderStatus.ORDER_RECEIVED;
  if (fulfillmentStatus === FulfillmentStatus.ACCEPTED) return PublicOrderStatus.ACCEPTED;
  if (fulfillmentStatus === FulfillmentStatus.PREPARING) return PublicOrderStatus.PREPARING;
  if (fulfillmentStatus === FulfillmentStatus.READY) return PublicOrderStatus.READY;
  if (fulfillmentStatus === FulfillmentStatus.COMPLETED) return PublicOrderStatus.COMPLETED;
  return PublicOrderStatus.ORDER_RECEIVED;
}

export function getOrderCapabilities(order = {}) {
  const paymentStatus = String(order.paymentStatus || order.payment_status || '').toLowerCase();
  const fulfillmentStatus = normalizeFulfillmentStatus(order.fulfillmentStatus || order.fulfillment_status || order.status);
  const paid = paymentStatus === PaymentStatus.PAID;
  return {
    canAccept: paid && fulfillmentStatus === FulfillmentStatus.AWAITING_ACCEPTANCE,
    canStartPreparing: paid && fulfillmentStatus === FulfillmentStatus.ACCEPTED,
    canMarkReady: paid && fulfillmentStatus === FulfillmentStatus.PREPARING,
    canComplete: paid && fulfillmentStatus === FulfillmentStatus.READY,
    canCancel: [FulfillmentStatus.AWAITING_ACCEPTANCE, FulfillmentStatus.ACCEPTED, FulfillmentStatus.PREPARING].includes(fulfillmentStatus),
  };
}

export const ORDER_ERRORS = {
  CART_NOT_FOUND: { code: 'CART_NOT_FOUND', status: 404 },
  CART_INVALID_STATE: { code: 'CART_INVALID_STATE', status: 400 },
  CART_OUTLET_REQUIRED: { code: 'CART_OUTLET_REQUIRED', status: 400 },
  CART_OUTLET_MISMATCH: { code: 'CART_OUTLET_MISMATCH', status: 400 },
  CART_EMPTY: { code: 'CART_EMPTY', status: 400 },
  CART_ALREADY_CONVERTED: { code: 'CART_ALREADY_CONVERTED', status: 400 },
  ORDER_NOT_FOUND: { code: 'ORDER_NOT_FOUND', status: 404 },
  ORDER_INVALID_TRANSITION: { code: 'ORDER_INVALID_TRANSITION', status: 400 },
  ORDER_PAYMENT_NOT_PAID: { code: 'ORDER_PAYMENT_NOT_PAID', status: 400 },
  ORDER_INVENTORY_COMMIT_FAILED: { code: 'ORDER_INVENTORY_COMMIT_FAILED', status: 500 },
  OUTLET_NOT_ACCEPTING: { code: 'OUTLET_NOT_ACCEPTING_ORDERS', status: 400 },
  PRICING_CHANGED: { code: 'ORDER_PRICING_CHANGED', status: 409 },
  VERSION_CONFLICT: { code: 'VERSION_CONFLICT', status: 409 },
  IDEMPOTENCY_CONFLICT: { code: 'IDEMPOTENCY_CONFLICT', status: 409 },
};
