import express from 'express';
import multer from 'multer';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { uploadRateLimit } from '../middleware/rate-limit.js';
import { validateBody } from '../middleware/validate.js';
import { validateProductCreate, validateProductUpdate, validateProductAvailability } from '../validators/products.schema.js';
import {
  listProducts, getProductDetail, getProductWithAvailability,
  createProduct, updateProduct, archiveProduct, updateOutletAvailability, listModifierGroups, replaceModifierProductLinks,
} from '../services/product.service.js';
import { productsRepository } from '../db/repositories/index.js';
import { productsToCsv, validateProductImportRows } from '../services/product-import-export.service.js';
import { uploadFile } from '../services/file.service.js';
import {
  archiveRecommendationRule,
  createRecommendationRule,
  getRecommendationReport,
  listRecommendationRules,
  updateRecommendationRule,
} from '../services/product-recommendation.service.js';

const router = express.Router();
const upload = multer({
  dest: 'uploads/tmp/',
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, /^image\/(avif|gif|jpeg|png|webp)$/.test(file.mimetype)),
});

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', authorizePermission('products', 'read'), async (req, res, next) => {
  try {
    const result = await listProducts({
      user: req.me,
      outletId: req.query.outlet_id || req.query.outletId,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/export.csv', authorizePermission('products', 'export'), async (req, res, next) => {
  try {
    const products = await productsRepository.findProducts({ workspaceId: req.me.workspaceId });
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="products.csv"');
    res.send(productsToCsv(products));
  } catch (err) {
    next(err);
  }
});

router.get('/modifiers', authorizePermission('products', 'read'), async (req, res, next) => {
  try {
    const result = await listModifierGroups({ user: req.me });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/recommendations/report', authorizePermission('products', 'read'), async (req, res, next) => {
  try {
    res.json(await getRecommendationReport({ user: req.me, filters: {
      from: req.query.from, to: req.query.to, outletId: req.query.outlet_id || req.query.outletId,
      recommendationType: req.query.type, status: req.query.status,
    } }));
  } catch (err) { next(err); }
});

router.get('/recommendations', authorizePermission('products', 'read'), async (req, res, next) => {
  try {
    res.json(await listRecommendationRules({ user: req.me, filters: {
      page: req.query.page, limit: req.query.limit, sourceProductId: req.query.source_product_id,
      targetProductId: req.query.target_product_id, outletId: req.query.outlet_id || req.query.outletId,
      recommendationType: req.query.type, placement: req.query.placement, status: req.query.status,
    } }));
  } catch (err) { next(err); }
});

router.post('/recommendations', authorizePermission('products', 'write'), async (req, res, next) => {
  try { res.status(201).json({ data: await createRecommendationRule({ user: req.me, data: req.body }) }); } catch (err) { next(err); }
});

router.put('/recommendations/:recommendationId', authorizePermission('products', 'write'), async (req, res, next) => {
  try { res.json({ data: await updateRecommendationRule({ user: req.me, recommendationId: req.params.recommendationId, data: req.body }) }); } catch (err) { next(err); }
});

router.delete('/recommendations/:recommendationId', authorizePermission('products', 'write'), async (req, res, next) => {
  try { res.json({ data: await archiveRecommendationRule({ user: req.me, recommendationId: req.params.recommendationId }) }); } catch (err) { next(err); }
});

router.post('/images/upload', authorizePermission('products', 'write'), uploadRateLimit, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    const file = await uploadFile({
      workspaceId: req.me.workspaceId,
      file: req.file,
      userId: req.me.id,
      source: 'product_image',
      metadata: { public: true, purpose: 'product_image' },
    });
    res.status(201).json({
      data: {
        id: file.id,
        stored_name: file.stored_name,
        original_name: file.original_name,
        url: `/public-files/${file.stored_name}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/modifiers/:modifierGroupId/links', authorizePermission('products', 'write'), async (req, res, next) => {
  try {
    const productIds = Array.isArray(req.body?.productIds) ? req.body.productIds : [];
    const result = await replaceModifierProductLinks({ user: req.me, modifierGroupId: req.params.modifierGroupId, productIds });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/import/validate', authorizePermission('products', 'write'), async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    res.json({ data: validateProductImportRows(rows) });
  } catch (err) {
    next(err);
  }
});

router.get('/:productId', authorizePermission('products', 'read'), async (req, res, next) => {
  try {
    const outletId = req.query.outlet_id || req.query.outletId;
    const product = outletId
      ? await getProductWithAvailability({ user: req.me, productId: req.params.productId, outletId })
      : await getProductDetail({ user: req.me, productId: req.params.productId });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorizePermission('products', 'write'), validateBody(validateProductCreate), async (req, res, next) => {
  try {
    const product = await createProduct({ user: req.me, data: req.body });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

router.put('/:productId', authorizePermission('products', 'write'), validateBody(validateProductUpdate), async (req, res, next) => {
  try {
    const product = await updateProduct({ user: req.me, productId: req.params.productId, data: req.body });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

router.delete('/:productId', authorizePermission('products', 'write'), async (req, res, next) => {
  try {
    await archiveProduct({ user: req.me, productId: req.params.productId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put('/:productId/outlet-availability', authorizePermission('products', 'write'), validateBody(validateProductAvailability), async (req, res, next) => {
  try {
    const rows = await updateOutletAvailability({
      user: req.me,
      productId: req.params.productId,
      outlets: req.body.outlets,
    });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:productId/outlet-availability', authorizePermission('products', 'read'), async (req, res, next) => {
  try {
    const availability = await productsRepository.findAvailabilityByProduct({
      workspaceId: req.me.workspaceId,
      productId: req.params.productId,
    });
    res.json({ data: availability });
  } catch (err) {
    next(err);
  }
});

export default router;
