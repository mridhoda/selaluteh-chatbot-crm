import { REDACTED, redactSecrets } from './redaction.js';

const KNOWN_SENSITIVE_FIELDS = new Set([
  'token', 'app_secret', 'webhook_secret', 'password_hash', 'secret_key', 'api_key',
  'authorization', 'auth_header', 'auth_headers', 'raw_auth_header', 'raw_auth_headers',
  'raw_provider_payload', 'raw_provider_response', 'provider_payload', 'provider_response',
]);

export function redactSensitiveDetails(details) {
  if (!details || typeof details !== 'object') return redactSecrets(details);
  const redacted = { ...redactSecrets(details) };
  for (const [key, value] of Object.entries(redacted)) {
    const normalizedKey = key.toLowerCase();
    if (KNOWN_SENSITIVE_FIELDS.has(normalizedKey)
      || normalizedKey.includes('secret')
      || normalizedKey.includes('token')
      || normalizedKey.includes('password')
      || normalizedKey.includes('authorization')
      || normalizedKey.includes('auth_header')
      || normalizedKey.includes('api_key')
      || normalizedKey.includes('secret_key')
      || normalizedKey.includes('webhook_secret')
      || normalizedKey.includes('raw_provider')) {
      redacted[key] = value ? REDACTED : value;
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveDetails(value);
    }
  }
  return redacted;
}
