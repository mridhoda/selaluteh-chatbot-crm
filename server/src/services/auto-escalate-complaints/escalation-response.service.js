/**
 * auto-escalate-complaints/escalation-response.service.js
 * Spec: auto-escalate-complaints — Task Section 18 + 19
 *
 * Supervisor internal response management.
 *
 * INVARIANT (AEC-R28):
 *   Supervisor responses are NOT sent to the customer automatically.
 *   Responses are visible only to authorized complaint collaborators.
 *   Response history is append-only (or correction-linked).
 */

import { escalationRepository, escalationResponseRepository } from './escalation.repository.js';
import { auditEscalationEvent } from './escalation-audit.service.js';
import {
  ESCALATION_STATUS,
  ESCALATION_EVENT,
  RESPONSE_TYPE,
  ESCALATION_ERROR,
} from './constants.js';
import { AppError } from '../../utils/errors.js';

/**
 * Add a supervisor internal response to an escalation.
 * Supervisor responses are NEVER auto-sent to the customer.
 *
 * @param {{
 *   workspaceId: string,
 *   escalationId: string,
 *   senderMembershipId: string,
 *   responseType: string,
 *   messageText?: string,
 *   structuredPayload?: object,
 * }} param
 */
export async function addSupervisorResponse({
  workspaceId,
  escalationId,
  senderMembershipId,
  responseType,
  messageText,
  structuredPayload,
}) {
  const validTypes = Object.values(RESPONSE_TYPE);
  if (!validTypes.includes(responseType)) {
    throw new AppError(
      ESCALATION_ERROR.POLICY_INVALID,
      `Invalid response type. Must be one of: ${validTypes.join(', ')}`,
      400
    );
  }

  const escalation = await escalationRepository.findById({ workspaceId, escalationId });
  if (!escalation) {
    throw new AppError(ESCALATION_ERROR.PERMISSION_DENIED, 'Escalation not found', 404);
  }

  // Cannot respond to terminal escalations
  const terminal = [
    ESCALATION_STATUS.COMPLETED,
    ESCALATION_STATUS.CANCELLED,
    ESCALATION_STATUS.FAILED_ROUTING,
    ESCALATION_STATUS.EXPIRED,
  ];
  if (terminal.includes(escalation.status)) {
    throw new AppError(
      ESCALATION_ERROR.INVALID_TRANSITION,
      `Cannot add response to escalation in status ${escalation.status}`,
      409
    );
  }

  // Create response (append-only)
  const response = await escalationResponseRepository.create({
    workspaceId,
    data: {
      outletId: escalation.outletId,
      complaintId: escalation.complaintId,
      escalationId,
      senderMembershipId,
      responseType,
      messageText: messageText ?? null,
      structuredPayload: structuredPayload ?? null,
    },
  });

  // Advance escalation status to RESPONDED if currently ACKNOWLEDGED
  if (escalation.status === ESCALATION_STATUS.ACKNOWLEDGED) {
    await escalationRepository.updateStatus({
      workspaceId,
      escalationId,
      expectedVersion: escalation.version,
      status: ESCALATION_STATUS.RESPONDED,
    }).catch(() => {
      // Best-effort: response is already recorded
    });
  }

  await auditEscalationEvent({
    event: ESCALATION_EVENT.RESPONDED,
    workspaceId,
    complaintId: escalation.complaintId,
    escalationId,
    actorMembershipId: senderMembershipId,
    details: { responseType },
  });

  return response;
}

/**
 * List internal responses for an escalation.
 * Only authorized collaborators may call this (enforced at route layer).
 *
 * Does NOT include responses visible to the customer.
 */
export async function listEscalationResponses({ workspaceId, escalationId }) {
  const escalation = await escalationRepository.findById({ workspaceId, escalationId });
  if (!escalation) {
    throw new AppError(ESCALATION_ERROR.PERMISSION_DENIED, 'Escalation not found', 404);
  }

  return escalationResponseRepository.listByEscalation({ workspaceId, escalationId });
}
