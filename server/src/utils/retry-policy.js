import { AppError } from '../utils/errors.js';

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

function jitter(value) {
  return Math.round(value * (0.5 + Math.random() * 0.5));
}

export function computeBackoff(attempt, baseMs = BASE_BACKOFF_MS, maxMs = MAX_BACKOFF_MS) {
  if (attempt < 0) throw new AppError('VALIDATION', 'attempt must be non-negative', 400);
  const exponential = baseMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxMs);
  return jitter(capped);
}

export function isRetriableError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('rate limit') || msg.includes('5') ||
    code === 'etimedout' || code === 'econnrefused' || code === 'econnreset';
}

export function computeNextRun(attempt, maxAttempts) {
  if (attempt >= maxAttempts) return null;
  return new Date(Date.now() + computeBackoff(attempt));
}

export function classifyError(error) {
  if (!error || isRetriableError(error)) return 'retriable';
  return 'permanent';
}
