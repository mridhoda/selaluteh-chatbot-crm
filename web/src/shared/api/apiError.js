export const PHASE5_BACKEND_ERROR_MESSAGES = Object.freeze({
  QR_EXPIRED: 'QR code has expired. Please scan a fresh QR code.',
  QR_REVOKED: 'This QR code is no longer active.',
  QR_OUTLET_MISMATCH: 'This QR code is not valid for the selected outlet.',
  QR_LOCATION_MISMATCH: 'This QR code is not valid for the selected location.',
  PRODUCT_UNAVAILABLE: 'One or more products are no longer available.',
  MODIFIER_INVALID: 'One or more selected modifiers are invalid.',
  CHECKOUT_IDEMPOTENCY_REQUIRED: 'Checkout requires an Idempotency-Key. Please retry checkout safely.',
  IDEMPOTENCY_KEY_REQUIRED: 'Checkout requires an Idempotency-Key. Please retry checkout safely.',
  IDEMPOTENCY_CONFLICT: 'This checkout attempt conflicts with a previous request. Please start a new checkout attempt.',
  PAYMENT_PROVIDER_ERROR: 'The payment provider could not process this request. Please try again later.',
  ORDER_INVALID_TRANSITION: 'This order cannot move to the requested status.',
  ORDER_UNPAID: 'This order is not paid yet.',
  FORBIDDEN: 'You are not allowed to perform this action.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  INTERNAL_ERROR: 'Unexpected server error. Please try again later.',
})

const STACK_TRACE_PATTERN = /(?:\bat\s+\S+\s+\(|stack trace|traceback|\n\s*at\s+)/i
const RAW_PROVIDER_PATTERN = /provider[_ -]?payload|raw[_ -]?provider|webhook|signature|api[_ -]?key|secret|token/i
const SAFE_FALLBACK_MESSAGE = 'Request failed. Please try again later.'

function readBackendError(error) {
  const value = error?.response?.data?.error ?? error?.data?.error ?? error?.error
  if (typeof value === 'string') return { message: value }
  if (value && typeof value === 'object') return value
  return null
}

export function mapBackendError(error, fallback = 'Request failed') {
  const backendError = readBackendError(error)
  const code = backendError?.code || error?.code || null
  const mappedMessage = code ? PHASE5_BACKEND_ERROR_MESSAGES[code] : null
  const requestId =
    backendError?.requestId ||
    backendError?.request_id ||
    error?.requestId ||
    error?.request_id ||
    error?.response?.headers?.get?.('x-request-id') ||
    error?.response?.headers?.['x-request-id'] ||
    null

  return {
    code,
    message: sanitizeErrorMessage(mappedMessage || backendError?.message || error?.message || fallback),
    details: sanitizeErrorDetails(backendError?.details ?? error?.details),
    requestId,
    status: error?.response?.status ?? error?.status,
  }
}

export function getApiErrorMessage(error, fallback = 'Request failed') {
  return mapBackendError(error, fallback).message
}

export function sanitizeErrorMessage(message, fallback = SAFE_FALLBACK_MESSAGE) {
  const text = typeof message === 'string' ? message.trim() : ''
  if (!text) return fallback
  if (STACK_TRACE_PATTERN.test(text) || RAW_PROVIDER_PATTERN.test(text)) return fallback
  return text
}

export function sanitizeErrorDetails(details) {
  if (!details || typeof details !== 'object') return undefined
  if (Array.isArray(details)) return details.map(sanitizeErrorDetails).filter((item) => item !== undefined)
  return Object.fromEntries(
    Object.entries(details)
      .filter(([key]) => !RAW_PROVIDER_PATTERN.test(key))
      .map(([key, value]) => [key, typeof value === 'object' ? sanitizeErrorDetails(value) : sanitizeErrorMessage(String(value), '')])
      .filter(([, value]) => value !== '' && value !== undefined),
  )
}

export function getSafeErrorDisplay(error, fallback = SAFE_FALLBACK_MESSAGE) {
  const mapped = mapBackendError(error, fallback)
  return {
    message: mapped.message,
    requestId: mapped.requestId,
    supportText: mapped.requestId ? `Support reference: ${mapped.requestId}` : '',
    canRetry: !['IDEMPOTENCY_CONFLICT', 'QR_REVOKED', 'QR_OUTLET_MISMATCH', 'QR_LOCATION_MISMATCH'].includes(mapped.code),
  }
}
