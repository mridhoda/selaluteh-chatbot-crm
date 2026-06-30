/**
 * auto-escalate-complaints/escalation-audit.service.js
 * Spec: auto-escalate-complaints — Task Section 28
 *
 * Lightweight audit wrapper for escalation domain events.
 * Delegates to the existing audit.service.js if available,
 * otherwise silently writes to console in test/dev.
 *
 * Audit records are append-only (AEC-R54).
 * Sensitive data must never appear in audit records.
 */

let auditService;

async function getAuditService() {
  if (!auditService) {
    try {
      const mod = await import('../audit.service.js');
      auditService = mod;
    } catch {
      auditService = null;
    }
  }
  return auditService;
}

/**
 * Record an escalation domain event in the audit log.
 *
 * @param {{
 *   event: string,
 *   workspaceId: string,
 *   complaintId?: string,
 *   escalationId?: string,
 *   actorMembershipId?: string,
 *   details?: object,
 * }} param
 */
export async function auditEscalationEvent({ event, workspaceId, complaintId, escalationId, actorMembershipId, details }) {
  try {
    const svc = await getAuditService();
    if (svc?.auditLog) {
      await svc.auditLog({
        workspaceId,
        action: event,
        resourceType: 'complaint_escalation',
        resourceId: escalationId ?? complaintId ?? null,
        actorId: actorMembershipId ?? null,
        details: sanitizeDetails(details),
      });
    }
  } catch (err) {
    // Audit failure must not break escalation flow (AEC-R55: observability)
    console.error('[escalation-audit] Failed to record audit event:', event, err?.message);
  }
}

/**
 * Remove any potentially sensitive fields from audit details.
 * Internal notes, full phone, payment data → excluded.
 */
function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') return details;
  const safe = { ...details };
  delete safe.internalNotes;
  delete safe.fullPhone;
  delete safe.rawPaymentPayload;
  delete safe.password;
  delete safe.token;
  return safe;
}
