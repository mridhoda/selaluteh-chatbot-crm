import { env } from '../config/env.js';

export const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /signature/i,
  /bearer/i,
  /client[_-]?key/i,
  /server[_-]?key/i,
  /webhook/i,
];

function getKnownSecretValues() {
  return [
    env.jwtSecret,
    env.supabaseServiceRoleKey,
    env.supabaseAnonKey,
    env.supabaseDatabaseUrl,
    env.telegramBotToken,
    env.metaVerifyToken,
    env.metaAppSecret,
    env.metaAccessToken,
    env.openaiApiKey,
    env.localAiApiKey,
    env.googleApiKey,
    env.googleMapsApiKey,
    env.xenditSecretApiKey,
    env.xenditWebhookVerificationToken,
    env.midtransServerKey,
    env.midtransClientKey,
    env.paymentWebhookSecret,
    env.smtpUrl,
  ].filter((value) => typeof value === 'string' && value.trim().length >= 8);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldRedactKey(key) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactSecretsInText(value) {
  if (typeof value !== 'string' || value.length === 0) return value;

  let redacted = value;
  for (const secret of getKnownSecretValues()) {
    redacted = redacted.replace(new RegExp(escapeRegExp(secret), 'g'), REDACTED);
  }

  redacted = redacted
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, `Bearer ${REDACTED}`)
    .replace(/(sk|xoxb|xoxp|ghp|gho|ghu|github_pat)_[A-Za-z0-9_\-]{8,}/g, REDACTED);

  return redacted;
}

export function redactSecrets(value) {
  if (value == null) return value;
  if (typeof value === 'string') return redactSecretsInText(value);
  if (Buffer.isBuffer(value)) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item));
  if (typeof value !== 'object') return value;

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (shouldRedactKey(key)) {
      result[key] = item ? REDACTED : item;
      continue;
    }
    result[key] = redactSecrets(item);
  }
  return result;
}
