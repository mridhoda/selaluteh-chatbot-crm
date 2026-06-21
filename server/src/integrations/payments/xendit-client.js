import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

const SESSION_STATUS_MAP = {
  ACTIVE: 'pending',
  COMPLETED: 'paid',
  EXPIRED: 'expired',
  CANCELED: 'cancelled',
};

function assertConfigured() {
  if (env.xenditMode !== 'test') {
    throw new AppError('XENDIT_LIVE_MODE_DISABLED', 'Xendit live mode is not allowed for this integration', 500);
  }
  if (!env.xenditSecretApiKey) {
    throw new AppError('XENDIT_NOT_CONFIGURED', 'Xendit Test Mode secret key is not configured', 500);
  }
}

function authHeader() {
  return `Basic ${Buffer.from(`${env.xenditSecretApiKey}:`).toString('base64')}`;
}

function safeJsonParse(rawBody) {
  if (!rawBody) return {};
  if (Buffer.isBuffer(rawBody)) return JSON.parse(rawBody.toString('utf8'));
  if (typeof rawBody === 'string') return JSON.parse(rawBody);
  return rawBody;
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function requestXendit(path, { method = 'GET', body } = {}) {
  assertConfigured();
  const response = await fetch(`${env.xenditApiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const code = payload.error_code || (response.status === 401 ? 'XENDIT_AUTHENTICATION_FAILED' : 'XENDIT_PROVIDER_ERROR');
    throw new AppError(code, 'Xendit payment session request failed', response.status >= 500 ? 502 : response.status, {
      providerStatus: response.status,
      providerCode: payload.error_code,
    });
  }
  return payload;
}

function normalizeCustomer(customer = {}) {
  const name = String(customer.name || customer.fullName || customer.givenNames || 'Customer').replace(/[^a-zA-Z0-9 ]/g, ' ').trim().slice(0, 50) || 'Customer';
  const reference = String(customer.referenceId || customer.id || customer.phone || customer.email || name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 255) || 'Customer';
  const result = {
    reference_id: reference,
    type: 'INDIVIDUAL',
    individual_detail: { given_names: name },
  };
  if (customer.email && String(customer.email).length <= 50) result.email = String(customer.email);
  if (customer.phone || customer.mobileNumber) result.mobile_number = String(customer.phone || customer.mobileNumber).slice(0, 50);
  return result;
}

export function buildPaymentSessionPayload(input) {
  const expiresAt = input.expiresAt || new Date(Date.now() + env.xenditPaymentSessionTtlMinutes * 60 * 1000).toISOString();
  return {
    reference_id: input.referenceId,
    session_type: 'PAY',
    mode: env.xenditPaymentSessionMode,
    amount: Number(input.amount),
    currency: input.currency || env.xenditPaymentCurrency,
    country: env.xenditPaymentCountry,
    capture_method: env.xenditPaymentCaptureMethod,
    allow_save_payment_method: 'DISABLED',
    customer: normalizeCustomer(input.customer),
    description: input.description || `Payment for order ${input.orderNumber || input.orderId}`,
    success_return_url: input.successReturnUrl,
    cancel_return_url: input.cancelReturnUrl,
    expires_at: expiresAt,
    locale: 'id',
    metadata: input.metadata || {},
  };
}

export async function createPaymentSession(input) {
  const payload = buildPaymentSessionPayload(input);
  const session = await requestXendit('/sessions', { method: 'POST', body: payload });
  return normalizeSession(session);
}

export async function getPaymentSession(providerSessionId) {
  const session = await requestXendit(`/sessions/${encodeURIComponent(providerSessionId)}`);
  return normalizeSession(session);
}

export function normalizeSession(session = {}) {
  return {
    provider: 'xendit',
    providerSessionId: session.payment_session_id,
    providerTransactionId: session.payment_session_id,
    providerPaymentRequestId: session.payment_request_id || null,
    providerPaymentId: session.payment_id || null,
    merchantReference: session.reference_id,
    status: mapSessionStatus(session.status),
    providerStatus: session.status,
    amount: Number(session.amount || 0),
    currency: session.currency || 'IDR',
    paymentUrl: session.payment_link_url || '',
    expiresAt: session.expires_at || null,
    businessId: session.business_id || null,
    rawProviderResponse: session,
  };
}

export function mapSessionStatus(status) {
  return SESSION_STATUS_MAP[String(status || '').toUpperCase()] || 'pending';
}

export async function verifyWebhook(rawBody, headers = {}) {
  const configuredToken = env.xenditWebhookVerificationToken || env.paymentWebhookSecret;
  if (!configuredToken) return { valid: false, reason: 'missing_configured_token' };
  const callbackToken = headers['x-callback-token'] || headers['X-Callback-Token'];
  if (!callbackToken || !timingSafeEqual(callbackToken, configuredToken)) {
    return { valid: false, reason: 'invalid_callback_token' };
  }
  const parsed = safeJsonParse(rawBody);
  return { valid: true, event: normalizeWebhookEvent(parsed), raw: parsed };
}

export function normalizeWebhookEvent(providerEvent = {}) {
  const data = providerEvent.data || {};
  const session = normalizeSession(data);
  const eventType = providerEvent.event || 'payment_session.unknown';
  return {
    provider: 'xendit',
    providerEventId: providerEvent.webhook_id || providerEvent.id || `${data.payment_session_id || data.reference_id}:${eventType}:${data.updated || providerEvent.created || ''}`,
    providerTransactionId: data.payment_session_id,
    providerSessionId: data.payment_session_id,
    providerPaymentRequestId: data.payment_request_id || null,
    providerPaymentId: data.payment_id || null,
    merchantReference: data.reference_id,
    eventType,
    status: session.status,
    providerStatus: data.status,
    amount: session.amount,
    currency: session.currency,
    paymentUrl: session.paymentUrl,
    businessId: providerEvent.business_id || data.business_id || null,
    updatedAt: data.updated || providerEvent.created || null,
    raw: providerEvent,
  };
}

export async function createPayment(params) {
  const result = await createPaymentSession({
    referenceId: params.merchantReference,
    orderId: params.orderId,
    amount: params.amount,
    currency: params.currency,
    customer: params.customer,
    successReturnUrl: params.successReturnUrl,
    cancelReturnUrl: params.cancelReturnUrl,
    metadata: params.metadata,
  });
  return result;
}

export async function getPayment(providerTransactionId) {
  return getPaymentSession(providerTransactionId);
}

export async function cancelPayment() {
  throw new AppError('XENDIT_CANCEL_NOT_IMPLEMENTED', 'Xendit Payment Session cancellation is not implemented for MVP', 501);
}
