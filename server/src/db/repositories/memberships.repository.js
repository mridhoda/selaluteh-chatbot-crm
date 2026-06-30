/**
 * memberships.repository.js — Supabase-backed
 *
 * Handles user_workspace_memberships persistence using Supabase/Postgres.
 *
 * Contract (per docs/backend/06-data/repository-layer-contract.md):
 *   findActiveMembership({ userId, workspaceId }) → MembershipRecord | null
 *   listUserMemberships({ userId }) → MembershipRecord[]
 *   listWorkspaceMembers({ workspaceId, status?, limit?, skip? }) → MembershipRecord[]
 *   createMembership({ workspaceId, userId, role, status? }) → MembershipRecord
 *   updateRole({ userId, workspaceId, role }) → MembershipRecord | null
 *   updateAccessPolicy({ userId, workspaceId, accessPolicy }) → MembershipRecord | null
 *   disableMembership({ userId, workspaceId }) → MembershipRecord | null
 *   countWorkspaceOwners(workspaceId) → number
 *
 * MembershipRecord shape (camelCase — app layer):
 *   id, workspaceId, userId, role, status, createdAt, updatedAt
 *
 * DB table: user_workspace_memberships
 * Unique constraint: (workspace_id, user_id)
 *
 * DOMAIN STATUS: Supabase-backed (task 24.7)
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'user_workspace_memberships';

/**
 * @typedef {Object} MembershipRecord
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} userId
 * @property {string} role
 * @property {string} status
 * @property {string[]|null} notificationChannels — e.g. ['telegram','whatsapp']. null = all channels.
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const membershipsSupabaseRepository = {
  /**
   * Find an active membership for a given user in a workspace.
   * Returns null if not found or inactive.
   *
   * @param {{ userId: string, workspaceId: string }} param
   * @returns {Promise<MembershipRecord|null>}
   */
  async findActiveMembership({ userId, workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    const row = extractSingle(result, 'memberships.findActiveMembership');
    return row ? mapRow(row) : null;
  },

  /**
   * List all memberships for a user (across all workspaces).
   *
   * @param {{ userId: string }} param
   * @returns {Promise<MembershipRecord[]>}
   */
  async listUserMemberships({ userId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    const rows = extractData(result, 'memberships.listUserMemberships');
    return mapRows(rows ?? []);
  },

  /**
   * List all members of a workspace with optional status filter.
   *
   * @param {{ workspaceId: string, status?: string, limit?: number, skip?: number }} param
   * @returns {Promise<MembershipRecord[]>}
   */
  async listWorkspaceMembers({ workspaceId, status, limit = 100, skip = 0 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client
      .from(TABLE)
      .select('*, users:user_id(name, email)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status);

    const result = await query;
    const rows = extractData(result, 'memberships.listWorkspaceMembers');
    return mapRows(rows ?? []);
  },

  /**
   * Create a new membership (upsert on conflict workspace_id+user_id).
   * Uses upsert to handle duplicate silently and return the existing row.
   *
   * @param {{ workspaceId: string, userId: string, role: string, status?: string }} param
   * @returns {Promise<MembershipRecord>}
   */
  async createMembership({ workspaceId, userId, role, status = 'active' }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .upsert(
        { workspace_id: workspaceId, user_id: userId, role, status },
        { onConflict: 'workspace_id,user_id', ignoreDuplicates: false },
      )
      .select()
      .single();
    const row = extractSingle(result, 'memberships.createMembership');
    return mapRow(row);
  },

  /**
   * Update the role for a user in a workspace.
   * Returns null if membership not found.
   *
   * @param {{ userId: string, workspaceId: string, role: string }} param
   * @returns {Promise<MembershipRecord|null>}
   */
  async updateRole({ userId, workspaceId, role }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'memberships.updateRole');
    return row ? mapRow(row) : null;
  },

  /**
   * Update custom RBAC access policy for a membership.
   *
   * @param {{ userId: string, workspaceId: string, accessPolicy: object }} param
   * @returns {Promise<MembershipRecord|null>}
   */
  async updateAccessPolicy({ userId, workspaceId, accessPolicy }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ access_policy: accessPolicy || {} })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'memberships.updateAccessPolicy');
    return row ? mapRow(row) : null;
  },

  /**
   * Disable (soft-delete) a membership.
   * Returns null if not found.
   *
   * @param {{ userId: string, workspaceId: string }} param
   * @returns {Promise<MembershipRecord|null>}
   */
  async disableMembership({ userId, workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'disabled' })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'memberships.disableMembership');
    return row ? mapRow(row) : null;
  },

  /**
   * Count active owners in a workspace.
   * Used to prevent removal of the final owner.
   *
   * @param {string} workspaceId
   * @returns {Promise<number>}
   */
  async countWorkspaceOwners(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('role', 'owner')
      .eq('status', 'active');
    if (result.error) return 0;
    return result.count ?? 0;
  },

  /**
   * Update notification_channels preference for a user's membership.
   *
   * Called by the supervisor themselves via PATCH /api/memberships/me/notification-channels.
   * Pass null to reset to "all channels" (workspace default).
   *
   * Valid channel values: 'telegram' | 'whatsapp' | 'web_push'
   *
   * @param {{ userId: string, workspaceId: string, channels: string[]|null }} param
   * @returns {Promise<MembershipRecord|null>}
   */
  async updateNotificationChannels({ userId, workspaceId, channels }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ notification_channels: channels ?? null })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'memberships.updateNotificationChannels');
    return row ? mapRow(row) : null;
  },

  /**
   * Get notification_channels for a specific membership ID.
   * Used by escalation-notification.service.js.
   *
   * @param {{ membershipId: string }} param
   * @returns {Promise<string[]|null>} Array of channel names, or null (= all channels).
   */
  async getNotificationChannels({ membershipId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('notification_channels')
      .eq('id', membershipId)
      .maybeSingle();
    if (result.error || !result.data) return null;
    return result.data.notification_channels ?? null;
  },
};

