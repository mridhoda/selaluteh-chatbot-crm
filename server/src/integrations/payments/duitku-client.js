import crypto from 'node:crypto';
import { AppError } from '../../utils/errors.js';

const API_BASE_URLS = Object.freeze({
  sandbox: 'https://api-sandbox.duitku.com/api/merchant/createInvoice',
  production: 'https://api-prod.duitku.com/api/merchant/createInvoice',
});

function assertConfigured(config = {}) {
  if (!config.merchantCode || !config.apiKey) {
    throw new AppError('DUITKU_NOT_CONFIGURED', 'Duitku Merchant Code and API Key are not configured', 409);
  }
}

function timingSafeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseForm(rawBody) {
  if (!rawBody) return {};
  if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) return rawBody;
  return Object.fromEntries(new URLSearchParams(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody));
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeCustomer(customer = {}, merchantReference = '') {
  const parts = String(customer.name || customer.fullName || 'Customer').trim().split(/\s+/).filter(Boolean);
  const firstName = (parts.shift() || 'Customer').slice(0, 50);
  const lastName = parts.join(' ').slice(0, 50);
  return {
    name: [firstName, lastName].filter(Boolean).join(' '),
    email: String(customer.email || `payment-${merchantReference.toLowerCase()}@checkout.invalid`).slice(0, 100),
    phone: String(customer.phone || '').replace(/\D/g, '').replace(/^0/, '62').slice(0, 20),
  };
}

export function buildDuitkuRequestSignature({ merchantCode, timestamp, apiKey }) {
  return crypto.createHmac('sha256', apiKey).update(`${merchantCode}${timestamp}`, 'utf8').digest('hex');
}

export function buildDuitkuWebhookSignature({ merchantCode, amount, merchantOrderId, apiKey }) {
  return crypto.createHmac('sha256', apiKey).update(`${merchantCode}${amount}${merchantOrderId}`, 'utf8').digest('hex');
}

export function normalizeDuitkuLineItems(items, amount, productDetails = 'Order') {
  const normalized = (Array.isArray(items) ? items : []).map((item, index) => {
    const quantity = Number(item.quantity || 1);
    const subtotal = Number(item.subtotalAmount ?? item.subtotal ?? item.lineTotal ?? 0);
    const price = Number(item.unitPrice ?? item.price ?? (Number.isInteger(subtotal / quantity) ? subtotal / quantity : 0));
    return {
      name: String(item.name || item.productNameSnapshot || `Item ${index + 1}`).slice(0, 255),
      price,
      quantity,
    };
  }).filter((item) => Number.isInteger(item.price) && Number.isInteger(item.quantity) && item.price > 0 && item.quantity > 0);
  const total = normalized.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return total === Number(amount) ? normalized : [{ name: String(productDetails || 'Order').slice(0, 255), price: Number(amount), quantity: 1 }];
}

export function buildDuitkuInvoicePayload(input = {}, config = {}) {
  const merchantOrderId = String(input.referenceId || input.merchantReference || '').slice(0, 50);
  if (!merchantOrderId) throw new AppError('DUITKU_INVALID_REFERENCE', 'Duitku merchant order reference is required', 400);
  const amount = Number(input.amount);
  if (!Number.isInteger(amount) || amount <= 0) throw new AppError('DUITKU_INVALID_AMOUNT', 'Duitku payment amount must be a positive IDR integer', 400);
  const customer = normalizeCustomer(input.customer, merchantOrderId);
  const productDetails = String(input.productDetails || `Order ${input.orderNumber || merchantOrderId}`).slice(0, 255);
  return {
    paymentAmount: amount,
    merchantOrderId,
    productDetails,
    email: customer.email,
    customerVaName: customer.name,
    phoneNumber: customer.phone,
    itemDetails: normalizeDuitkuLineItems(input.items, amount, productDetails),
    callbackUrl: input.callbackUrl,
    returnUrl: input.returnUrl || input.successReturnUrl,
    expiryPeriod: Number(config.paymentTtlMinutes || 15),
    ...(Array.isArray(config.paymentMethods) && config.paymentMethods.length > 0 ? { paymentMethod: config.paymentMethods.join(',') } : {}),
  };
}

export function normalizeDuitkuInvoiceResponse(payload = {}, input = {}) {
  if (String(payload.statusCode || '') !== '00' || !payload.reference || !isHttpsUrl(payload.paymentUrl)) {
    throw new AppError('DUITKU_INVALID_RESPONSE', 'Duitku returned an invalid invoice response', 502);
  }
  return {
    provider: 'duitku',
    providerTransactionId: String(payload.reference),
    providerSessionId: String(payload.reference),
    merchantReference: String(input.referenceId || input.merchantReference),
    status: 'pending',
    providerStatus: payload.statusCode,
    amount: Number(input.amount),
    currency: 'IDR',
    paymentUrl: payload.paymentUrl,
    expiresAt: new Date(Date.now() + Number(input.paymentTtlMinutes || 15) * 60 * 1000).toISOString(),
    rawProviderResponse: payload,
  };
}

export async function createPaymentSession(input = {}, config = {}) {
  assertConfigured(config);
  const timestamp = String(Date.now());
  const payload = buildDuitkuInvoicePayload(input, config);
  const response = await fetch(config.apiUrl || API_BASE_URLS[config.environment === 'production' ? 'production' : 'sandbox'], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-duitku-merchantcode': config.merchantCode,
      'x-duitku-timestamp': timestamp,
      'x-duitku-signature': buildDuitkuRequestSignature({ merchantCode: config.merchantCode, timestamp, apiKey: config.apiKey }),
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let result = {};
  try { result = text ? JSON.parse(text) : {}; } catch { throw new AppError('DUITKU_INVALID_RESPONSE', 'Duitku returned invalid JSON', 502); }
  if (!response.ok) {
    throw new AppError('DUITKU_PROVIDER_ERROR', 'Duitku invoice request failed', response.status >= 500 ? 502 : response.status, { providerStatus: response.status });
  }
  return normalizeDuitkuInvoiceResponse(result, { ...input, paymentTtlMinutes: config.paymentTtlMinutes });
}

export async function createPayment(params, config) {
  return createPaymentSession({
    referenceId: params.merchantReference,
    orderId: params.orderId,
    amount: params.amount,
    currency: params.currency,
    customer: params.customer,
    items: params.items,
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl || params.successReturnUrl,
  }, config);
}

export async function getPayment() {
  throw new AppError('DUITKU_STATUS_INQUIRY_NOT_SUPPORTED', 'Duitku POP status inquiry is not supported', 501);
}

export async function getPaymentSession() {
  return getPayment();
}

export function normalizeWebhookEvent(payload = {}) {
  const resultCode = String(payload.resultCode || '');
  return {
    provider: 'duitku',
    providerEventId: `${payload.reference || payload.merchantOrderId}:${resultCode}`,
    providerTransactionId: String(payload.reference || ''),
    providerSessionId: String(payload.reference || ''),
    merchantReference: String(payload.merchantOrderId || ''),
    eventType: resultCode === '00' ? 'payment.success' : 'payment.failed',
    status: resultCode === '00' ? 'paid' : 'failed',
    providerStatus: resultCode,
    amount: Number(payload.amount || 0),
    currency: 'IDR',
    paymentMethod: payload.paymentCode || payload.paymentMethod || null,
    raw: payload,
  };
}

export async function verifyWebhook(rawBody, _headers = {}, config = {}) {
  assertConfigured(config);
  const payload = parseForm(rawBody);
  if (String(payload.merchantCode || '') !== String(config.merchantCode)) return { valid: false, reason: 'merchant_code_mismatch' };
  if (!payload.amount || !payload.merchantOrderId || !payload.reference || !payload.signature) return { valid: false, reason: 'missing_required_fields' };
  const expected = buildDuitkuWebhookSignature({ merchantCode: config.merchantCode, amount: payload.amount, merchantOrderId: payload.merchantOrderId, apiKey: config.apiKey });
  if (!timingSafeEqual(payload.signature, expected)) return { valid: false, reason: 'invalid_signature' };
  return { valid: true, event: normalizeWebhookEvent(payload), raw: payload };
}
