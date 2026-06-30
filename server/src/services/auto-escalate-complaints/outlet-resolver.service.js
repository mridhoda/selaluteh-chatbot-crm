/**
 * auto-escalate-complaints/outlet-resolver.service.js
 * Spec: auto-escalate-complaints — Task Section 6
 *
 * Resolves the complaint outlet using the deterministic priority order:
 *   1. Related order outlet
 *   2. Explicit complaint outlet field
 *   3. Conversation selected outlet
 *   4. UNRESOLVED → attention event
 *
 * INVARIANT (AEC-R14, fixed_decisions.outlet_resolution):
 *   text_inference_allowed = false
 *   Outlet is NEVER inferred from product name or free-text description.
 *   Only structured data sources are consulted.
 */

import { getSupabaseServiceClient } from '../../db/supabase.js';
import { OUTLET_RESOLUTION_SOURCE } from './constants.js';

/**
 * @typedef {Object} OutletResolution
 * @property {string|null} outletId
 * @property {'RELATED_ORDER'|'COMPLAINT_FIELD'|'CONVERSATION_CONTEXT'|'UNRESOLVED'} source
 * @property {string|null} sourceReferenceId  — orderId, complaintId, or chatId
 * @property {boolean} resolved
 */

/**
 * Resolve the complaint outlet.
 *
 * @param {{
 *   workspaceId: string,
 *   orderId?: string|null,
 *   complaintOutletId?: string|null,
 *   conversationOutletId?: string|null,
 * }} param
 *
 * @returns {Promise<OutletResolution>}
 */
export async function resolveComplaintOutlet({ workspaceId, orderId, complaintOutletId, conversationOutletId }) {
  // ── Step 1: Related order outlet ──────────────────────────────────────────
  if (orderId) {
    const outletId = await getOrderOutletId({ workspaceId, orderId });
    if (outletId) {
      return {
        outletId,
        source: OUTLET_RESOLUTION_SOURCE.RELATED_ORDER,
        sourceReferenceId: orderId,
        resolved: true,
      };
    }
    // Order found but outlet invalid — degrade to next source (AEC-R15)
  }

  // ── Step 2: Explicit complaint outlet ─────────────────────────────────────
  if (complaintOutletId) {
    const valid = await isOutletValidInWorkspace({ workspaceId, outletId: complaintOutletId });
    if (valid) {
      return {
        outletId: complaintOutletId,
        source: OUTLET_RESOLUTION_SOURCE.COMPLAINT_FIELD,
        sourceReferenceId: complaintOutletId,
        resolved: true,
      };
    }
    // Cross-workspace outlet reference — reject and degrade
  }

  // ── Step 3: Conversation selected outlet ──────────────────────────────────
  if (conversationOutletId) {
    const valid = await isOutletValidInWorkspace({ workspaceId, outletId: conversationOutletId });
    if (valid) {
      return {
        outletId: conversationOutletId,
        source: OUTLET_RESOLUTION_SOURCE.CONVERSATION_CONTEXT,
        sourceReferenceId: conversationOutletId,
        resolved: true,
      };
    }
  }

  // ── Step 4: Unresolved ────────────────────────────────────────────────────
  return {
    outletId: null,
    source: OUTLET_RESOLUTION_SOURCE.UNRESOLVED,
    sourceReferenceId: null,
    resolved: false,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Fetch outlet_id from the immutable order record within this workspace.
 * Uses the order table directly (read-only).
 * A cross-workspace orderId returns null (rejected silently as invalid ref).
 */
async function getOrderOutletId({ workspaceId, orderId }) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from('orders')
    .select('outlet_id')
    .eq('workspace_id', workspaceId)
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data.outlet_id ?? null;
}

/**
 * Verify that an outlet belongs to this workspace and is active.
 * Cross-workspace access → returns false.
 */
async function isOutletValidInWorkspace({ workspaceId, outletId }) {
  if (!outletId) return false;
  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from('outlets')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('id', outletId)
    .maybeSingle();

  return !error && !!data;
}
