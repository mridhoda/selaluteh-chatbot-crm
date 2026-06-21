const SENSITIVE_FIELDS = new Set(['token', 'secret', 'password', 'otp', 'apiKey', 'auth', 'credential']);
const MAX_RESULT_SIZE = 50000;

function deepRedact(obj, depth = 0) {
  if (depth > 5) return '[max depth]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return obj;

  const result = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_FIELDS.has(lower) || lower.includes('secret') || lower.includes('token') || lower.includes('auth') || lower.includes('credential')) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = deepRedact(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function safeResult(data, { userSafeMessage } = {}) {
  const redacted = deepRedact(data);
  const serialized = JSON.stringify(redacted);
  const truncated = serialized.length > MAX_RESULT_SIZE
    ? JSON.parse(serialized.slice(0, MAX_RESULT_SIZE) + '"}')
    : redacted;

  return {
    ok: true,
    data: truncated,
    userSafeMessage: userSafeMessage || null,
    retryable: false,
  };
}

export function safeError(errorCode, message, { retryable = false } = {}) {
  return {
    ok: false,
    code: errorCode || 'UNKNOWN_ERROR',
    data: null,
    userSafeMessage: message || 'Terjadi kesalahan. Silakan coba lagi.',
    retryable,
  };
}
