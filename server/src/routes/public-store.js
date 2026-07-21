import express from 'express';
import { getPublicOrderByToken } from '../services/public-order.service.js';
import { getQrContext, getQrStoreContext } from '../services/qr-order-session.service.js';
import {
  createPublicCheckout,
  getPublicStoreMenu,
  getPublicPaymentStatus,
  getPublicStorefront,
  validatePublicCart,
} from '../services/public-storefront.service.js';
import {
  publicCartValidateRateLimit,
  publicCheckoutRateLimit,
  publicOrderRateLimit,
  publicPaymentStatusRateLimit,
  publicQrRateLimit,
  publicRecommendationEventRateLimit,
  publicRecommendationRateLimit,
} from '../middleware/rate-limit.js';
import { recordSecurityEvent } from '../services/security-event.service.js';
import { getPublicCustomerSession, loginPublicCustomer, registerPublicCustomer, requirePublicCustomer, listPublicCustomerOrders } from '../services/public-customer.service.js';
import { AppError } from '../utils/errors.js';
import { ingestRecommendationEvent, resolvePublicRecommendations } from '../services/product-recommendation.service.js';

const router = express.Router();
const storefrontCacheControl = 'public, max-age=60';

function isV1(req) {
  return String(req.baseUrl || '').includes('/api/v1/');
}

function getQrTokenFromBody(body = {}) {
  return body.qr_token || body.qrToken || body.qr_session_token || body.qrSessionToken;
}

function getMenuQuery(query = {}) {
  const page = Number(query.page ?? 0);
  const limit = Number(query.limit ?? 24);
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(limit) || limit < 1 || limit > 48) {
    throw new AppError('INVALID_PAGINATION', 'page must be >= 0 and limit must be between 1 and 48', 400);
  }
  return {
    page,
    limit,
    category: String(query.category || '').trim() || undefined,
    search: String(query.search || '').trim() || undefined,
  };
}

router.get('/stores/:storefrontSlug', async (req, res, next) => {
  try {
    const data = await getPublicStorefront({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId, ...getMenuQuery(req.query) });
    res.set('Cache-Control', storefrontCacheControl);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/storefronts/:storefrontSlug/menu', async (req, res, next) => {
  try {
    const data = await getPublicStoreMenu({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId, ...getMenuQuery(req.query) });
    res.set('Cache-Control', storefrontCacheControl);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/storefronts/:storefrontSlug/bootstrap', async (req, res, next) => {
  try {
    const data = await getPublicStorefront({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId, page: 0, limit: 24, category: 'cat_minuman' });
    res.set('Cache-Control', storefrontCacheControl);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/storefronts/:storefrontSlug', async (req, res, next) => {
  try {
    const data = await getPublicStorefront({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId, ...getMenuQuery(req.query) });
    res.set('Cache-Control', storefrontCacheControl);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/storefronts/:storefrontSlug/recommendations', publicRecommendationRateLimit, async (req, res, next) => {
  try {
    const storefront = await getPublicStorefront({ storefrontSlug: req.params.storefrontSlug, outletId: req.query.outlet_id || req.query.outletId, includeMenu: false });
    const outletId = req.query.outlet_id || req.query.outletId;
    if (!outletId || !storefront.outlets.some((outlet) => String(outlet.id) === String(outletId))) {
      throw new AppError('OUTLET_UNAVAILABLE', 'Outlet is not available for ordering', 409);
    }
    const productIds = String(req.query.product_ids || '').split(',').map((id) => id.trim()).filter(Boolean);
    const data = await resolvePublicRecommendations({ workspaceId: storefront.internal.workspaceId, outletId, cartProductIds: productIds, placement: req.query.placement || 'cart' });
    res.set('Cache-Control', 'private, no-store');
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/recommendation-events', publicRecommendationEventRateLimit, async (req, res, next) => {
  try {
    const storefront = await getPublicStorefront({ storefrontSlug: req.body?.storefront_slug || req.body?.storefrontSlug, outletId: req.body?.outlet_id || req.body?.outletId, includeMenu: false });
    const outletId = req.body?.outlet_id || req.body?.outletId;
    if (!outletId || !storefront.outlets.some((outlet) => String(outlet.id) === String(outletId))) throw new AppError('OUTLET_UNAVAILABLE', 'Outlet is not available for ordering', 409);
    const result = await ingestRecommendationEvent({ workspaceId: storefront.internal.workspaceId, outletId, event: {
      eventType: req.body?.event_type || req.body?.eventType,
      placement: req.body?.placement,
      targetProductId: req.body?.target_product_id || req.body?.targetProductId,
      sourceProductId: req.body?.source_product_id || req.body?.sourceProductId,
      recommendationId: req.body?.recommendation_id || req.body?.recommendationId,
      cartId: req.body?.cart_id || req.body?.cartId,
      sessionId: req.body?.session_id || req.body?.sessionId,
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotency_key || req.body?.idempotencyKey,
      metadata: req.body?.metadata,
    } });
    res.status(202).json(result);
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

router.post('/customer/register', async (req, res, next) => {
  try {
    const store = await getPublicStorefront({ storefrontSlug: req.body?.storefrontSlug || req.body?.storefront_slug });
    const data = await registerPublicCustomer({ workspaceId: store.internal.workspaceId, storefrontSlug: req.body?.storefrontSlug || req.body?.storefront_slug, ...req.body });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.post('/customer/login', async (req, res, next) => {
  try {
    const store = await getPublicStorefront({ storefrontSlug: req.body?.storefrontSlug || req.body?.storefront_slug });
    res.json(await loginPublicCustomer({ workspaceId: store.internal.workspaceId, email: req.body?.email, password: req.body?.password }));
  } catch (err) { next(err); }
});

router.get('/customer/session', requirePublicCustomer, async (req, res, next) => {
  try { res.json(await getPublicCustomerSession({ workspaceId: req.publicCustomer.workspaceId, contactId: req.publicCustomer.contactId })); } catch (err) { next(err); }
});

router.get('/customer/orders', requirePublicCustomer, async (req, res, next) => {
  try { res.json({ orders: await listPublicCustomerOrders({ contactId: req.publicCustomer.contactId }) }); } catch (err) { next(err); }
});

router.get('/payments/:paymentId/status', publicPaymentStatusRateLimit, async (req, res, next) => {
  try {
      const data = await getPublicPaymentStatus({ paymentId: req.params.paymentId, publicOrderToken: req.query.public_order_token || req.query.publicOrderToken });
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/orders/:publicOrderToken', publicOrderRateLimit, async (req, res, next) => {
  try {
    const data = await getPublicOrderByToken(req.params.publicOrderToken);
    res.json(isV1(req) ? { order: data } : { data });
  } catch (err) { next(err); }
});

export const publicStoreRouteInternals = { getMenuQuery };

export default router;
