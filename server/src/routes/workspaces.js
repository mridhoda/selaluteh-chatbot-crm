import { Router } from 'express';
import { getCurrentWorkspace, listUserWorkspaces, getWorkspaceDetail, updateWorkspace } from '../services/workspace.service.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';

const router = Router();

router.get('/current', attachWorkspaceContext, async (req, res, next) => {
  try {
    const workspace = await getCurrentWorkspace({ workspaceId: req.workspace.id });
    res.json({ data: workspace });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const workspaces = await listUserWorkspaces({ userId: req.me._id });
    res.json({ data: workspaces });
  } catch (err) { next(err); }
});

router.get('/:workspaceId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const workspace = await getWorkspaceDetail({ workspaceId: req.params.workspaceId, userId: req.me._id });
    res.json({ data: workspace });
  } catch (err) { next(err); }
});

router.patch('/:workspaceId', async (req, res, next) => {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const workspace = await updateWorkspace({ workspaceId: req.params.workspaceId, userId: req.me._id, updates: req.body });
    res.json({ data: workspace });
  } catch (err) { next(err); }
});

export default router;
