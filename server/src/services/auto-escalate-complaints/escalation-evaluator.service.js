/**
 * auto-escalate-complaints/escalation-evaluator.service.js
 * Spec: auto-escalate-complaints — Task Section 11
 *
 * Event-driven escalation evaluator.
 * Called when a complaint event occurs (created, priority changed, etc.).
 *
 * This is the primary entry point for AUTOMATIC escalation.
 * Manual escalation goes through escalation-creation.service.js directly.
 *
 * Evaluation results:
 *   MATCHED → escalation created (or returned if already active)
 *   NOT_MATCHED → no escalation needed
 *   DISABLED → auto-escalation off for this outlet
 *   OUTLET_UNRESOLVED → cannot route
 *   DUPLICATE_ACTIVE_ESCALATION → already escalated
 *   NO_ELIGIBLE_RECIPIENT → fallback/attention required
 *   STALE_EVENT → complaint version mismatch
 */

import { createOrFindEscalation } from './escalation-creation.service.js';
import { EVALUATION_RESULT } from './constants.js';
import { getSupabaseServiceClient } from '../../db/supabase.js';

/**
 * Evaluate a complaint for auto-escalation.
 * Called by event consumers and scheduler.
 *
 * @param {{
 *   workspaceId: string,
 *   complaintId: string,
 *   expectedVersion?: number,   — for stale-event detection
 *   triggerHint?: string,       — suggested trigger type (e.g. AUTO_PRIORITY)
 * }} param
 */
export async function evaluateComplaintForEscalation({ workspaceId, complaintId, expectedVersion, triggerHint }) {
  // Load complaint record
  const complaint = await loadComplaint({ workspaceId, complaintId });
  if (!complaint) {
    return { result: 'COMPLAINT_NOT_FOUND', escalation: null };
  }

  // Stale-event guard (AEC-R40)
  if (expectedVersion != null && complaint.version != null && complaint.version !== expectedVersion) {
    return { result: EVALUATION_RESULT.STALE_EVENT, escalation: null };
  }

  const { escalation, evaluationResult } = await createOrFindEscalation({
    workspaceId,
    complaint: {
      id: complaint.id,
      orderId: complaint.orderId ?? null,
      outletId: complaint.outletId ?? null,
      conversationOutletId: complaint.conversationOutletId ?? null,
      priority: complaint.priority,
      categoryId: complaint.categoryId ?? null,
      assignedToUserId: complaint.assignedToUserId ?? null,
      createdAt: complaint.createdAt,
      slaRemainingMinutes: complaint.slaRemainingMinutes ?? null,
      subject: complaint.subject ?? null,
      status: complaint.status ?? null,
      contactId: complaint.contactId ?? null,
    },
    triggerType: triggerHint ?? null,
  });

  return { result: evaluationResult, escalation };
}

// ─── Private ──────────────────────────────────────────────────────────────────

async function loadComplaint({ workspaceId, complaintId }) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from('complaints')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', complaintId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    orderId: data.order_id ?? null,
    outletId: data.outlet_id ?? null,
    conversationOutletId: null, // filled from chat context if needed
    priority: data.priority ?? 'medium',
    categoryId: data.category_id ?? null,
    assignedToUserId: data.assigned_to_user_id ?? null,
    createdAt: data.created_at,
    slaRemainingMinutes: null, // computed externally if needed
    subject: data.subject ?? null,
    status: data.status ?? null,
    contactId: data.contact_id ?? null,
    version: data.version ?? null,
  };
}
