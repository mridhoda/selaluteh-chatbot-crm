/**
 * auto-escalate-complaints/effective-policy.service.js
 * Spec: auto-escalate-complaints — Task Section 5
 *
 * Resolves the effective escalation policy for a given (workspaceId, outletId).
 * Priority: OUTLET_DISABLED > OUTLET_CUSTOM > WORKSPACE_DEFAULT
 *
 * Returns a resolved policy object with source metadata.
 * Does not cache — caller is responsible for memoization if needed.
 */

import { escalationPolicyRepository, escalationOverrideRepository } from './escalation-policy.repository.js';
import { OUTLET_OVERRIDE_MODE, POLICY_SOURCE } from './constants.js';

/**
 * @typedef {Object} EffectivePolicyResult
 * @property {'WORKSPACE_DEFAULT'|'OUTLET_CUSTOM'|'OUTLET_DISABLED'|'INVALID_CONFIGURATION'} source
 * @property {boolean} enabled
 * @property {object|null} policy   — null when DISABLED or INVALID_CONFIGURATION
 * @property {string|null} policyId
 * @property {number|null} policyVersion
 * @property {object|null} override
 */

/**
 * Resolve effective escalation policy for a workspace+outlet pair.
 *
 * @param {{ workspaceId: string, outletId: string }} param
 * @returns {Promise<EffectivePolicyResult>}
 */
export async function resolveEffectivePolicy({ workspaceId, outletId }) {
  const [workspacePolicy, outletOverride] = await Promise.all([
    escalationPolicyRepository.findByWorkspace({ workspaceId }),
    outletId ? escalationOverrideRepository.findByOutlet({ workspaceId, outletId }) : Promise.resolve(null),
  ]);

  // ── Case 1: Outlet explicitly disabled ──
  if (outletOverride?.configurationMode === OUTLET_OVERRIDE_MODE.DISABLED) {
    return {
      source: POLICY_SOURCE.OUTLET_DISABLED,
      enabled: false,
      policy: null,
      policyId: null,
      policyVersion: null,
      override: outletOverride,
    };
  }

  // ── Case 2: Outlet has a custom policy ──
  if (outletOverride?.configurationMode === OUTLET_OVERRIDE_MODE.CUSTOM && outletOverride.policyOverride) {
    const mergedPolicy = mergeCustomOverride(workspacePolicy, outletOverride);
    const isEnabled = outletOverride.enabledOverride ?? workspacePolicy?.enabled ?? false;
    return {
      source: POLICY_SOURCE.OUTLET_CUSTOM,
      enabled: isEnabled,
      policy: isEnabled ? mergedPolicy : null,
      policyId: workspacePolicy?.id ?? null,
      policyVersion: workspacePolicy?.version ?? null,
      override: outletOverride,
    };
  }

  // ── Case 3: Use workspace default ──
  if (!workspacePolicy) {
    return {
      source: POLICY_SOURCE.INVALID_CONFIGURATION,
      enabled: false,
      policy: null,
      policyId: null,
      policyVersion: null,
      override: outletOverride,
    };
  }

  return {
    source: POLICY_SOURCE.WORKSPACE_DEFAULT,
    enabled: workspacePolicy.enabled,
    policy: workspacePolicy.enabled ? workspacePolicy : null,
    policyId: workspacePolicy.id,
    policyVersion: workspacePolicy.version,
    override: outletOverride,
  };
}

/**
 * Validate that a policy object has at least one valid trigger and recipient strategy.
 * Returns an array of validation error strings. Empty array = valid.
 *
 * @param {object} policy
 * @returns {string[]}
 */
export function validatePolicy(policy) {
  if (!policy) return ['Policy is required'];
  const errors = [];

  const rules = policy.triggerRules ?? {};
  const hasTrigger =
    (rules.immediatePriorities && rules.immediatePriorities.length > 0) ||
    rules.unassignedAfterMinutes != null ||
    rules.slaRemainingMinutes != null ||
    (rules.categoryIds && rules.categoryIds.length > 0);

  if (!hasTrigger) {
    errors.push('At least one trigger rule must be configured');
  }

  const validStrategies = ['PRIMARY_ONLY', 'FIRST_AVAILABLE', 'ROUND_ROBIN', 'SUPERVISOR_QUEUE', 'ALL_SUPERVISORS'];
  if (!validStrategies.includes(policy.recipientStrategy)) {
    errors.push(`recipientStrategy must be one of: ${validStrategies.join(', ')}`);
  }

  const sla = policy.supervisorSla ?? {};
  if (sla.acknowledgementMinutes != null && sla.acknowledgementMinutes < 1) {
    errors.push('supervisorSla.acknowledgementMinutes must be >= 1');
  }
  if (sla.firstResponseMinutes != null && sla.firstResponseMinutes < 1) {
    errors.push('supervisorSla.firstResponseMinutes must be >= 1');
  }

  return errors;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Merge outlet custom override on top of workspace default.
 * Only fields explicitly set in policyOverride are substituted.
 * Implements AEC-R5: "A custom override shall inherit only fields explicitly configured."
 */
function mergeCustomOverride(workspacePolicy, override) {
  const base = workspacePolicy ?? {};
  const overrideData = override.policyOverride ?? {};
  return { ...base, ...overrideData };
}
