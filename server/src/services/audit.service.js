import { auditLogsRepository } from '../db/repositories/audit-logs.supabase.repository.js';
import { AppError } from '../utils/errors.js';
import { REDACTED, redactSecrets } from '../utils/redaction.js';

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

const KNOWN_SENSITIVE_FIELDS = new Set([
  'token', 'app_secret', 'webhook_secret', 'password_hash', 'secret_key', 'api_key',
]);

export function redactSensitiveDetails(details) {
  if (!details || typeof details !== 'object') return redactSecrets(details);
  const redacted = { ...redactSecrets(details) };
  for (const [key, value] of Object.entries(redacted)) {
    if (KNOWN_SENSITIVE_FIELDS.has(key) || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') || key.toLowerCase().includes('password') || key.toLowerCase().includes('key')) {
      redacted[key] = value ? REDACTED : value;
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveDetails(value);
    }
  }
  return redacted;
}

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
