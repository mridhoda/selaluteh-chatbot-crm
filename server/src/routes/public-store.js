import express from 'express';
import { getPublicOrderByToken } from '../services/public-order.service.js';
import { getQrContext } from '../services/qr-order-session.service.js';

const router = express.Router();

router.get('/qr/:qrToken', async (req, res, next) => {
  try {
    const data = await getQrContext({ qrToken: req.params.qrToken });
    res.json({ data });
  } catch (err) { next(err); }
});

router.get('/orders/:publicOrderToken', async (req, res, next) => {
  try {
    const data = await getPublicOrderByToken(req.params.publicOrderToken);
    res.json({ data });
  } catch (err) { next(err); }
});

export default router;
