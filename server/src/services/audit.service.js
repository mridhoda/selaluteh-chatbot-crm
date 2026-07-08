import { auditLogsRepository } from '../db/repositories/audit-logs.supabase.repository.js';
import { AppError } from '../utils/errors.js';
import { redactSensitiveDetails } from '../utils/audit-redaction.js';

export const SENSITIVE_ACTIONS = [
  'auth.login', 'auth.logout', 'auth.password_reset',
  'membership.create', 'membership.update', 'membership.delete',
  'outlet_access.create', 'outlet_access.update', 'outlet_access.delete',
  'platform.credential_update', 'platform.connect', 'platform.disconnect',
  'product.price_change', 'product.status_change', 'product.delete',
  'stock.adjust', 'stock.transfer',
  'order.cancel', 'order.refund',
  'payment.reconcile', 'payment.sync_provider',
  'settings.update',
];

export { redactSensitiveDetails } from '../utils/audit-redaction.js';

export async function auditLog({ req, workspaceId, outletId, action, resourceType, resourceId, details }) {
  if (!action) throw new AppError('VALIDATION', 'action is required for audit', 400);
  return auditLogsRepository.log({
    workspaceId,
    outletId,
    actorId: req?.me?.id || req?.user?.id || null,
    action,
    resourceType,
    resourceId: resourceId || null,
    details: redactSensitiveDetails(details || {}),
    requestId: req?.requestId || null,
    ipAddress: req?.ip || null,
    userAgent: req?.get?.('user-agent') || null,
  });
}

export async function listAuditLogs({ workspaceId, action, resourceType, resourceId, outletId, actorId, page, limit }) {
  const data = await auditLogsRepository.list({ workspaceId, action, resourceType, resourceId, outletId, actorId, page, limit });
  const total = await auditLogsRepository.count({ workspaceId, action, resourceType, outletId });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 50 } };
}
