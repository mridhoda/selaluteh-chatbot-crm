/**
 * auto-escalate-complaints/escalation-policy.repository.js
 * Spec: auto-escalate-complaints — Task Section 3 + 4
 *
 * Workspace default policy + outlet override persistence.
 * All queries are scoped to workspace_id (required).
 * Unscoped list/count methods do not exist here.
 */

import { getSupabaseServiceClient } from '../../db/supabase.js';
import { mapRow, mapRows } from '../../db/supabase-mapper.js';
import { extractData, extractSingle } from '../../db/supabase-errors.js';
import { requireWorkspaceId } from '../../db/supabase-query.js';

const POLICY_TABLE = 'complaint_escalation_policies';
const OVERRIDE_TABLE = 'outlet_complaint_escalation_overrides';

// ─── Workspace Default Policy ─────────────────────────────────────────────────

export const escalationPolicyRepository = {
  /**
   * Read the workspace default escalation policy.
   * Returns null if not yet configured.
   */
  async findByWorkspace({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(POLICY_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    const row = extractSingle(result, 'escalationPolicy.findByWorkspace');
    return row ? mapRow(row) : null;
  },

  /**
   * Create or update the workspace default escalation policy.
   * Uses upsert; version is incremented on update.
   *
   * @param {{ workspaceId, data: Partial<PolicyData> }} param
   */
  async upsert({ workspaceId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();

    const existing = await this.findByWorkspace({ workspaceId });
    const nextVersion = existing ? existing.version + 1 : 1;

    const insert = {
      workspace_id: workspaceId,
      enabled: data.enabled ?? false,
      match_mode: data.matchMode ?? 'ANY',
      trigger_rules: data.triggerRules ?? {},
      recipient_strategy: data.recipientStrategy ?? 'PRIMARY_ONLY',
      fallback_steps: data.fallbackSteps ?? [],
      include_context: data.includeContext ?? {},
      after_escalation: data.afterEscalation ?? {},
      supervisor_sla: data.supervisorSla ?? {},
      schedule_policy: data.schedulePolicy ?? {},
      version: nextVersion,
      updated_at: new Date().toISOString(),
    };

    const result = await client
      .from(POLICY_TABLE)
      .upsert(insert, { onConflict: 'workspace_id' })
      .select()
      .single();
    return mapRow(extractSingle(result, 'escalationPolicy.upsert'));
  },

  /**
   * Optimistic-concurrency update: only succeeds when version matches.
   * Returns null on version conflict.
   */
  async updateWithVersionCheck({ workspaceId, expectedVersion, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(POLICY_TABLE)
      .update({
        ...buildPolicyUpdatePayload(data),
        version: expectedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('version', expectedVersion)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'escalationPolicy.updateWithVersionCheck');
    return row ? mapRow(row) : null; // null = version conflict
  },
};

// ─── Outlet Override ──────────────────────────────────────────────────────────

export const escalationOverrideRepository = {
  /**
   * List all outlet overrides for a workspace.
   */
  async listByWorkspace({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(OVERRIDE_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'escalationOverride.listByWorkspace') ?? []);
  },

  /**
   * Find override for a specific outlet.
   */
  async findByOutlet({ workspaceId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(OVERRIDE_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId)
      .maybeSingle();
    const row = extractSingle(result, 'escalationOverride.findByOutlet');
    return row ? mapRow(row) : null;
  },

  /**
   * Create or update outlet override.
   */
  async upsert({ workspaceId, outletId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();

    const existing = await this.findByOutlet({ workspaceId, outletId });
    const nextVersion = existing ? existing.version + 1 : 1;

    const insert = {
      workspace_id: workspaceId,
      outlet_id: outletId,
      configuration_mode: data.configurationMode ?? 'USE_WORKSPACE_DEFAULT',
      enabled_override: data.enabledOverride ?? null,
      policy_override: data.policyOverride ?? null,
      primary_supervisor_membership_id: data.primarySupervisorMembershipId ?? null,
      version: nextVersion,
      updated_at: new Date().toISOString(),
    };

    const result = await client
      .from(OVERRIDE_TABLE)
      .upsert(insert, { onConflict: 'workspace_id,outlet_id' })
      .select()
      .single();
    return mapRow(extractSingle(result, 'escalationOverride.upsert'));
  },

  /**
   * Delete override (resets outlet to USE_WORKSPACE_DEFAULT).
   */
  async deleteByOutlet({ workspaceId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(OVERRIDE_TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId);
    return !result.error;
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPolicyUpdatePayload(data) {
  const payload = {};
  if (data.enabled !== undefined) payload.enabled = data.enabled;
  if (data.matchMode !== undefined) payload.match_mode = data.matchMode;
  if (data.triggerRules !== undefined) payload.trigger_rules = data.triggerRules;
  if (data.recipientStrategy !== undefined) payload.recipient_strategy = data.recipientStrategy;
  if (data.fallbackSteps !== undefined) payload.fallback_steps = data.fallbackSteps;
  if (data.includeContext !== undefined) payload.include_context = data.includeContext;
  if (data.afterEscalation !== undefined) payload.after_escalation = data.afterEscalation;
  if (data.supervisorSla !== undefined) payload.supervisor_sla = data.supervisorSla;
  if (data.schedulePolicy !== undefined) payload.schedule_policy = data.schedulePolicy;
  return payload;
}
