import { resolveWorkspaceContext, getAllowedOutletIds } from '../services/access-control.service.js';
import { getPermissionMatrixForUser } from '../services/access-control.service.js';

export async function attachWorkspaceContext(req, res, next) {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const ctx = await resolveWorkspaceContext(req.me);
    if (!ctx) return res.status(403).json({ error: { code: 'MEMBERSHIP_REQUIRED', message: 'Active workspace membership required' } });

    req.me.workspaceRole = ctx.role;
    req.workspace = { id: ctx.workspaceId, role: ctx.role, permissions: getPermissionMatrixForUser(req.me) };
    req.allowedOutletIds = await getAllowedOutletIds(req.me);
    next();
  } catch (err) {
    next(err);
  }
}
