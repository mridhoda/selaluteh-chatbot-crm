import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission, requireOutletAccess } from '../middleware/authorization.js';
import { canManageWorkspace } from '../services/access-control.service.js';
import { createOutlet, listOutlets, getOutletDetail, updateOutlet, updateOutletStatus, setUserOutletAccess, getOutletSummary, getSetupChecklist, getOrderAcceptance, changeOutletOperationalStatus, upsertServiceSettings, replaceOperatingHours } from '../services/outlet.service.js';
import { outletsSupabaseRepository, outletManagementRepository } from '../db/repositories/index.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', authorizePermission('outlets', 'read'), async (req, res, next) => {
  try {
    const result = await listOutlets({
      user: req.me,
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

router.post('/', authorizePermission('outlets', 'write'), async (req, res, next) => {
  try {
    if (!req.body?.name) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Outlet name is required' } });
    const outlet = await createOutlet({ user: req.me, payload: req.body });
    res.status(201).json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.get('/me/access', authorizePermission('outlets', 'read'), async (req, res, next) => {
  try {
    const workspaceId = req.me.workspaceId;
    const userId = req.me.id;
    const access = await outletsSupabaseRepository.listUserAccess({ workspaceId, userId });
    res.json({ allOutlets: canManageWorkspace(req.me), outlets: access });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:userId/access', authorizePermission('outlets', 'manage_access'), async (req, res, next) => {
  try {
    if (!canManageWorkspace(req.me)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    const workspaceId = req.me.workspaceId;
    const userId = req.params.userId;
    const access = await outletsSupabaseRepository.listUserAccess({ workspaceId, userId });
    res.json({ data: access });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:userId/access', authorizePermission('outlets', 'manage_access'), async (req, res, next) => {
  try {
    const result = await setUserOutletAccess({
      user: req.me,
      targetUserId: req.params.userId,
      outlets: req.body.outlets,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:outletId', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const outlet = await getOutletDetail({ workspaceId: req.me.workspaceId, outletId: req.params.outletId });
    res.json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.put('/:outletId', authorizePermission('outlets', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const outlet = await updateOutlet({ user: req.me, outletId: req.params.outletId, updates: req.body });
    res.json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.patch('/:outletId/status', authorizePermission('outlets', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const outlet = await updateOutletStatus({ user: req.me, outletId: req.params.outletId, status: req.body.status });
    res.json({ data: outlet });
  } catch (err) {
    next(err);
  }
});

router.post('/:outletId/operational-status', authorizePermission('outlets', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const outlet = await changeOutletOperationalStatus({ user: req.me, outletId: req.params.outletId, status: req.body.status, version: req.body.version });
    res.json({ data: outlet });
  } catch (err) { next(err); }
});

router.get('/:outletId/summary', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const summary = await getOutletSummary({ workspaceId: req.me.workspaceId, outletId: req.params.outletId });
    res.json({ data: summary });
  } catch (err) { next(err); }
});

router.get('/:outletId/setup-checklist', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const checklist = await getSetupChecklist({ workspaceId: req.me.workspaceId, outletId: req.params.outletId });
    res.json({ data: checklist });
  } catch (err) { next(err); }
});

router.get('/:outletId/order-acceptance', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const acceptance = await getOrderAcceptance({ workspaceId: req.me.workspaceId, outletId: req.params.outletId });
    res.json({ data: acceptance });
  } catch (err) { next(err); }
});

router.get('/:outletId/service-settings', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const settings = await outletManagementRepository.getServiceSettings(req.me.workspaceId, req.params.outletId);
    res.json({ data: settings });
  } catch (err) { next(err); }
});

router.put('/:outletId/service-settings', authorizePermission('outlets', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const settings = await upsertServiceSettings({ user: req.me, outletId: req.params.outletId, data: req.body });
    res.json({ data: settings });
  } catch (err) { next(err); }
});

router.get('/:outletId/operating-hours', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const hours = await outletManagementRepository.getOperatingHours(req.me.workspaceId, req.params.outletId);
    res.json({ data: hours });
  } catch (err) { next(err); }
});

router.put('/:outletId/operating-hours', authorizePermission('outlets', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const hours = await replaceOperatingHours({ user: req.me, outletId: req.params.outletId, hours: req.body.hours || req.body });
    res.json({ data: hours });
  } catch (err) { next(err); }
});

router.get('/:outletId/channel-policies', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const policies = await outletManagementRepository.getChannelPolicies(req.me.workspaceId, req.params.outletId);
    res.json({ data: policies });
  } catch (err) { next(err); }
});

router.get('/:outletId/tags', authorizePermission('outlets', 'read'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const tags = await outletManagementRepository.getTags(req.me.workspaceId, req.params.outletId);
    res.json({ data: tags });
  } catch (err) { next(err); }
});

router.put('/:outletId/tags', authorizePermission('outlets', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    await outletManagementRepository.setTags(req.me.workspaceId, req.params.outletId, req.body.tags || [], req.me.id);
    const tags = await outletManagementRepository.getTags(req.me.workspaceId, req.params.outletId);
    res.json({ data: tags });
  } catch (err) { next(err); }
});

export default router;
