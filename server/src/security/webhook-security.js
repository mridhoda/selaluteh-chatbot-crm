import crypto from 'node:crypto';
import { AppError } from '../utils/errors.js';

export const MAX_WEBHOOK_BYTES = 256 * 1024;

function toBuffer(rawBody) {
  if (Buffer.isBuffer(rawBody)) return rawBody;
  if (typeof rawBody === 'string') return Buffer.from(rawBody, 'utf8');
  return Buffer.from(JSON.stringify(rawBody || {}), 'utf8');
}

function timingSafeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function assertWebhookPayloadSafe(rawBody, maxBytes = MAX_WEBHOOK_BYTES) {
  const body = toBuffer(rawBody);
  if (body.byteLength > maxBytes) {
    throw new AppError('PAYLOAD_TOO_LARGE', 'Webhook payload exceeds allowed size', 413, {
      maxBytes,
      actualBytes: body.byteLength,
    });
  }
  return body;
}

export function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader) return false;
  const body = toBuffer(rawBody);
  const digest = `sha256=${crypto.createHmac('sha256', appSecret).update(body).digest('hex')}`;
  return timingSafeEqual(signatureHeader, digest);
}

export function verifyTelegramSecret(headerSecret, expectedSecret) {
  if (!expectedSecret) return true;
  if (!headerSecret) return false;
  return timingSafeEqual(headerSecret, expectedSecret);
}
