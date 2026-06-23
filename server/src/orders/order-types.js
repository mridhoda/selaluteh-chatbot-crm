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

export function isValidCartTransition(from, to) {
  const allowed = CART_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isValidOrderTransition(from, to) {
  const allowed = ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
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
