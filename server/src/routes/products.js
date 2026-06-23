import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { validateBody } from '../middleware/validate.js';
import { validateProductCreate, validateProductUpdate, validateProductAvailability } from '../validators/products.schema.js';
import {
  listProducts, getProductDetail, getProductWithAvailability,
  createProduct, updateProduct, archiveProduct, updateOutletAvailability,
} from '../services/product.service.js';
import { productsRepository } from '../db/repositories/index.js';
import { productsToCsv, validateProductImportRows } from '../services/product-import-export.service.js';

const router = express.Router();

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
