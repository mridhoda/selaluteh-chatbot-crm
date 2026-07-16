import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import {
  getDashboardSummary, getOutletPerformance, getProductPerformance,
  getChannelPerformance, getPaymentMetrics, getCSVReport,
  getDimensionPerformance,
} from '../services/analytics.service.js';

const router = express.Router();
router.use(authRequired, attachUser, attachWorkspaceContext);
router.use(authorizePermission('dashboard', 'read'));

router.get('/summary', async (req, res, next) => {
  try {
    const result = await getDashboardSummary({
      workspaceId: req.me.workspaceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      outletIds: req.allowedOutletIds,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/outlets', async (req, res, next) => {
  try {
    const result = await getOutletPerformance({
      workspaceId: req.me.workspaceId,
      outletId: req.query.outletId,
      outletIds: req.allowedOutletIds,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const result = await getProductPerformance({
      workspaceId: req.me.workspaceId,
      outletId: req.query.outletId,
      outletIds: req.allowedOutletIds,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      outletIds: req.allowedOutletIds,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/channels', async (req, res, next) => {
  try {
    const result = await getChannelPerformance({
      workspaceId: req.me.workspaceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/dimension', async (req, res, next) => {
  try {
    const dimensions = String(req.query.dimensions || req.query.dimension || '').split(',').filter(Boolean);
    const result = await getDimensionPerformance({ workspaceId: req.me.workspaceId, dimensions, outletId: req.query.outletId, outletIds: req.allowedOutletIds, startDate: req.query.startDate, endDate: req.query.endDate });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/payments', async (req, res, next) => {
  try {
    const result = await getPaymentMetrics({
      workspaceId: req.me.workspaceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const { csv, filename } = await getCSVReport({
      workspaceId: req.me.workspaceId,
      type: req.query.type || 'orders',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
});

export default router;
