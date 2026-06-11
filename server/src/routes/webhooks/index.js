import express from 'express';
import telegramRouter from './telegram.js';
import metaRouter from './meta.js';
import metaTestRouter from './metaTest.js';

const router = express.Router();

router.use('/telegram', telegramRouter);
router.use('/meta', metaRouter);
router.use('/test-meta', metaTestRouter);

export default router;
