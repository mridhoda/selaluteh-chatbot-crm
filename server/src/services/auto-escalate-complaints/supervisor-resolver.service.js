/**
 * auto-escalate-complaints/supervisor-resolver.service.js
 * Spec: auto-escalate-complaints — Task Section 8
 *
 * Resolves the eligible supervisor for an escalation.
 *
 * Schema (post-migration 026/027):
 *   user_outlet_access: workspace_id, outlet_id, user_id, membership_id (NOT NULL, FK)
 *   outlets: workspace_id, id, primary_supervisor_user_id (nullable FK), manager_user_id (nullable FK)
 *   user_workspace_memberships: id, workspace_id, user_id, role, status
 *
 * Default strategy (MVP, AEC-R17, AEC-R19):
 *   1. Primary active supervisor of the complaint outlet (from outlets.primary_supervisor_user_id)
 *   2. Any other active outlet supervisor (from user_outlet_access)
 *   3. Outlet manager (from outlets.manager_user_id)
 *   4. Workspace support manager (user_workspace_memberships role = 'support_manager')
 *   5. ATTENTION_ALERT (no recipient resolved)
 *
 * INVARIANTS (correctness_invariants):
 *   - supervisor-is-resolved-from-active-membership
 *   - unrelated-outlet-supervisor-is-never-selected (always filter by outlet_id)
 *   - no-hard-coded-supervisor
 *   - inactive-or-unauthorized-recipient-not-selected
 */

import { getSupabaseServiceClient } from '../../db/supabase.js';
import { FALLBACK_STEP } from './constants.js';

/**
 * @typedef {Object} SupervisorResolution
 * @property {string|null} membershipId
 * @property {string|null} userId
 * @property {string} resolvedVia  — 'PRIMARY_SUPERVISOR'|'OTHER_SUPERVISOR'|'OUTLET_MANAGER'|'WORKSPACE_SUPPORT'|'ATTENTION_ALERT'
 * @property {Array<{step: string, reason: string}>} fallbackTrace
 * @property {boolean} resolved
 */

/**
 * Resolve the eligible supervisor for an outlet escalation.
 * Never hard-codes a supervisor. Never routes to unrelated outlet.
 *
 * @param {{
 *   workspaceId: string,
 *   outletId: string,
 *   policy: object,
 *   outletOverride?: object|null,
 * }} param
 *
 * @returns {Promise<SupervisorResolution>}
 */
export async function resolveEligibleSupervisor({ workspaceId, outletId, policy, outletOverride }) {
  const fallbackSteps = policy.fallbackSteps ?? [
    FALLBACK_STEP.OTHER_OUTLET_SUPERVISOR,
    FALLBACK_STEP.OUTLET_MANAGER,
    FALLBACK_STEP.WORKSPACE_SUPPORT_MANAGER,
    FALLBACK_STEP.ATTENTION_ALERT,
  ];

  const trace = [];

  // ── Step 1: Primary supervisor ────────────────────────────────────────────
  // Check if override explicitly pins a primary supervisor membership
  const pinnedMembershipId = outletOverride?.primarySupervisorMembershipId ?? null;
  if (pinnedMembershipId) {
    const eligible = await checkMembershipEligibility({ workspaceId, outletId, membershipId: pinnedMembershipId });
    if (eligible) {
      return buildResolved(eligible, 'PRIMARY_SUPERVISOR', trace);
    }
    trace.push({ step: 'PRIMARY_SUPERVISOR_PINNED', reason: 'Pinned membership not eligible or inactive' });
  }

  // Look up outlet's primary_supervisor_user_id
  const primary = await findPrimaryOutletSupervisor({ workspaceId, outletId });
  if (primary) {
    trace.push({ step: 'PRIMARY_SUPERVISOR', reason: 'Resolved from outlets.primary_supervisor_user_id' });
    return buildResolved(primary, 'PRIMARY_SUPERVISOR', trace);
  }
  trace.push({ step: 'PRIMARY_SUPERVISOR', reason: 'No active primary supervisor configured' });

  // ── Fallback chain ────────────────────────────────────────────────────────
  for (const step of fallbackSteps) {
    if (step === FALLBACK_STEP.OTHER_OUTLET_SUPERVISOR) {
      const other = await findAnyActiveOutletMember({ workspaceId, outletId, excludeMembershipId: null });
      if (other) return buildResolved(other, 'OTHER_SUPERVISOR', trace);
      trace.push({ step, reason: 'No other eligible supervisor in user_outlet_access for this outlet' });
    }

    if (step === FALLBACK_STEP.OUTLET_MANAGER) {
      const manager = await findOutletManager({ workspaceId, outletId });
      if (manager) return buildResolved(manager, 'OUTLET_MANAGER', trace);
      trace.push({ step, reason: 'No active outlet manager (outlets.manager_user_id) found' });
    }

    if (step === FALLBACK_STEP.WORKSPACE_SUPPORT_MANAGER) {
      const wsSupport = await findWorkspaceSupportManager({ workspaceId });
      if (wsSupport) return buildResolved(wsSupport, 'WORKSPACE_SUPPORT', trace);
      trace.push({ step, reason: 'No workspace support_manager membership found' });
    }

    if (step === FALLBACK_STEP.ATTENTION_ALERT) {
      trace.push({ step, reason: 'All fallback steps exhausted — attention alert required' });
      break;
    }
  }

  // ── No recipient resolved ─────────────────────────────────────────────────
  return {
    membershipId: null,
    userId: null,
    resolvedVia: 'ATTENTION_ALERT',
    fallbackTrace: trace,
    resolved: false,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Resolve the primary supervisor via outlets.primary_supervisor_user_id.
 * Verifies the user has an active membership AND outlet access.
 */
async function findPrimaryOutletSupervisor({ workspaceId, outletId }) {
  const client = getSupabaseServiceClient();

  const { data: outlet } = await client
    .from('outlets')
    .select('primary_supervisor_user_id')
    .eq('workspace_id', workspaceId)
    .eq('id', outletId)
    .maybeSingle();

  if (!outlet?.primary_supervisor_user_id) return null;

  // Verify active membership with outlet access
  return resolveActiveMembershipWithOutletAccess({
    workspaceId,
    outletId,
    userId: outlet.primary_supervisor_user_id,
  });
}

/**
 * Find any active member with outlet access (excluding a specific membership if provided).
 * Uses user_outlet_access which now has membership_id (post migration 027).
 */
async function findAnyActiveOutletMember({ workspaceId, outletId, excludeMembershipId }) {
  const client = getSupabaseServiceClient();

  let q = client
    .from('user_outlet_access')
    .select('membership_id, user_id, user_workspace_memberships!user_outlet_access_membership_id_fkey(id, user_id, status)')
    .eq('workspace_id', workspaceId)
    .eq('outlet_id', outletId)
    .eq('user_workspace_memberships.status', 'active');

  if (excludeMembershipId) {
    q = q.neq('membership_id', excludeMembershipId);
  }

  const { data } = await q.limit(1).maybeSingle();
  if (!data) return null;

  const membership = data['user_workspace_memberships'];
  if (!membership || membership.status !== 'active') return null;

  return { id: data.membership_id, userId: data.user_id };
}

/**
 * Find the outlet manager via outlets.manager_user_id.
 * Verifies active membership.
 */
async function findOutletManager({ workspaceId, outletId }) {
  const client = getSupabaseServiceClient();

  const { data: outlet } = await client
    .from('outlets')
    .select('manager_user_id')
    .eq('workspace_id', workspaceId)
    .eq('id', outletId)
    .maybeSingle();

  if (!outlet?.manager_user_id) return null;

  return findActiveMembershipByUser({ workspaceId, userId: outlet.manager_user_id });
}

/**
 * Find any active support_manager role membership in the workspace.
 */
async function findWorkspaceSupportManager({ workspaceId }) {
  const client = getSupabaseServiceClient();
  const { data } = await client
    .from('user_workspace_memberships')
    .select('id, user_id')
    .eq('workspace_id', workspaceId)
    .eq('role', 'support_manager')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, userId: data.user_id };
}

/**
 * Find an active workspace membership for a user.
 */
async function findActiveMembershipByUser({ workspaceId, userId }) {
  const client = getSupabaseServiceClient();
  const { data } = await client
    .from('user_workspace_memberships')
    .select('id, user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return data ? { id: data.id, userId: data.user_id } : null;
}

/**
 * Resolve active membership for a user that also has outlet access.
 * Used for primary_supervisor and manager lookups.
 */
async function resolveActiveMembershipWithOutletAccess({ workspaceId, outletId, userId }) {
  const client = getSupabaseServiceClient();

  // Get membership
  const membership = await findActiveMembershipByUser({ workspaceId, userId });
  if (!membership) return null;

  // Verify outlet access via user_outlet_access (now with membership_id)
  const { data: access } = await client
    .from('user_outlet_access')
    .select('membership_id')
    .eq('workspace_id', workspaceId)
    .eq('outlet_id', outletId)
    .eq('membership_id', membership.id)
    .maybeSingle();

  if (!access) return null;
  return membership;
}

/**
 * Verify a specific membership is active AND has access to the outlet.
 * Used for pinned override membership validation.
 */
async function checkMembershipEligibility({ workspaceId, outletId, membershipId }) {
  const client = getSupabaseServiceClient();

  const { data: membership } = await client
    .from('user_workspace_memberships')
    .select('id, user_id, status')
    .eq('workspace_id', workspaceId)
    .eq('id', membershipId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) return null;

  const { data: access } = await client
    .from('user_outlet_access')
    .select('membership_id')
    .eq('workspace_id', workspaceId)
    .eq('outlet_id', outletId)
    .eq('membership_id', membershipId)
    .maybeSingle();

  if (!access) return null;
  return { id: membership.id, userId: membership.user_id };
}

function buildResolved(membership, via, trace) {
  return {
    membershipId: membership.id,
    userId: membership.userId,
    resolvedVia: via,
    fallbackTrace: trace,
    resolved: true,
  };
}
