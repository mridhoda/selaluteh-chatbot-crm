/**
 * workspaces.repository.js — Supabase-backed
 *
 * Handles workspace and workspace_settings persistence using Supabase/Postgres.
 *
 * Contract (per docs/backend/06-data/repository-layer-contract.md):
 *   findById(workspaceId) → WorkspaceRecord | null
 *   create(input) → WorkspaceRecord
 *   update(workspaceId, updates) → WorkspaceRecord
 *   getSettings(workspaceId) → WorkspaceSettingsRecord | null
 *   upsertSettings(workspaceId, updates) → WorkspaceSettingsRecord
 *
 * SECURITY: Workspace secrets (payment provider credentials, AI keys) are stored in
 * workspace_settings.metadata and must be redacted in API responses.
 * The service layer is responsible for redacting secrets before returning to routes.
 *
 * DOMAIN STATUS: Supabase-backed (task 24.3 foundation — workspaces domain
 *   will be fully cut over in task 24.7).
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractData, extractSingle, assertFound } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'workspaces';
const SETTINGS_TABLE = 'workspace_settings';

/**
 * @typedef {Object} WorkspaceRecord
 * @property {string} id
 * @property {string} name
 * @property {string|null} ownerUserId
 * @property {string} status
 * @property {object} metadata
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} WorkspaceSettingsRecord
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} businessDisplayName
 * @property {string} timezone
 * @property {string} currency
 * @property {string} locale
 * @property {string|null} supportContactEmail
 * @property {string|null} defaultOutletId
 * @property {boolean} allowAllOutletsView
 * @property {string} primaryAi
 * @property {string} secondaryAi
 * @property {string} defaultLanguage
 * @property {boolean} aiCommerceEnabled
 * @property {boolean} requireCheckoutConfirmation
 * @property {boolean} humanHandoffEnabled
 * @property {object} metadata
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const workspacesSupabaseRepository = {
  /**
   * Find a workspace by its UUID.
   * Returns null if not found.
   *
   * @param {string} workspaceId
   * @returns {Promise<WorkspaceRecord|null>}
   */
  async findById(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('id', workspaceId).maybeSingle();
    const row = extractSingle(result, 'workspaces.findById');
    return row ? mapRow(row) : null;
  },

  /**
   * Find a workspace by its UUID — throws 404 if not found.
   *
   * @param {string} workspaceId
   * @returns {Promise<WorkspaceRecord>}
   */
  async getById(workspaceId) {
    const workspace = await this.findById(workspaceId);
    return assertFound(workspace, 'Workspace');
  },

  /**
   * Create a new workspace.
   *
   * @param {{ name: string, ownerUserId?: string }} input
   * @returns {Promise<WorkspaceRecord>}
   */
  async create(input) {
    const client = getSupabaseServiceClient();
    const row = {
      name: input.name,
      owner_user_id: input.ownerUserId ?? null,
      status: input.status ?? 'active',
      metadata: input.metadata ?? {},
    };
    const result = await client.from(TABLE).insert(row).select().single();
    const created = extractSingle(result, 'workspaces.create');
    return mapRow(created);
  },

  /**
   * Update workspace fields.
   *
   * @param {string} workspaceId
   * @param {{ name?: string, status?: string, ownerUserId?: string, metadata?: object }} updates
   * @returns {Promise<WorkspaceRecord>}
   */
  async update(workspaceId, updates) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();

    const row = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.ownerUserId !== undefined) row.owner_user_id = updates.ownerUserId;
    if (updates.metadata !== undefined) row.metadata = updates.metadata;

    const result = await client
      .from(TABLE)
      .update(row)
      .eq('id', workspaceId)
      .select()
      .single();
    const updated = extractSingle(result, 'workspaces.update');
    return mapRow(updated);
  },

  /**
   * Get workspace settings.
   * Returns null if no settings row exists yet.
   *
   * @param {string} workspaceId
   * @returns {Promise<WorkspaceSettingsRecord|null>}
   */
  async getSettings(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    const row = extractSingle(result, 'workspaces.getSettings');
    return row ? mapRow(row) : null;
  },

  /**
   * Create or update workspace settings (upsert by workspace_id).
   *
   * NOTE: metadata in settings may contain sensitive operational keys.
   * Service layer must redact secrets before returning to routes.
   *
   * @param {string} workspaceId
   * @param {Partial<WorkspaceSettingsRecord>} updates - camelCase fields
   * @returns {Promise<WorkspaceSettingsRecord>}
   */
  async upsertSettings(workspaceId, updates) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();

    // Map camelCase fields to snake_case explicitly (safe subset only)
    const row = { workspace_id: workspaceId };
    const fieldMap = {
      businessDisplayName: 'business_display_name',
      timezone: 'timezone',
      currency: 'currency',
      locale: 'locale',
      supportContactEmail: 'support_contact_email',
      defaultOutletId: 'default_outlet_id',
      allowAllOutletsView: 'allow_all_outlets_view',
      primaryAi: 'primary_ai',
      secondaryAi: 'secondary_ai',
      defaultLanguage: 'default_language',
      aiCommerceEnabled: 'ai_commerce_enabled',
      requireCheckoutConfirmation: 'require_checkout_confirmation',
      humanHandoffEnabled: 'human_handoff_enabled',
      metadata: 'metadata',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (camel in updates) row[snake] = updates[camel];
    }

    const result = await client
      .from(SETTINGS_TABLE)
      .upsert(row, { onConflict: 'workspace_id' })
      .select()
      .single();
    const upserted = extractSingle(result, 'workspaces.upsertSettings');
    return mapRow(upserted);
  },
};
