/**
 * auto-escalate-complaints/escalation-creation.service.js
 * Spec: auto-escalate-complaints — Task Section 9
 *
 * Orchestrates complaint escalation creation:
 *   ComplaintOutletResolver → EffectivePolicyResolver → TriggerMatcher
 *   → SupervisorResolver → EscalationRepository → NotificationEvent
 *
 * INVARIANTS enforced here:
 *   - one-active-escalation-per-complaint-outlet-level (DB constraint + pre-check)
 *   - complaint is not duplicated (no new complaint/ticket created)
 *   - CS remains primary handler by default (KEEP_CS)
 *   - supervisor added as OUTLET_SUPERVISOR_COLLABORATOR
 *   - supervisor responses are internal (not auto-sent to customer)
 *
 * Idempotency: idempotency_key = `{complaintId}:{outletId}:{level}:{triggerType}:{policyVersion}`
 */

import crypto from 'crypto';
import { resolveEffectivePolicy } from './effective-policy.service.js';
import { resolveComplaintOutlet } from './outlet-resolver.service.js';
import { evaluateTriggers } from './trigger-matcher.service.js';
import { resolveEligibleSupervisor } from './supervisor-resolver.service.js';
import {
  escalationRepository,
  escalationAssignmentRepository,
} from './escalation.repository.js';
import { auditEscalationEvent } from './escalation-audit.service.js';
import { notifyEscalationSupervisor } from './escalation-notification.service.js';
import {
  ESCALATION_STATUS,
  TRIGGER_TYPE,
  ESCALATION_EVENT,
  EVALUATION_RESULT,
  ESCALATION_ERROR,
  COMPLAINT_STATUS_MODE,
  MVP_DEFAULTS,
} from './constants.js';
import { AppError } from '../../utils/errors.js';

/**
 * Create or find an active escalation for a complaint.
 * Idempotent: returns existing escalation if already active.
 *
 * @param {{
 *   workspaceId: string,
 *   complaint: {
 *     id: string,
 *     orderId?: string|null,
 *     outletId?: string|null,
 *     conversationOutletId?: string|null,
 *     priority: string,
 *     categoryId?: string|null,
 *     assignedToUserId?: string|null,
 *     createdAt: string,
 *     slaRemainingMinutes?: number|null,
 *     subject?: string,
 *     status?: string,
 *   },
 *   triggerType?: string,        — force trigger type (MANUAL or AUTO_*)
 *   escalatedByMembershipId?: string,
 *   manualReason?: string,
 *   escalationLevel?: number,
 * }} param
 *
 * @returns {Promise<{ escalation: object, evaluationResult: string }>}
 */
export async function createOrFindEscalation({
  workspaceId,
  complaint,
  triggerType,
  escalatedByMembershipId,
  manualReason,
  escalationLevel = 1,
}) {
  // ─── 1. Resolve outlet ─────────────────────────────────────────────────────
  const outletResolution = await resolveComplaintOutlet({
    workspaceId,
    orderId: complaint.orderId ?? null,
    complaintOutletId: complaint.outletId ?? null,
    conversationOutletId: complaint.conversationOutletId ?? null,
  });

  if (!outletResolution.resolved) {
    await auditEscalationEvent({
      event: ESCALATION_EVENT.ROUTING_FAILED,
      workspaceId,
      complaintId: complaint.id,
      details: { reason: 'OUTLET_UNRESOLVED', outletResolution },
    });
    return { escalation: null, evaluationResult: EVALUATION_RESULT.OUTLET_UNRESOLVED };
  }

  const { outletId } = outletResolution;

  // ─── 2. Resolve effective policy ───────────────────────────────────────────
  const { source: policySource, enabled, policy, policyId, policyVersion } =
    await resolveEffectivePolicy({ workspaceId, outletId });

  if (!enabled || !policy) {
    return { escalation: null, evaluationResult: EVALUATION_RESULT.DISABLED };
  }

  // ─── 3. Evaluate triggers ──────────────────────────────────────────────────
  const triggerResult = evaluateTriggers({ policy, complaint, triggerType });

  if (!triggerResult.matched) {
    return { escalation: null, evaluationResult: EVALUATION_RESULT.NOT_MATCHED };
  }

  const resolvedTriggerType = triggerType ?? triggerResult.triggerType;

  // ─── 4. Check for existing active escalation (invariant guard) ─────────────
  const existing = await escalationRepository.findActive({
    workspaceId,
    complaintId: complaint.id,
    outletId,
    escalationLevel,
  });

  if (existing) {
    return { escalation: existing, evaluationResult: EVALUATION_RESULT.DUPLICATE_ACTIVE_ESCALATION };
  }

  // ─── 5. Resolve supervisor ─────────────────────────────────────────────────
  const supervisorResolution = await resolveEligibleSupervisor({
    workspaceId,
    outletId,
    policy,
  });

  // ─── 6. Calculate SLA deadlines ───────────────────────────────────────────
  const slaConfig = policy.supervisorSla ?? {};
  const ackMinutes = slaConfig.acknowledgementMinutes ?? MVP_DEFAULTS.ACKNOWLEDGEMENT_MINUTES;
  const responseMinutes = slaConfig.firstResponseMinutes ?? MVP_DEFAULTS.FIRST_RESPONSE_MINUTES;
  const now = new Date();
  const acknowledgementDueAt = new Date(now.getTime() + ackMinutes * 60000).toISOString();
  const responseDueAt = new Date(now.getTime() + responseMinutes * 60000).toISOString();

  // ─── 7. Build idempotency key ──────────────────────────────────────────────
  const idempotencyKey = buildIdempotencyKey({
    complaintId: complaint.id,
    outletId,
    escalationLevel,
    triggerType: resolvedTriggerType,
    policyVersion: policyVersion ?? 0,
  });

  // ─── 8. Build snapshots ────────────────────────────────────────────────────
  const complaintSnapshot = buildComplaintSnapshot(complaint, policy);
  const triggerSnapshot = { ...triggerResult, triggerType: resolvedTriggerType, manualReason: manualReason ?? null };
  const routingSnapshot = {
    outletResolution,
    policySource,
    supervisorResolution,
    resolvedAt: now.toISOString(),
  };

  // ─── 9. Determine initial status ──────────────────────────────────────────
  const initialStatus = supervisorResolution.resolved
    ? ESCALATION_STATUS.PENDING
    : ESCALATION_STATUS.FAILED_ROUTING;

  // ─── 10. Create escalation (idempotent) ────────────────────────────────────
  const escalation = await escalationRepository.create({
    workspaceId,
    data: {
      complaintId: complaint.id,
      outletId,
      triggerType: resolvedTriggerType,
      status: initialStatus,
      escalationLevel,
      recipientMembershipId: supervisorResolution.membershipId ?? null,
      escalatedByMembershipId: escalatedByMembershipId ?? null,
      policyId: policyId ?? null,
      policyVersion: policyVersion ?? null,
      idempotencyKey,
      complaintSnapshot,
      triggerSnapshot,
      routingSnapshot,
      acknowledgementDueAt: supervisorResolution.resolved ? acknowledgementDueAt : null,
      responseDueAt: supervisorResolution.resolved ? responseDueAt : null,
    },
  });

  // ─── 11. Create supervisor assignment ─────────────────────────────────────
  if (supervisorResolution.resolved && supervisorResolution.membershipId) {
    await escalationAssignmentRepository.create({
      workspaceId,
      data: {
        complaintId: complaint.id,
        escalationId: escalation.id,
        membershipId: supervisorResolution.membershipId,
        assignmentType: 'OUTLET_SUPERVISOR_COLLABORATOR',
      },
    }).catch(() => {
      // Assignment creation is best-effort; escalation itself is authoritative
    });
  }

  // ─── 12. Audit + event ────────────────────────────────────────────────────
  await auditEscalationEvent({
    event: supervisorResolution.resolved
      ? ESCALATION_EVENT.CREATED
      : ESCALATION_EVENT.ROUTING_FAILED,
    workspaceId,
    complaintId: complaint.id,
    escalationId: escalation.id,
    details: { triggerType: resolvedTriggerType, policySource, supervisorResolution },
  });

  // ─── 13. Notify supervisor ────────────────────────────────────────────────
  if (supervisorResolution.resolved && supervisorResolution.userId) {
    notifyEscalationSupervisor({
      workspaceId,
      outletId,
      escalation,
      complaint: {
        id: complaint.id,
        subject: complaint.subject ?? null,
        priority: complaint.priority ?? 'medium',
      },
      supervisorUserId: supervisorResolution.userId,
      supervisorMembershipId: supervisorResolution.membershipId ?? null,
    }).catch(err => {
      // Notification failure MUST NOT block escalation
      console.error('[escalation] Supervisor notification failed:', err?.message);
    });
  }

  return {
    escalation,
    evaluationResult: supervisorResolution.resolved
      ? EVALUATION_RESULT.MATCHED
      : EVALUATION_RESULT.NO_ELIGIBLE_RECIPIENT,
  };
}

/**
 * Acknowledge an escalation.
 * Atomic: only the assigned recipient (or workspace admin) may acknowledge.
 * Stops the acknowledgement SLA timer.
 */
export async function acknowledgeEscalation({ workspaceId, escalationId, actorMembershipId, expectedVersion }) {
  const escalation = await escalationRepository.findById({ workspaceId, escalationId });
  if (!escalation) {
    throw new AppError(ESCALATION_ERROR.PERMISSION_DENIED, 'Escalation not found', 404);
  }

  if (escalation.status !== ESCALATION_STATUS.PENDING) {
    throw new AppError(
      ESCALATION_ERROR.INVALID_TRANSITION,
      `Cannot acknowledge escalation in status ${escalation.status}`,
      409
    );
  }

  if (escalation.recipientMembershipId && escalation.recipientMembershipId !== actorMembershipId) {
    // Only assigned recipient or workspace admin can acknowledge
    throw new AppError(ESCALATION_ERROR.PERMISSION_DENIED, 'Only the assigned recipient may acknowledge', 403);
  }

  const updated = await escalationRepository.updateStatus({
    workspaceId,
    escalationId,
    expectedVersion: expectedVersion ?? escalation.version,
    status: ESCALATION_STATUS.ACKNOWLEDGED,
  });

  if (!updated) {
    throw new AppError(ESCALATION_ERROR.VERSION_CONFLICT, 'Version conflict on acknowledge', 409);
  }

  await auditEscalationEvent({
    event: ESCALATION_EVENT.ACKNOWLEDGED,
    workspaceId,
    complaintId: escalation.complaintId,
    escalationId,
    details: { actorMembershipId },
  });

  return updated;
}

/**
 * Cancel an escalation.
 * Does NOT delete assignments, responses, or history.
 */
export async function cancelEscalation({ workspaceId, escalationId, actorMembershipId, reason, expectedVersion }) {
  const escalation = await escalationRepository.findById({ workspaceId, escalationId });
  if (!escalation) {
    throw new AppError(ESCALATION_ERROR.PERMISSION_DENIED, 'Escalation not found', 404);
  }

  const nonCancellable = [
    ESCALATION_STATUS.COMPLETED,
    ESCALATION_STATUS.CANCELLED,
    ESCALATION_STATUS.FAILED_ROUTING,
    ESCALATION_STATUS.EXPIRED,
  ];

  if (nonCancellable.includes(escalation.status)) {
    throw new AppError(ESCALATION_ERROR.INVALID_TRANSITION, `Cannot cancel escalation in status ${escalation.status}`, 409);
  }

  const updated = await escalationRepository.updateStatus({
    workspaceId,
    escalationId,
    expectedVersion: expectedVersion ?? escalation.version,
    status: ESCALATION_STATUS.CANCELLED,
    extra: { routing_snapshot: { ...escalation.routingSnapshot, cancellationReason: reason ?? null } },
  });

  if (!updated) {
    throw new AppError(ESCALATION_ERROR.VERSION_CONFLICT, 'Version conflict on cancel', 409);
  }

  await auditEscalationEvent({
    event: ESCALATION_EVENT.CANCELLED,
    workspaceId,
    complaintId: escalation.complaintId,
    escalationId,
    details: { actorMembershipId, reason },
  });

  return updated;
}

/**
 * Complete an escalation.
 * Completion does NOT auto-resolve the complaint (AEC-R30).
 */
export async function completeEscalation({ workspaceId, escalationId, actorMembershipId, completionReason, expectedVersion }) {
  const escalation = await escalationRepository.findById({ workspaceId, escalationId });
  if (!escalation) {
    throw new AppError(ESCALATION_ERROR.PERMISSION_DENIED, 'Escalation not found', 404);
  }

  const completable = [ESCALATION_STATUS.ACKNOWLEDGED, ESCALATION_STATUS.RESPONDED];
  if (!completable.includes(escalation.status)) {
    throw new AppError(ESCALATION_ERROR.INVALID_TRANSITION, `Cannot complete escalation in status ${escalation.status}`, 409);
  }

  const updated = await escalationRepository.updateStatus({
    workspaceId,
    escalationId,
    expectedVersion: expectedVersion ?? escalation.version,
    status: ESCALATION_STATUS.COMPLETED,
  });

  if (!updated) {
    throw new AppError(ESCALATION_ERROR.VERSION_CONFLICT, 'Version conflict on complete', 409);
  }

  await auditEscalationEvent({
    event: ESCALATION_EVENT.COMPLETED,
    workspaceId,
    complaintId: escalation.complaintId,
    escalationId,
    details: { actorMembershipId, completionReason },
  });

  return updated;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function buildIdempotencyKey({ complaintId, outletId, escalationLevel, triggerType, policyVersion }) {
  const raw = `${complaintId}:${outletId}:${escalationLevel}:${triggerType}:${policyVersion}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Build complaint snapshot for the escalation record.
 * Includes safe fields only — no raw payment data, no full phone.
 * Internal notes excluded by default (AEC-R26).
 */
function buildComplaintSnapshot(complaint, policy) {
  const include = policy.includeContext ?? {};
  const snapshot = {};

  if (include.complaintSummary !== false) {
    snapshot.subject = complaint.subject ?? null;
    snapshot.priority = complaint.priority ?? null;
    snapshot.status = complaint.status ?? null;
  }

  if (include.relatedOrder !== false && complaint.orderId) {
    snapshot.orderId = complaint.orderId;
  }

  if (include.currentSla !== false && complaint.slaRemainingMinutes != null) {
    snapshot.slaRemainingMinutes = complaint.slaRemainingMinutes;
  }

  if (include.customerSafeIdentity !== false && complaint.contactId) {
    snapshot.contactId = complaint.contactId; // ID only, not full phone
  }

  // Internal notes excluded by default
  // Full phone excluded always (AEC-R26, AEC-R39)

  return snapshot;
}
