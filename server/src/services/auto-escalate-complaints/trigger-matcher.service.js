/**
 * auto-escalate-complaints/trigger-matcher.service.js
 * Spec: auto-escalate-complaints — Task Section 7
 *
 * Evaluates whether a complaint matches escalation trigger conditions.
 * Supports ANY and ALL match logic.
 *
 * Deterministic: given same inputs → same output.
 * No side effects. Pure logic.
 *
 * MVP triggers (AEC-R7, AEC-R8, AEC-R10):
 *   - AUTO_PRIORITY (immediate: HIGH, CRITICAL)
 *   - AUTO_UNASSIGNED (delayed: unassignedAfterMinutes)
 *   - AUTO_SLA (delayed: slaRemainingMinutes)
 *   - MANUAL (always matches if requested)
 */

import { TRIGGER_TYPE, MATCH_MODE } from './constants.js';

/**
 * @typedef {Object} TriggerMatchResult
 * @property {boolean} matched
 * @property {string[]} matchedRules   — list of rule names that matched
 * @property {string[]} skippedRules   — list of rules in policy that did NOT match
 * @property {string|null} triggerType — best trigger type if matched
 * @property {string} evaluatedAt
 */

/**
 * Evaluate all trigger conditions from the effective policy against the complaint state.
 *
 * @param {{
 *   policy: object,
 *   complaint: {
 *     priority: string,
 *     categoryId?: string|null,
 *     assignedToUserId?: string|null,
 *     createdAt: string,
 *     slaRemainingMinutes?: number|null,
 *   },
 *   triggerType?: string,   — forced trigger type (e.g. MANUAL)
 *   evaluationTime?: Date,
 * }} param
 *
 * @returns {TriggerMatchResult}
 */
export function evaluateTriggers({ policy, complaint, triggerType, evaluationTime }) {
  const now = evaluationTime ?? new Date();
  const matchMode = policy.matchMode ?? MATCH_MODE.ANY;
  const rules = policy.triggerRules ?? {};

  // Manual trigger always matches if explicitly requested
  if (triggerType === TRIGGER_TYPE.MANUAL) {
    return {
      matched: true,
      matchedRules: ['MANUAL'],
      skippedRules: [],
      triggerType: TRIGGER_TYPE.MANUAL,
      evaluatedAt: now.toISOString(),
    };
  }

  const results = [];

  // ── Priority trigger ──────────────────────────────────────────────────────
  if (rules.immediatePriorities && rules.immediatePriorities.length > 0) {
    const match = rules.immediatePriorities
      .map(p => p.toUpperCase())
      .includes((complaint.priority ?? '').toUpperCase());
    results.push({ name: 'AUTO_PRIORITY', matched: match, type: TRIGGER_TYPE.AUTO_PRIORITY });
  }

  // ── Category trigger ──────────────────────────────────────────────────────
  if (rules.categoryIds && rules.categoryIds.length > 0 && complaint.categoryId) {
    const match = rules.categoryIds.includes(complaint.categoryId);
    results.push({ name: 'AUTO_CATEGORY', matched: match, type: TRIGGER_TYPE.AUTO_CATEGORY });
  }

  // ── Unassigned timeout trigger ────────────────────────────────────────────
  if (rules.unassignedAfterMinutes != null) {
    const isAssigned = !!complaint.assignedToUserId;
    let match = false;
    if (!isAssigned) {
      const createdAt = new Date(complaint.createdAt);
      const minutesUnassigned = (now - createdAt) / 60000;
      match = minutesUnassigned >= rules.unassignedAfterMinutes;
    }
    results.push({ name: 'AUTO_UNASSIGNED', matched: match, type: TRIGGER_TYPE.AUTO_UNASSIGNED });
  }

  // ── SLA threshold trigger ─────────────────────────────────────────────────
  if (rules.slaRemainingMinutes != null && complaint.slaRemainingMinutes != null) {
    const match = complaint.slaRemainingMinutes <= rules.slaRemainingMinutes;
    results.push({ name: 'AUTO_SLA', matched: match, type: TRIGGER_TYPE.AUTO_SLA });
  }

  const matchedRules = results.filter(r => r.matched).map(r => r.name);
  const skippedRules = results.filter(r => !r.matched).map(r => r.name);

  // ANY: at least one matched
  // ALL: every rule in policy must match
  const matched =
    matchMode === MATCH_MODE.ALL
      ? results.length > 0 && results.every(r => r.matched)
      : matchedRules.length > 0;

  // Best trigger type: prefer first matched rule
  const bestType = results.find(r => r.matched)?.type ?? null;

  return {
    matched,
    matchedRules,
    skippedRules,
    triggerType: bestType,
    evaluatedAt: now.toISOString(),
  };
}
