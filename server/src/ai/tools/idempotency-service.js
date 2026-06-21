import crypto from 'node:crypto';

const idempotencyStore = new Map();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export function generateIdempotencyKey({ chatId, toolName, args }) {
  const stable = `${chatId}:${toolName}:${JSON.stringify(args)}`;
  return crypto.createHash('sha256').update(stable).digest('hex');
}

export function checkIdempotency(key) {
  const existing = idempotencyStore.get(key);
  if (!existing) return null;
  if (Date.now() > existing.expiresAt) {
    idempotencyStore.delete(key);
    return null;
  }
  return existing.result;
}

export function setIdempotencyResult(key, result) {
  idempotencyStore.set(key, {
    result,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
}

export function cleanupIdempotency() {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore) {
    if (now > entry.expiresAt) idempotencyStore.delete(key);
  }
}
