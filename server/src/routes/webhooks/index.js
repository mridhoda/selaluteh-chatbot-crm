import express from 'express';
import telegramV1Router from './telegram-v1.js';
import telegramRouter from './telegram.js';
import metaRouter from './meta.js';
import metaTestRouter from './metaTest.js';
import paymentRouter from './payments.js';
import { webhookRateLimit } from '../../middleware/rate-limit.js';

const router = express.Router();

router.use(webhookRateLimit);

router.use('/telegram/v1', telegramV1Router);
router.use('/telegram', telegramRouter);
router.use('/meta', metaRouter);
router.use('/test-meta', metaTestRouter);
router.use('/payments', paymentRouter);
router.use('/xendit', paymentRouter);
router.use('/doku', paymentRouter);
router.use('/bayargg', paymentRouter);

export default router;
