import crypto from 'node:crypto';
import { AppError } from '../../utils/errors.js';

const CHECKOUT_PATH = '/checkout/v1/payment';
const STATUS_MAP = {
  SUCCESS: 'paid',
  PENDING: 'pending',
  EXPIRED: 'expired',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
  REFUNDED: 'refunded',
};

function assertConfigured(config = {}) {
  if (!config.clientId || !config.secretKey) {
    throw new AppError('DOKU_NOT_CONFIGURED', 'DOKU Client ID and Secret Key are not configured', 409);
  }
}

function compactJson(value) {
  return JSON.stringify(value ?? {});
}

function sha256HexLower(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex').toLowerCase();
}

function sha256Base64(value) {
  return crypto.createHash('sha256').update(value).digest('base64');
}

export function buildDokuRequestSignature({ method = 'POST', path = CHECKOUT_PATH, body, timestamp, secretKey }) {
  const bodyMinified = typeof body === 'string' ? body : compactJson(body);
  const digest = sha256HexLower(bodyMinified);
  const stringToSign = `${method}:${path}:${digest}:${timestamp}`;
  const signature = crypto.createHmac('sha512', secretKey).update(stringToSign, 'utf8').digest('base64');
  return `HMACSHA256=${signature}`;
}

export function buildDokuNotificationSignature({ rawBody, headers = {}, requestTarget, secretKey }) {
  const clientId = headers['client-id'] || headers['Client-Id'];
  const requestId = headers['request-id'] || headers['Request-Id'];
  const requestTimestamp = headers['request-timestamp'] || headers['Request-Timestamp'];
  const digest = sha256Base64(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(typeof rawBody === 'string' ? rawBody : compactJson(rawBody)));
  const stringToSign = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join('\n');
  const signature = crypto.createHmac('sha256', secretKey).update(stringToSign, 'utf8').digest('base64');
  return `HMACSHA256=${signature}`;
}

function timingSafeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function normalizeCustomer(customer = {}) {
  const name = customer.name || customer.fullName || 'Customer';
  const [firstName, ...rest] = String(name).trim().split(/\s+/);
  return {
    id: String(customer.referenceId || customer.id || customer.phone || customer.email || 'customer').slice(0, 50),
    name: firstName || 'Customer',
    last_name: rest.join(' ').slice(0, 16) || undefined,
    phone: customer.phone ? String(customer.phone).replace(/^0/, '62').slice(0, 16) : undefined,
    email: customer.email || undefined,
    country: 'ID',
  };
}

function normalizeLineItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: String(item.id || item.productId || index + 1).slice(0, 64),
    name: String(item.name || item.productNameSnapshot || 'Item').slice(0, 255),
    quantity: Number(item.quantity || 1),
    price: Number(item.unitPrice || item.price || item.subtotalAmount || item.subtotal || 0),
    sku: String(item.sku || item.productId || '').slice(0, 64) || undefined,
    category: item.category || 'food-and-beverage',
  })).filter((item) => item.price > 0);
}

export function buildDokuCheckoutPayload(input = {}, config = {}) {
  const paymentMethods = Array.isArray(config.paymentMethods) && config.paymentMethods.length > 0
    ? config.paymentMethods
    : undefined;
  return {
    order: {
      amount: Number(input.amount),
      invoice_number: input.referenceId,
      currency: input.currency || 'IDR',
      callback_url: input.successReturnUrl,
      callback_url_cancel: input.cancelReturnUrl,
      callback_url_result: input.successReturnUrl,
      language: 'ID',
      auto_redirect: true,
      ...(input.items?.length ? { line_items: normalizeLineItems(input.items) } : {}),
    },
    payment: {
      payment_due_date: Number(config.paymentTtlMinutes || 60),
      ...(paymentMethods ? { payment_method_types: paymentMethods } : {}),
    },
    customer: normalizeCustomer(input.customer),
    additional_info: {
      ...(input.notificationUrl ? { override_notification_url: input.notificationUrl } : {}),
    },
  };
}

function parseDokuExpiredDate(value) {
  if (!value || !/^\d{14}$/.test(String(value))) return null;
  const raw = String(value);
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  const hour = raw.slice(8, 10);
  const minute = raw.slice(10, 12);
  const second = raw.slice(12, 14);
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`).toISOString();
}

export function normalizeCheckoutResponse(payload = {}, fallback = {}) {
  const response = payload.response || payload;
  const order = response.order || {};
  const payment = response.payment || {};
  const sessionId = order.session_id || payment.token_id || response.uuid || fallback.referenceId;
  return {
    provider: 'doku',
    providerSessionId: sessionId,
    providerTransactionId: payment.token_id || sessionId,
    merchantReference: order.invoice_number || fallback.referenceId,
    status: 'pending',
    providerStatus: 'PENDING',
    amount: Number(order.amount || fallback.amount || 0),
    currency: order.currency || fallback.currency || 'IDR',
    paymentUrl: payment.url || '',
    expiresAt: parseDokuExpiredDate(payment.expired_date),
    rawProviderResponse: payload,
  };
}

export async function createPaymentSession(input = {}, config = {}) {
  assertConfigured(config);
  const path = CHECKOUT_PATH;
  const payload = buildDokuCheckoutPayload(input, config);
  const body = compactJson(payload);
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const requestId = input.idempotencyKey || crypto.randomUUID();
  const signature = buildDokuRequestSignature({ method: 'POST', path, body, timestamp, secretKey: config.secretKey });
  const response = await fetch(`${config.apiBaseUrl || 'https://api-sandbox.doku.com'}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Client-Id': config.clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      Signature: signature,
    },
    body,
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new AppError('DOKU_PROVIDER_ERROR', 'DOKU Checkout payment request failed', response.status >= 500 ? 502 : response.status, {
      providerStatus: response.status,
      providerResponse: result,
    });
  }
  return normalizeCheckoutResponse(result, input);
}

export async function createPayment(params, config) {
  return createPaymentSession({
    referenceId: params.merchantReference,
    orderId: params.orderId,
    amount: params.amount,
    currency: params.currency,
    customer: params.customer,
    items: params.items,
    successReturnUrl: params.successReturnUrl,
    cancelReturnUrl: params.cancelReturnUrl,
    notificationUrl: params.notificationUrl,
    idempotencyKey: params.idempotencyKey,
  }, config);
}

export async function getPayment() {
  throw new AppError('DOKU_STATUS_INQUIRY_NOT_CONFIGURED', 'DOKU Checkout status inquiry endpoint is not configured yet', 501);
}

export async function getPaymentSession() {
  return getPayment();
}

export async function cancelPayment() {
  throw new AppError('DOKU_CANCEL_NOT_IMPLEMENTED', 'DOKU Checkout cancellation is not implemented yet', 501);
}

export function normalizeWebhookEvent(providerEvent = {}) {
  const order = providerEvent.order || {};
  const transaction = providerEvent.transaction || {};
  const service = providerEvent.service || {};
  const status = STATUS_MAP[String(transaction.status || '').toUpperCase()] || 'pending';
  return {
    provider: 'doku',
    providerEventId: transaction.original_request_id || `${order.invoice_number}:${transaction.status}:${transaction.date || ''}`,
    providerTransactionId: transaction.original_request_id || order.invoice_number,
    providerSessionId: transaction.original_request_id || null,
    merchantReference: order.invoice_number,
    eventType: transaction.status || 'UNKNOWN',
    status,
    providerStatus: transaction.status || null,
    amount: Number(order.amount || 0),
    currency: order.currency || 'IDR',
    paymentMethod: service.id || null,
    paidAt: transaction.date || null,
    raw: providerEvent,
  };
}

export async function verifyWebhook(rawBody, headers = {}, config = {}, requestTarget = '/webhook/doku') {
  assertConfigured(config);
  const received = headers.signature || headers.Signature;
  if (!received) return { valid: false, reason: 'missing_signature' };
  const expected = buildDokuNotificationSignature({ rawBody, headers, requestTarget, secretKey: config.secretKey });
  if (!timingSafeEqual(received, expected)) return { valid: false, reason: 'invalid_signature' };
  const parsed = Buffer.isBuffer(rawBody)
    ? JSON.parse(rawBody.toString('utf8'))
    : typeof rawBody === 'string'
      ? JSON.parse(rawBody)
      : rawBody;
  return { valid: true, event: normalizeWebhookEvent(parsed), raw: parsed };
}
