import { AppError } from '../../utils/errors.js';

const DEFAULT_API_BASE_URL = 'https://www.bayar.gg/api';
const DEFAULT_CHECKOUT_URL = 'https://www.bayar.gg/pay';

const STATUS_MAP = {
  paid: 'paid',
  success: 'paid',
  settled: 'paid',
  pending: 'pending',
  unpaid: 'pending',
  expired: 'expired',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  failed: 'failed',
};

function assertConfigured(config = {}) {
  if (!config.apiKey) throw new AppError('BAYARGG_NOT_CONFIGURED', 'Bayar.gg API Key is not configured', 409);
}

function parseJsonBody(rawBody) {
  if (!rawBody) return {};
  if (Buffer.isBuffer(rawBody)) return JSON.parse(rawBody.toString('utf8'));
  if (typeof rawBody === 'string') return JSON.parse(rawBody);
  return rawBody;
}

function compactObject(value = {}) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function mapStatus(status) {
  return STATUS_MAP[String(status || '').toLowerCase()] || 'pending';
}

async function requestBayarGg(path, { method = 'GET', body, query } = {}, config = {}) {
  assertConfigured(config);
  const url = new URL(`${(config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '')}${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok || payload?.success === false) {
    throw new AppError('BAYARGG_PROVIDER_ERROR', payload?.message || 'Bayar.gg payment request failed', response.status >= 500 ? 502 : response.status || 502, {
      providerStatus: response.status,
      providerResponse: payload,
    });
  }
  return payload;
}

export function normalizeCreatePaymentResponse(payload = {}, fallback = {}) {
  const data = payload.data || payload.payment || payload;
  const invoiceId = data.invoice_id || data.invoice || data.id || fallback.referenceId;
  return {
    provider: 'bayargg',
    providerSessionId: invoiceId,
    providerTransactionId: invoiceId,
    merchantReference: fallback.referenceId,
    status: mapStatus(data.status),
    providerStatus: data.status || null,
    amount: Number(data.final_amount || data.amount || fallback.amount || 0),
    currency: data.currency || fallback.currency || 'IDR',
    paymentUrl: data.payment_url || data.checkout_url || '',
    expiresAt: data.expires_at || null,
    paymentMethod: data.payment_method || fallback.paymentMethod || null,
    rawProviderResponse: payload,
  };
}

export function normalizeWebhookEvent(providerEvent = {}, headers = {}) {
  const timestamp = headers['x-webhook-timestamp'] || headers['X-Webhook-Timestamp'] || providerEvent.timestamp || '';
  const invoiceId = providerEvent.invoice_id || providerEvent.invoice || providerEvent.id;
  return {
    provider: 'bayargg',
    providerEventId: providerEvent.paid_reff_num || `${invoiceId}:${providerEvent.event || 'payment.paid'}:${timestamp}`,
    providerTransactionId: invoiceId,
    providerSessionId: invoiceId,
    merchantReference: null,
    eventType: providerEvent.event || 'payment.paid',
    status: mapStatus(providerEvent.status),
    providerStatus: providerEvent.status || null,
    amount: Number(providerEvent.final_amount || providerEvent.amount || 0),
    currency: providerEvent.currency || 'IDR',
    paymentMethod: providerEvent.paid_via || providerEvent.payment_method || null,
    paidAt: providerEvent.paid_at || null,
    raw: providerEvent,
  };
}

export async function createPaymentSession(input = {}, config = {}) {
  assertConfigured(config);
  const checkoutUrl = config.checkoutUrl || DEFAULT_CHECKOUT_URL;
  if (!/^https:\/\//i.test(checkoutUrl)) throw new AppError('BAYARGG_INVALID_CHECKOUT_URL', 'Bayar.gg checkout URL must be HTTPS', 400);
  const customer = input.customer || {};
  const body = compactObject({
    amount: Number(input.amount),
    payment_url: checkoutUrl,
    description: `Order ${input.orderNumber || input.orderId || ''} - Ref ${input.referenceId}`.trim(),
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    callback_url: input.callbackUrl,
    redirect_url: input.successReturnUrl,
    payment_method: config.paymentMethod,
    use_qris_converter: config.useQrisConverter === true ? true : undefined,
  });
  const payload = await requestBayarGg('/create-payment.php', { method: 'POST', body }, config);
  return normalizeCreatePaymentResponse(payload, { ...input, paymentMethod: config.paymentMethod });
}

export async function createPayment(params, config) {
  return createPaymentSession({ ...params, referenceId: params.merchantReference }, config);
}

export async function getPayment(providerTransactionId, config = {}) {
  const payload = await requestBayarGg('/check-payment.php', { query: { invoice: providerTransactionId } }, config);
  return normalizeCreatePaymentResponse(payload, { referenceId: providerTransactionId });
}

export async function getPaymentSession(providerTransactionId, config = {}) {
  return getPayment(providerTransactionId, config);
}

/**
 * Bayar.gg webhook verification.
 *
 * Per dokumentasi resmi Bayar.gg (docs/webhooks.md):
 * Body callback TIDAK ditandatangani — tidak ada header signature/HMAC.
 * Pola aman: baca invoice_id dari body, verifikasi ulang ke check-payment API,
 * lanjutkan fulfilment hanya jika API sendiri menyatakan paid.
 */
export async function verifyWebhook(rawBody, headers = {}, config = {}) {
  if (!config.apiKey) return { valid: false, reason: 'missing_api_key' };
  const parsed = parseJsonBody(rawBody);
  const invoiceId = parsed.invoice_id || parsed.invoice;
  if (!invoiceId) return { valid: false, reason: 'missing_invoice_id' };

  // Verifikasi ulang ke Bayar.gg — jangan percaya status di body saja
  let verified;
  try {
    verified = await getPayment(invoiceId, config);
  } catch (err) {
    return { valid: false, reason: `check_payment_failed: ${err.message}` };
  }

  // Ambil event dari payload body webhook (lebih lengkap), tapi status dari verifikasi API
  const event = normalizeWebhookEvent({ ...parsed, status: verified.providerStatus || parsed.status }, headers);
  event.status = verified.status; // override dengan status terverifikasi
  event.amount = verified.amount; // override dengan amount terverifikasi
  event.currency = verified.currency;

  return { valid: true, event, raw: parsed, verified };
}
