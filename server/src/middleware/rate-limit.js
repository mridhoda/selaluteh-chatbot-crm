import { AppError } from '../utils/errors.js';

const rateBuckets = new Map();

function getClientIp(req) {
  return String(req.ip || 'unknown').trim() || 'unknown';
}

function getBucketKey(req, keyPrefix, keyGenerator) {
  const subject = typeof keyGenerator === 'function' ? keyGenerator(req) : getClientIp(req);
  return `${keyPrefix}:${subject || getClientIp(req)}`;
}

export function createRateLimit({ keyPrefix, windowMs, max, message = 'Too many requests', keyGenerator }) {
  return (req, _res, next) => {
    try {
      const now = Date.now();
      const key = getBucketKey(req, keyPrefix, keyGenerator);
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
export const publicQrRateLimit = createRateLimit({ keyPrefix: 'public-qr', windowMs: 60 * 1000, max: 60, message: 'Too many QR requests' });
export const publicCartValidateRateLimit = createRateLimit({ keyPrefix: 'public-cart-validate', windowMs: 60 * 1000, max: 30, message: 'Too many cart validation requests' });
export const publicCheckoutRateLimit = createRateLimit({ keyPrefix: 'public-checkout', windowMs: 60 * 1000, max: 10, message: 'Too many checkout requests' });
export const publicPaymentStatusRateLimit = createRateLimit({
  keyPrefix: 'public-payment-status',
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many payment status requests',
  keyGenerator: (req) => `${getClientIp(req)}:${req.params?.paymentId || 'unknown'}`,
});
export const publicOrderRateLimit = createRateLimit({
  keyPrefix: 'public-order',
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many public order requests',
  keyGenerator: (req) => `${getClientIp(req)}:${req.params?.publicOrderToken || 'unknown'}`,
});
export const publicRecommendationRateLimit = createRateLimit({ keyPrefix: 'public-recommendations', windowMs: 60 * 1000, max: 60, message: 'Too many recommendation requests' });
export const publicRecommendationEventRateLimit = createRateLimit({ keyPrefix: 'public-recommendation-events', windowMs: 60 * 1000, max: 120, message: 'Too many recommendation event requests' });
