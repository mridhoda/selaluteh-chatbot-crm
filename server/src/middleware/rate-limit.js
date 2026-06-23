import { AppError } from '../utils/errors.js';

const rateBuckets = new Map();

function getBucketKey(req, keyPrefix) {
  return `${keyPrefix}:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
}

export function createRateLimit({ keyPrefix, windowMs, max, message = 'Too many requests' }) {
  return (req, _res, next) => {
    try {
      const now = Date.now();
      const key = getBucketKey(req, keyPrefix);
      const bucket = rateBuckets.get(key) || { start: now, count: 0 };

      if (now - bucket.start >= windowMs) {
        bucket.start = now;
        bucket.count = 0;
      }

      bucket.count += 1;
      rateBuckets.set(key, bucket);

      if (bucket.count > max) {
        throw new AppError('RATE_LIMITED', message, 429, {
          scope: keyPrefix,
          limit: max,
          windowMs,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const authRateLimit = createRateLimit({ keyPrefix: 'auth', windowMs: 60 * 1000, max: 10, message: 'Too many authentication attempts' });
export const otpRateLimit = createRateLimit({ keyPrefix: 'otp', windowMs: 15 * 60 * 1000, max: 5, message: 'Too many OTP/reset attempts' });
export const webhookRateLimit = createRateLimit({ keyPrefix: 'webhook', windowMs: 60 * 1000, max: 120, message: 'Too many webhook requests' });
export const aiRateLimit = createRateLimit({ keyPrefix: 'ai', windowMs: 60 * 1000, max: 30, message: 'Too many AI requests' });
export const uploadRateLimit = createRateLimit({ keyPrefix: 'upload', windowMs: 60 * 1000, max: 20, message: 'Too many uploads' });
export const providerSyncRateLimit = createRateLimit({ keyPrefix: 'provider-sync', windowMs: 60 * 1000, max: 20, message: 'Too many provider sync requests' });
