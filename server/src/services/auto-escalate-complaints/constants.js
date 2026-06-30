/**
 * auto-escalate-complaints/constants.js
 * Spec: auto-escalate-complaints — Task Section 1: Shared Types and Permissions
 *
 * All shared enums and permission identifiers for the complaint escalation system.
 * These values MUST match the database CHECK constraints in migration 026.
 */

// ─── Policy ───────────────────────────────────────────────────────────────────

export const MATCH_MODE = Object.freeze({
  ANY: 'ANY',
  ALL: 'ALL',
});

export const OUTLET_OVERRIDE_MODE = Object.freeze({
  USE_WORKSPACE_DEFAULT: 'USE_WORKSPACE_DEFAULT',
  CUSTOM: 'CUSTOM',
  DISABLED: 'DISABLED',
});

// ─── Triggers ─────────────────────────────────────────────────────────────────

export const TRIGGER_TYPE = Object.freeze({
  AUTO_PRIORITY: 'AUTO_PRIORITY',
  AUTO_CATEGORY: 'AUTO_CATEGORY',
  AUTO_UNASSIGNED: 'AUTO_UNASSIGNED',
  AUTO_SLA: 'AUTO_SLA',
  AUTO_REPEATED_MESSAGE: 'AUTO_REPEATED_MESSAGE',
  MANUAL: 'MANUAL',
  RE_ESCALATION: 'RE_ESCALATION',
});

// ─── Recipient Strategy ───────────────────────────────────────────────────────

export const RECIPIENT_STRATEGY = Object.freeze({
  PRIMARY_ONLY: 'PRIMARY_ONLY',
  FIRST_AVAILABLE: 'FIRST_AVAILABLE',
  ROUND_ROBIN: 'ROUND_ROBIN',
  SUPERVISOR_QUEUE: 'SUPERVISOR_QUEUE',
  ALL_SUPERVISORS: 'ALL_SUPERVISORS',
});

// ─── Fallback Steps ───────────────────────────────────────────────────────────

export const FALLBACK_STEP = Object.freeze({
  OTHER_OUTLET_SUPERVISOR: 'OTHER_OUTLET_SUPERVISOR',
  OUTLET_MANAGER: 'OUTLET_MANAGER',
  WORKSPACE_SUPPORT_MANAGER: 'WORKSPACE_SUPPORT_MANAGER',
  ATTENTION_ALERT: 'ATTENTION_ALERT',
});

// ─── Escalation Statuses ──────────────────────────────────────────────────────

export const ESCALATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESPONDED: 'RESPONDED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED_ROUTING: 'FAILED_ROUTING',
  EXPIRED: 'EXPIRED',
});

/** Statuses that mean the escalation is no longer active (allows re-escalation) */
export const ESCALATION_TERMINAL_STATUSES = Object.freeze([
  ESCALATION_STATUS.COMPLETED,
  ESCALATION_STATUS.CANCELLED,
  ESCALATION_STATUS.FAILED_ROUTING,
  ESCALATION_STATUS.EXPIRED,
]);

// ─── Response Types ───────────────────────────────────────────────────────────

export const RESPONSE_TYPE = Object.freeze({
  MESSAGE: 'MESSAGE',
  REQUEST_INFORMATION: 'REQUEST_INFORMATION',
  PROPOSED_RESOLUTION: 'PROPOSED_RESOLUTION',
  APPROVAL: 'APPROVAL',
  REJECTION: 'REJECTION',
  SYSTEM_EVENT: 'SYSTEM_EVENT',
});

// ─── SLA States ───────────────────────────────────────────────────────────────

export const SLA_STATE = Object.freeze({
  ON_TRACK: 'ON_TRACK',
  WARNING: 'WARNING',
  BREACHED: 'BREACHED',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
});

// ─── Schedule Policy ──────────────────────────────────────────────────────────

export const SCHEDULE_MODE = Object.freeze({
  ANY_TIME: 'ANY_TIME',
  OUTLET_HOURS: 'OUTLET_HOURS',
  SUPERVISOR_SCHEDULE: 'SUPERVISOR_SCHEDULE',
});

export const OUTSIDE_HOURS_POLICY = Object.freeze({
  ESCALATE_IMMEDIATELY: 'ESCALATE_IMMEDIATELY',
  QUEUE_UNTIL_OPEN: 'QUEUE_UNTIL_OPEN',
  ESCALATE_TO_WORKSPACE_SUPPORT: 'ESCALATE_TO_WORKSPACE_SUPPORT',
  CREATE_ATTENTION_ALERT: 'CREATE_ATTENTION_ALERT',
});

// ─── Complaint Status Mode (post-escalation behavior) ─────────────────────────

export const COMPLAINT_STATUS_MODE = Object.freeze({
  KEEP: 'KEEP',
  SET_IN_PROGRESS: 'SET_IN_PROGRESS',
});

export const PRIMARY_HANDLER_MODE = Object.freeze({
  KEEP_CS: 'KEEP_CS',
  SUPERVISOR_PRIMARY: 'SUPERVISOR_PRIMARY',
});

export const CUSTOMER_NOTIFICATION_MODE = Object.freeze({
  NONE: 'NONE',
  INVESTIGATING_MESSAGE: 'INVESTIGATING_MESSAGE',
});

// ─── Outlet Resolution Sources ────────────────────────────────────────────────

export const OUTLET_RESOLUTION_SOURCE = Object.freeze({
  RELATED_ORDER: 'RELATED_ORDER',
  COMPLAINT_FIELD: 'COMPLAINT_FIELD',
  CONVERSATION_CONTEXT: 'CONVERSATION_CONTEXT',
  UNRESOLVED: 'UNRESOLVED',
});

// ─── Policy Source Metadata ───────────────────────────────────────────────────

export const POLICY_SOURCE = Object.freeze({
  WORKSPACE_DEFAULT: 'WORKSPACE_DEFAULT',
  OUTLET_CUSTOM: 'OUTLET_CUSTOM',
  OUTLET_DISABLED: 'OUTLET_DISABLED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
});

// ─── Evaluation Result ────────────────────────────────────────────────────────

export const EVALUATION_RESULT = Object.freeze({
  MATCHED: 'MATCHED',
  NOT_MATCHED: 'NOT_MATCHED',
  DISABLED: 'DISABLED',
  OUTLET_UNRESOLVED: 'OUTLET_UNRESOLVED',
  NO_ELIGIBLE_RECIPIENT: 'NO_ELIGIBLE_RECIPIENT',
  DUPLICATE_ACTIVE_ESCALATION: 'DUPLICATE_ACTIVE_ESCALATION',
  STALE_EVENT: 'STALE_EVENT',
});

// ─── Scheduled Job Types ──────────────────────────────────────────────────────

export const SCHEDULED_JOB_TYPE = Object.freeze({
  AUTO_UNASSIGNED: 'AUTO_UNASSIGNED',
  AUTO_SLA: 'AUTO_SLA',
  QUEUED_OUTSIDE_HOURS: 'QUEUED_OUTSIDE_HOURS',
  SUPERVISOR_SLA_WARNING: 'SUPERVISOR_SLA_WARNING',
  SUPERVISOR_SLA_BREACH: 'SUPERVISOR_SLA_BREACH',
});

export const SCHEDULED_JOB_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
});

// ─── Assignment Types ─────────────────────────────────────────────────────────

export const ASSIGNMENT_TYPE = Object.freeze({
  OUTLET_SUPERVISOR_COLLABORATOR: 'OUTLET_SUPERVISOR_COLLABORATOR',
});

// ─── Domain Events ────────────────────────────────────────────────────────────

export const ESCALATION_EVENT = Object.freeze({
  EVALUATED: 'COMPLAINT_ESCALATION_EVALUATED',
  MATCHED: 'COMPLAINT_ESCALATION_MATCHED',
  CREATED: 'COMPLAINT_ESCALATION_CREATED',
  ROUTING_FAILED: 'COMPLAINT_ESCALATION_ROUTING_FAILED',
  ACKNOWLEDGED: 'COMPLAINT_ESCALATION_ACKNOWLEDGED',
  RESPONDED: 'COMPLAINT_ESCALATION_RESPONDED',
  REASSIGNED: 'COMPLAINT_ESCALATION_REASSIGNED',
  COMPLETED: 'COMPLAINT_ESCALATION_COMPLETED',
  CANCELLED: 'COMPLAINT_ESCALATION_CANCELLED',
  SLA_WARNING: 'COMPLAINT_ESCALATION_SLA_WARNING',
  SLA_BREACHED: 'COMPLAINT_ESCALATION_SLA_BREACHED',
  POLICY_CHANGED: 'COMPLAINT_ESCALATION_POLICY_CHANGED',
});

// ─── Permissions ──────────────────────────────────────────────────────────────

export const ESCALATION_PERMISSION = Object.freeze({
  READ: 'complaints.escalation.read',
  CREATE: 'complaints.escalation.create',
  ACKNOWLEDGE: 'complaints.escalation.acknowledge',
  RESPOND: 'complaints.escalation.respond',
  REASSIGN: 'complaints.escalation.reassign',
  COMPLETE: 'complaints.escalation.complete',
  CANCEL: 'complaints.escalation.cancel',
  HISTORY: 'complaints.escalation.history',
  SETTINGS_READ: 'complaints.escalation.settings.read',
  SETTINGS_MANAGE: 'complaints.escalation.settings.manage',
  OVERRIDE_MANAGE: 'complaints.escalation.override.manage',
});

// ─── Stable Error Codes ───────────────────────────────────────────────────────

export const ESCALATION_ERROR = Object.freeze({
  POLICY_NOT_CONFIGURED: 'ESCALATION_POLICY_NOT_CONFIGURED',
  POLICY_INVALID: 'ESCALATION_POLICY_INVALID',
  AUTO_DISABLED: 'AUTO_ESCALATION_DISABLED',
  OUTLET_UNRESOLVED: 'COMPLAINT_OUTLET_UNRESOLVED',
  OUTLET_NOT_ELIGIBLE: 'OUTLET_NOT_ELIGIBLE',
  SUPERVISOR_NOT_CONFIGURED: 'SUPERVISOR_NOT_CONFIGURED',
  NO_ELIGIBLE_RECIPIENT: 'NO_ELIGIBLE_RECIPIENT',
  ALREADY_ACTIVE: 'ESCALATION_ALREADY_ACTIVE',
  INVALID_TRANSITION: 'ESCALATION_INVALID_TRANSITION',
  ALREADY_ACKNOWLEDGED: 'ESCALATION_ALREADY_ACKNOWLEDGED',
  RECIPIENT_INELIGIBLE: 'RECIPIENT_INELIGIBLE',
  OUTLET_SCOPE_DENIED: 'OUTLET_SCOPE_DENIED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  SCHEDULED_JOB_STALE: 'SCHEDULED_JOB_STALE',
});

// ─── MVP Defaults (AEC-R8, AEC-R33) ──────────────────────────────────────────

export const MVP_DEFAULTS = Object.freeze({
  IMMEDIATE_PRIORITIES: ['HIGH', 'CRITICAL'],
  UNASSIGNED_AFTER_MINUTES_MEDIUM_LOW: 10,
  ACKNOWLEDGEMENT_MINUTES: 15,
  FIRST_RESPONSE_MINUTES: 60,
  RECIPIENT_STRATEGY: RECIPIENT_STRATEGY.PRIMARY_ONLY,
  FALLBACK_STEPS: [
    FALLBACK_STEP.OTHER_OUTLET_SUPERVISOR,
    FALLBACK_STEP.OUTLET_MANAGER,
    FALLBACK_STEP.WORKSPACE_SUPPORT_MANAGER,
    FALLBACK_STEP.ATTENTION_ALERT,
  ],
});
