import { resolveWorkspaceContext, getAllowedOutletIds } from '../services/access-control.service.js';
import { getPermissionMatrixForUser } from '../services/access-control.service.js';

function getSelectedWorkspaceId(req) {
  return req.get('x-workspace-id')
    || req.query?.workspaceId
    || req.query?.workspace_id
    || req.body?.workspaceId
    || req.body?.workspace_id
    || null;
}

export async function attachWorkspaceContext(req, res, next) {
  try {
    if (!req.me) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const ctx = await resolveWorkspaceContext(req.me, getSelectedWorkspaceId(req));
    if (!ctx) return res.status(403).json({ error: { code: 'MEMBERSHIP_REQUIRED', message: 'Active workspace membership required' } });

    req.me.workspaceId = ctx.workspaceId;
    req.me.workspaceRole = ctx.role;
    req.me.accessPolicy = ctx.accessPolicy || {};
    req.workspace = { id: ctx.workspaceId, role: ctx.role, permissions: getPermissionMatrixForUser(req.me) };
    req.allowedOutletIds = await getAllowedOutletIds(req.me);
    next();
  } catch (err) {
    next(err);
  }
}
