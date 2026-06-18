/**
 * users.repository.js — Supabase-backed
 *
 * Handles user persistence using Supabase/Postgres.
 * Custom backend auth is preserved — no Supabase Auth migration.
 *
 * Contract (per docs/backend/06-data/repository-layer-contract.md):
 *   findByEmail(email) → UserRecord | null
 *   findById(id) → UserRecord | null
 *   findByWorkspace(workspaceId) → UserRecord[]
 *   createUser(input) → UserRecord
 *   setVerified(userId) → void
 *   setStatus(userId, status) → void
 *   updateLastLogin(userId) → void
 *
 * UserRecord shape (camelCase — app layer):
 *   id, workspaceId, name, email, passwordHash, role,
 *   verified, status, plan, planExpiry, lastLoginAt,
 *   metadata, createdAt, updatedAt
 *
 * NOTE: passwordHash is returned to the repository caller only.
 * Services/routes must never expose passwordHash in API responses.
 * The auth service is responsible for stripping passwordHash before returning.
 *
 * DOMAIN STATUS: Supabase-backed (task 24.3 foundation — users domain
 *   will be fully cut over in task 24.7).
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle, assertFound } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'users';

/**
 * @typedef {Object} UserRecord
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} name
 * @property {string} email
 * @property {string|null} passwordHash
 * @property {string} role
 * @property {boolean} verified
 * @property {string} status
 * @property {string} plan
 * @property {string} planExpiry
 * @property {string|null} lastLoginAt
 * @property {object} metadata
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const usersSupabaseRepository = {
  /**
   * Find a user by email (case-insensitive via citext column).
   * Returns null if not found.
   *
   * @param {string} email
   * @returns {Promise<UserRecord|null>}
   */
  async findByEmail(email) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    const row = extractSingle(result, 'users.findByEmail');
    return row ? mapRow(row) : null;
  },

  /**
   * Find a user by their UUID.
   * Returns null if not found.
   *
   * @param {string} id
   * @returns {Promise<UserRecord|null>}
   */
  async findById(id) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('id', id).maybeSingle();
    const row = extractSingle(result, 'users.findById');
    return row ? mapRow(row) : null;
  },

  /**
   * Find a user by UUID — throws 404 if not found.
   *
   * @param {string} id
   * @returns {Promise<UserRecord>}
   */
  async getById(id) {
    const user = await this.findById(id);
    return assertFound(user, 'User');
  },

  /**
   * List all users belonging to a workspace.
   * workspaceId is enforced to prevent cross-workspace data leak.
   *
   * @param {string} workspaceId
   * @returns {Promise<UserRecord[]>}
   */
  async findByWorkspace(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });
    const rows = extractData(result, 'users.findByWorkspace');
    return mapRows(rows ?? []);
  },

  /**
   * Create a new user.
   * Input is camelCase; mapper converts to snake_case for DB insertion.
   *
   * @param {{ workspaceId: string, name: string, email: string, passwordHash: string, role?: string }} input
   * @returns {Promise<UserRecord>}
   */
  async createUser(input) {
    requireWorkspaceId(input.workspaceId);
    const client = getSupabaseServiceClient();

    const row = {
      workspace_id: input.workspaceId,
      name: input.name,
      email: input.email.toLowerCase().trim(),
      password_hash: input.passwordHash ?? null,
      role: input.role ?? 'owner',
      verified: input.verified ?? false,
      status: input.status ?? 'offline',
      plan: input.plan ?? 'pro',
      plan_expiry: input.planExpiry ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: input.metadata ?? {},
    };

    const result = await client.from(TABLE).insert(row).select().single();
    const created = extractSingle(result, 'users.createUser');
    return mapRow(created);
  },

  /**
   * Mark a user as verified (email confirmed).
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async setVerified(userId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ verified: true })
      .eq('id', userId)
      .select()
      .single();
    extractSingle(result, 'users.setVerified');
  },

  /**
   * Update user online/offline status.
   *
   * @param {string} userId
   * @param {'online'|'offline'} status
   * @returns {Promise<void>}
   */
  async setStatus(userId, status) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status })
      .eq('id', userId)
      .select()
      .single();
    extractSingle(result, 'users.setStatus');
  },

  /**
   * Record last login timestamp.
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    const client = getSupabaseServiceClient();
    await client
      .from(TABLE)
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
  },

  /**
   * Update arbitrary user fields.
   * Caller is responsible for only passing safe, allowed fields.
   *
   * @param {string} userId
   * @param {Partial<UserRecord>} updates - camelCase fields
   * @returns {Promise<UserRecord>}
   */
  async updateUser(userId, updates) {
    const client = getSupabaseServiceClient();

    // Explicitly allowed update fields (no role/workspace bypass)
    const allowed = ['name', 'passwordHash', 'plan', 'planExpiry', 'metadata'];
    const row = {};
    for (const key of allowed) {
      if (key in updates) {
        // Convert known camelCase keys to snake_case manually for safety
        const snakeKey = key === 'passwordHash' ? 'password_hash'
          : key === 'planExpiry' ? 'plan_expiry'
          : key;
        row[snakeKey] = updates[key];
      }
    }

    if (Object.keys(row).length === 0) return this.getById(userId);

    const result = await client
      .from(TABLE)
      .update(row)
      .eq('id', userId)
      .select()
      .single();
    const updated = extractSingle(result, 'users.updateUser');
    return mapRow(updated);
  },
};
