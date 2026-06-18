import express from 'express';
import telegramRouter from './telegram.js';
import metaRouter from './meta.js';
import metaTestRouter from './metaTest.js';
import paymentRouter from './payments.js';

const router = express.Router();
const rateBuckets = new Map();

function webhookRateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 120;
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > windowMs) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > max) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many webhook requests' } });
  next();
}

router.use(webhookRateLimit);

router.use('/telegram', telegramRouter);
router.use('/meta', metaRouter);
router.use('/test-meta', metaTestRouter);
router.use('/payments', paymentRouter);

export default router;
