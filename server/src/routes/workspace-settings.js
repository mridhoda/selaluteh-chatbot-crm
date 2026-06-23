import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { listSchemas, getEffectiveSettings, updateCategorySettings } from '../services/settings.service.js';

const router = express.Router();
router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/schemas', authorizePermission('settings', 'read'), (req, res) => {
  res.json({ data: listSchemas() });
});

router.get('/settings/:category', authorizePermission('settings', 'read'), async (req, res, next) => {
  try {
    const result = await getEffectiveSettings({ workspaceId: req.me.workspaceId, category: req.params.category });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.put('/settings/:category', authorizePermission('settings', 'write'), async (req, res, next) => {
  try {
    const result = await updateCategorySettings({ workspaceId: req.me.workspaceId, category: req.params.category, updates: req.body });
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
