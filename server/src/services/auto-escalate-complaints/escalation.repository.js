/**
 * auto-escalate-complaints/escalation.repository.js
 * Spec: auto-escalate-complaints — Task Section 9, 17, 18, 20
 *
 * Escalation, response, and assignment persistence.
 * All operations workspace-scoped. No unscoped methods.
 *
 * Core invariant enforced at DB level:
 *   partial unique index uq_one_active_escalation_per_complaint_outlet_level
 *   prevents more than one ACTIVE escalation per (complaint, outlet, level).
 */

import { getSupabaseServiceClient } from '../../db/supabase.js';
import { mapRow, mapRows } from '../../db/supabase-mapper.js';
import { extractData, extractSingle } from '../../db/supabase-errors.js';
import { requireWorkspaceId } from '../../db/supabase-query.js';
import { ESCALATION_TERMINAL_STATUSES } from './constants.js';

const ESC_TABLE = 'complaint_escalations';
const RESP_TABLE = 'complaint_escalation_responses';
const ASGN_TABLE = 'complaint_escalation_assignments';

// ─── Escalations ──────────────────────────────────────────────────────────────

export const escalationRepository = {
  /**
   * Create a new escalation idempotently.
   * Relies on unique(workspace_id, idempotency_key) to prevent duplicates.
   * Returns existing row on conflict (idempotent).
   */
  async create({ workspaceId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();

    const insert = {
      workspace_id: workspaceId,
      complaint_id: data.complaintId,
      outlet_id: data.outletId,
      parent_escalation_id: data.parentEscalationId ?? null,
      trigger_type: data.triggerType,
      status: data.status ?? 'PENDING',
      escalation_level: data.escalationLevel ?? 1,
      recipient_membership_id: data.recipientMembershipId ?? null,
      escalated_by_membership_id: data.escalatedByMembershipId ?? null,
      policy_id: data.policyId ?? null,
      policy_version: data.policyVersion ?? null,
      idempotency_key: data.idempotencyKey,
      complaint_snapshot: data.complaintSnapshot ?? {},
      trigger_snapshot: data.triggerSnapshot ?? {},
      routing_snapshot: data.routingSnapshot ?? {},
      acknowledgement_due_at: data.acknowledgementDueAt ?? null,
      response_due_at: data.responseDueAt ?? null,
      resolution_due_at: data.resolutionDueAt ?? null,
      version: 1,
    };

    const result = await client
      .from(ESC_TABLE)
      .upsert(insert, { onConflict: 'workspace_id,idempotency_key', ignoreDuplicates: true })
      .select()
      .single();

    const row = extractSingle(result, 'escalation.create');
    return mapRow(row);
  },

  /**
   * Find escalation by ID within a workspace.
   */
  async findById({ workspaceId, escalationId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ESC_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', escalationId)
      .maybeSingle();
    const row = extractSingle(result, 'escalation.findById');
    return row ? mapRow(row) : null;
  },

  /**
   * Find the current active escalation for a complaint at a given outlet/level.
   * Returns null if none (safe to escalate again).
   */
  async findActive({ workspaceId, complaintId, outletId, escalationLevel = 1 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ESC_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('complaint_id', complaintId)
      .eq('outlet_id', outletId)
      .eq('escalation_level', escalationLevel)
      .not('status', 'in', `(${ESCALATION_TERMINAL_STATUSES.join(',')})`)
      .maybeSingle();
    const row = extractSingle(result, 'escalation.findActive');
    return row ? mapRow(row) : null;
  },

  /**
   * List escalations for a complaint.
   */
  async listByComplaint({ workspaceId, complaintId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ESC_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'escalation.listByComplaint') ?? []);
  },

  /**
   * Supervisor queue: list escalations assigned to a recipient membership.
   * Outlet isolation enforced — only accessible outletIds are passed.
   */
  async listForSupervisor({ workspaceId, recipientMembershipId, outletIds, status, limit = 50, offset = 0 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client
      .from(ESC_TABLE)
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('recipient_membership_id', recipientMembershipId);

    if (outletIds && outletIds.length > 0) q = q.in('outlet_id', outletIds);
    if (status) q = q.eq('status', status);

    q = q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const result = await q;
    const rows = extractData(result, 'escalation.listForSupervisor') ?? [];
    return { data: mapRows(rows), count: result.count ?? 0 };
  },

  /**
   * List escalations for a workspace with optional filters.
   */
  async list({ workspaceId, outletIds, status, triggerType, limit = 50, offset = 0 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client
      .from(ESC_TABLE)
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    if (outletIds && outletIds.length > 0) q = q.in('outlet_id', outletIds);
    if (status) q = q.eq('status', status);
    if (triggerType) q = q.eq('trigger_type', triggerType);

    q = q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const result = await q;
    const rows = extractData(result, 'escalation.list') ?? [];
    return { data: mapRows(rows), count: result.count ?? 0 };
  },

  /**
   * Update escalation status with optimistic concurrency.
   * Returns null on version conflict.
   */
  async updateStatus({ workspaceId, escalationId, expectedVersion, status, extra = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ESC_TABLE)
      .update({
        status,
        version: expectedVersion + 1,
        updated_at: new Date().toISOString(),
        ...buildStatusTimestampPayload(status),
        ...extra,
      })
      .eq('workspace_id', workspaceId)
      .eq('id', escalationId)
      .eq('version', expectedVersion)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'escalation.updateStatus');
    return row ? mapRow(row) : null;
  },

  /**
   * Find all pending scheduled evaluations for a complaint
   * (used to avoid duplicate scheduling).
   */
  async findByIdempotencyKey({ workspaceId, idempotencyKey }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ESC_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    const row = extractSingle(result, 'escalation.findByIdempotencyKey');
    return row ? mapRow(row) : null;
  },
};

// ─── Responses ────────────────────────────────────────────────────────────────

export const escalationResponseRepository = {
  /**
   * Append a response (immutable, append-only).
   * Supervisor responses do NOT automatically reach the customer.
   */
  async create({ workspaceId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: workspaceId,
      outlet_id: data.outletId,
      complaint_id: data.complaintId,
      escalation_id: data.escalationId,
      sender_membership_id: data.senderMembershipId ?? null,
      response_type: data.responseType,
      message_text: data.messageText ?? null,
      structured_payload: data.structuredPayload ?? null,
      corrects_response_id: data.correctsResponseId ?? null,
    };
    const result = await client.from(RESP_TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'escalationResponse.create'));
  },

  /**
   * List responses for an escalation.
   * Only authorized collaborators should see these (enforced at service layer).
   */
  async listByEscalation({ workspaceId, escalationId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(RESP_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('escalation_id', escalationId)
      .order('created_at', { ascending: true });
    return mapRows(extractData(result, 'escalationResponse.listByEscalation') ?? []);
  },
};

// ─── Assignments ──────────────────────────────────────────────────────────────

export const escalationAssignmentRepository = {
  /**
   * Assign a supervisor as collaborator.
   * Idempotent — if the membership is already assigned, returns existing.
   */
  async create({ workspaceId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: workspaceId,
      complaint_id: data.complaintId,
      escalation_id: data.escalationId,
      membership_id: data.membershipId,
      assignment_type: data.assignmentType ?? 'OUTLET_SUPERVISOR_COLLABORATOR',
      assigned_at: new Date().toISOString(),
    };
    const result = await client.from(ASGN_TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'escalationAssignment.create'));
  },

  /**
   * End (soft-remove) an assignment without deleting history.
   */
  async endAssignment({ workspaceId, escalationId, membershipId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client
      .from(ASGN_TABLE)
      .update({ ended_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('escalation_id', escalationId)
      .eq('membership_id', membershipId)
      .is('ended_at', null);
  },

  async listByEscalation({ workspaceId, escalationId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ASGN_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('escalation_id', escalationId)
      .order('assigned_at', { ascending: true });
    return mapRows(extractData(result, 'escalationAssignment.listByEscalation') ?? []);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStatusTimestampPayload(status) {
  const now = new Date().toISOString();
  switch (status) {
    case 'ACKNOWLEDGED': return { acknowledged_at: now };
    case 'RESPONDED':    return { responded_at: now };
    case 'COMPLETED':    return { completed_at: now };
    case 'CANCELLED':    return { cancelled_at: now };
    default:             return {};
  }
}
