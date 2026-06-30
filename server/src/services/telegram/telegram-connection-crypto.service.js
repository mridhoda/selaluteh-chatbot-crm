import crypto from 'node:crypto';

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function hashTelegramWebhookSecret(secret) {
  if (!secret) throw new Error('TELEGRAM_WEBHOOK_SECRET_REQUIRED');
  return sha256Hex(`telegram-webhook-secret:${secret}`);
}

export function verifyTelegramWebhookSecret({ receivedSecret, storedHash }) {
  if (!receivedSecret || !storedHash) return false;
  const receivedHash = hashTelegramWebhookSecret(receivedSecret);
  const left = Buffer.from(receivedHash, 'hex');
  const right = Buffer.from(String(storedHash), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function fingerprintCredential(credential, pepper = process.env.CHANNEL_CREDENTIAL_FINGERPRINT_PEPPER || '') {
  if (!credential) throw new Error('CREDENTIAL_REQUIRED');
  return sha256Hex(`telegram-credential:${credential}:${pepper}`);
}
