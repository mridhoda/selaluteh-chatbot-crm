export const PaymentStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
};

export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const ProviderMode = {
  TEST: 'test',
  LIVE: 'live',
};

export const PAYMENT_TRANSITIONS = {
  [PaymentStatus.CREATED]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.EXPIRED, PaymentStatus.REVIEW_REQUIRED, PaymentStatus.CANCELLED],
  [PaymentStatus.PAID]: [],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.EXPIRED]: [],
  [PaymentStatus.CANCELLED]: [],
  [PaymentStatus.REVIEW_REQUIRED]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
};

export function isValidPaymentTransition(from, to) {
  const allowed = PAYMENT_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export const PAYMENT_ERRORS = {
  NOT_FOUND: { code: 'PAYMENT_NOT_FOUND', status: 404 },
  ALREADY_PAID: { code: 'PAYMENT_ALREADY_PAID', status: 400 },
  AMOUNT_MISMATCH: { code: 'PAYMENT_AMOUNT_MISMATCH', status: 409 },
  INVALID_TRANSITION: { code: 'PAYMENT_INVALID_TRANSITION', status: 400 },
  PROVIDER_TIMEOUT: { code: 'PAYMENT_PROVIDER_TIMEOUT', status: 502 },
  SESSION_EXPIRED: { code: 'PAYMENT_SESSION_EXPIRED', status: 400 },
  CROSS_OUTLET: { code: 'PAYMENT_CROSS_OUTLET', status: 403 },
  WEBHOOK_VERIFICATION_FAILED: { code: 'WEBHOOK_VERIFICATION_FAILED', status: 401 },
};
