/**
 * outlets.repository.js — Supabase-backed (task 24.8)
 *
 * Replaces Mongoose Outlet + UserOutletAccess models.
 *
 * DB tables: outlets, user_outlet_access
 *
 * OutletRecord shape (camelCase):
 *   id, workspaceId, name, code, city, region, address, postalCode,
 *   phone, managerUserId, status, timezone, openingHours, metadata,
 *   createdAt, updatedAt
 *
 * UserOutletAccessRecord shape (camelCase):
 *   id, workspaceId, userId, outletId, role, status, createdAt, updatedAt
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, withWorkspace, applyPagination, withSearch } from '../supabase-query.js';

const TABLE = 'outlets';
const ACCESS_TABLE = 'user_outlet_access';

export const outletsSupabaseRepository = {
  // ─── Outlets ──────────────────────────────────────────────────────────────

  /**
   * List outlets with optional status/search filter and pagination.
   */
  async list({ workspaceId, status, search, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('workspace_id', workspaceId).order('name');
    if (status) q = q.eq('status', status);
    if (search) q = withSearch(q, 'name', search);
    q = applyPagination(q, { page, limit });
    const result = await q;
    const rows = extractData(result, 'outlets.list');
    return mapRows(rows ?? []);
  },

  /**
   * Count outlets with optional status/search filter.
   */
  async count({ workspaceId, status, search }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (status) q = q.eq('status', status);
    if (search) q = withSearch(q, 'name', search);
    const result = await q;
    if (result.error) return 0;
    return result.count ?? 0;
  },

  /**
   * Find outlet by workspaceId + outletId.
   * Returns null if not found.
   */
  async findById({ workspaceId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', outletId)
      .maybeSingle();
    const row = extractSingle(result, 'outlets.findById');
    return row ? mapRow(row) : null;
  },

  /**
   * Alias for findById — matches the outletsRepository contract.
   */
  async findByWorkspaceAndId({ workspaceId, outletId }) {
    return this.findById({ workspaceId, outletId });
  },

  /**
   * Find outlet by unique code within a workspace.
   */
  async findByCode({ workspaceId, code }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('code', code.toUpperCase())
      .maybeSingle();
    const row = extractSingle(result, 'outlets.findByCode');
    return row ? mapRow(row) : null;
  },

  /**
   * Find all active outlets in a workspace, sorted by name.
   */
  async findActiveByWorkspace(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('name');
    const rows = extractData(result, 'outlets.findActiveByWorkspace');
    return mapRows(rows ?? []);
  },

  /**
   * Find all non-archived outlet IDs (for access control).
   * Returns active outlet IDs for access control.
   */
  async findActiveIdsByWorkspace(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('id')
      .eq('workspace_id', workspaceId)
      .neq('status', 'archived');
    const rows = extractData(result, 'outlets.findActiveIdsByWorkspace');
    return (rows ?? []).map((r) => ({ id: r.id }));
  },

  /**
   * Create a new outlet.
   */
  async create(data) {
    const { workspaceId, name, code, city, region, address, postalCode, phone,
      managerUserId, status = 'active', timezone = 'Asia/Makassar', openingHours = {}, metadata = {} } = data;
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        name,
        code: code ? code.toUpperCase() : null,
        city: city || null,
        region: region || null,
        address: address || null,
        postal_code: postalCode || null,
        phone: phone || null,
        manager_user_id: managerUserId || null,
        status,
        timezone,
        opening_hours: openingHours,
        metadata,
      })
      .select()
      .single();
    const row = extractSingle(result, 'outlets.create');
    return mapRow(row);
  },

  /**
   * Update outlet fields.
   */
  async update({ workspaceId, outletId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const allowed = ['name', 'code', 'city', 'region', 'address', 'postalCode',
      'phone', 'managerUserId', 'status', 'timezone', 'openingHours', 'metadata'];
    const set = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        // camelCase → snake_case for specific fields
        const dbKey = {
          postalCode: 'postal_code',
          managerUserId: 'manager_user_id',
          openingHours: 'opening_hours',
        }[key] ?? key;
        set[dbKey] = updates[key];
      }
    }
    if (set.code) set.code = set.code.toUpperCase();
    const result = await client
      .from(TABLE)
      .update(set)
      .eq('workspace_id', workspaceId)
      .eq('id', outletId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'outlets.update');
    return row ? mapRow(row) : null;
  },

  /**
   * Update outlet status.
   */
  async updateStatus({ workspaceId, outletId, status }) {
    return this.update({ workspaceId, outletId, updates: { status } });
  },

  // ─── User Outlet Access ───────────────────────────────────────────────────

  /**
   * Get active outlet access records for a user in a workspace.
   * Returns active outlet access rows for a user.
   */
  async findUserAccess({ workspaceId, userId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ACCESS_TABLE)
      .select('outlet_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('status', 'active');
    const rows = extractData(result, 'outlets.findUserAccess');
    return (rows ?? []).map((r) => ({ outletId: r.outlet_id }));
  },

  /**
   * Get a single user outlet access record.
   */
  async findOneUserAccess({ workspaceId, outletId, userId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ACCESS_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    const row = extractSingle(result, 'outlets.findOneUserAccess');
    return row ? mapRow(row) : null;
  },

  /**
   * List all outlet access records for a user (with outlet details joined).
   */
  async listUserAccess({ workspaceId, userId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(ACCESS_TABLE)
      .select('*, outlets!inner(id, name, code, city, status)')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    const rows = extractData(result, 'outlets.listUserAccess');
    return mapRows(rows ?? []);
  },

  /**
   * Replace all outlet access for a user (atomic delete + insert).
   *
   * @param {{ workspaceId: string, userId: string, rows: Array<{outletId, role}> }} param
   */
  async replaceUserAccess({ workspaceId, userId, rows }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    // Delete existing
    await client
      .from(ACCESS_TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (!rows || rows.length === 0) return [];

    const inserts = rows.map((row) => ({
      workspace_id: workspaceId,
      user_id: userId,
      outlet_id: row.outletId || row.outlet_id,
      role: row.role || 'outlet_manager',
      status: 'active',
    }));
    const result = await client.from(ACCESS_TABLE).insert(inserts).select();
    const inserted = extractData(result, 'outlets.replaceUserAccess');
    return mapRows(inserted ?? []);
  },
};
