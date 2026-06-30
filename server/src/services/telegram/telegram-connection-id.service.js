import { randomBytes } from 'node:crypto';

export function generateConnectionPublicId() {
  return `tgc_${randomBytes(12).toString('base64url')}`;
}

export function generateTelegramWebhookSecret() {
  return randomBytes(32).toString('base64url');
}

export function buildTelegramWebhookUrl({ publicBaseUrl, connectionPublicId }) {
  const baseUrl = String(publicBaseUrl || '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('PUBLIC_BASE_URL_REQUIRED');
  if (!connectionPublicId) throw new Error('CONNECTION_PUBLIC_ID_REQUIRED');
  return `${baseUrl}/webhooks/telegram/v1/${connectionPublicId}`;
}

export function isValidTelegramConnectionPublicId(value) {
  return /^tgc_[A-Za-z0-9_-]{16}$/.test(String(value || ''));
}
