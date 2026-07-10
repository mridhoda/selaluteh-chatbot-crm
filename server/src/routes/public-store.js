import express from 'express';
import { getPublicOrderByToken, getPublicOrdersByCustomerPhone } from '../services/public-order.service.js';
import { getQrContext, getQrStoreContext } from '../services/qr-order-session.service.js';
import {
  createPublicCheckout,
  getPublicPaymentStatus,
  getPublicStorefront,
  loginPublicStoreCustomer,
  registerPublicStoreCustomer,
  validatePublicCart,
} from '../services/public-storefront.service.js';
import {
  publicCartValidateRateLimit,
  publicCheckoutRateLimit,
  publicOrderRateLimit,
  publicPaymentStatusRateLimit,
  publicQrRateLimit,
} from '../middleware/rate-limit.js';
import { recordSecurityEvent } from '../services/security-event.service.js';

const router = express.Router();

function isV1(req) {
  return String(req.baseUrl || '').includes('/api/v1/');
}

function getQrTokenFromBody(body = {}) {
  return body.qr_token || body.qrToken || body.qr_session_token || body.qrSessionToken;
}

router.get('/stores/:storefrontSlug', async (req, res, next) => {
  try {
    const data = await getPublicStorefront({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId });
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/storefronts/:storefrontSlug', async (req, res, next) => {
  try {
    const data = await getPublicStorefront({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId });
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/qr/:qrToken', publicQrRateLimit, async (req, res, next) => {
  try {
    const outletId = req.query.outlet_id || req.query.outletId || null;
    const data = isV1(req) ? await getQrStoreContext({ qrToken: req.params.qrToken, outletId }) : await getQrContext({ qrToken: req.params.qrToken });
    if (data?.qr_session) delete data.qr_session.workspace_id;
    res.json(isV1(req) ? data : { data });
  } catch (err) {
    if (['QR_INVALID', 'QR_EXPIRED', 'QR_REVOKED', 'QR_OUTLET_UNAVAILABLE', 'QR_OUTLET_MISMATCH'].includes(err.code)) {
      await recordSecurityEvent({ req, eventType: 'qr.invalid_attempt', severity: err.code === 'QR_INVALID' ? 'medium' : 'low', metadata: { code: err.code } });
    }
    next(err);
  }
});

router.post('/carts/validate', publicCartValidateRateLimit, async (req, res, next) => {
  try {
    const data = await validatePublicCart({
      ...req.body,
      storefrontSlug: req.body?.storefront_slug || req.body?.storefrontSlug,
      outletId: req.body?.outlet_id || req.body?.outletId,
      qrToken: getQrTokenFromBody(req.body),
      fulfillmentType: req.body?.fulfillment_type || req.body?.fulfillmentType || 'pickup',
    });
    const { context, ...response } = data;
    res.json(response);
  } catch (err) { next(err); }
});

router.post('/checkout', publicCheckoutRateLimit, async (req, res, next) => {
  try {
    const data = await createPublicCheckout({ idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey, body: req.body });
    res.status(data?.idempotency?.status === 'processing' ? 202 : 201).json(data);
  } catch (err) { next(err); }
});

router.get('/payments/:paymentId/status', publicPaymentStatusRateLimit, async (req, res, next) => {
  try {
    const data = await getPublicPaymentStatus({ paymentId: req.params.paymentId });
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/customer/login', async (req, res, next) => {
  try {
    const data = await loginPublicStoreCustomer({
      storefrontSlug: req.body?.storefrontSlug || req.body?.storefront_slug,
      email: req.body?.email,
      password: req.body?.password,
    });
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/customer/register', async (req, res, next) => {
  try {
    const data = await registerPublicStoreCustomer({
      storefrontSlug: req.body?.storefrontSlug || req.body?.storefront_slug,
      name: req.body?.name,
      phone: req.body?.phone,
      email: req.body?.email,
      password: req.body?.password,
    });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.get('/orders/:publicOrderToken', publicOrderRateLimit, async (req, res, next) => {
  try {
    const data = await getPublicOrderByToken(req.params.publicOrderToken);
    res.json(isV1(req) ? { order: data } : { data });
  } catch (err) { next(err); }
});

router.get('/customer-orders', async (req, res, next) => {
  try {
    const { phone, contactId, contact_id: contactIdSnake } = req.query;
    if (!phone && !(contactId || contactIdSnake)) {
      return res.status(400).json({ error: 'Phone or contactId parameter is required' });
    }
    const data = await getPublicOrdersByCustomerPhone(phone, contactId || contactIdSnake || null);
    res.json({ orders: data });
  } catch (err) { next(err); }
});

export default router;
