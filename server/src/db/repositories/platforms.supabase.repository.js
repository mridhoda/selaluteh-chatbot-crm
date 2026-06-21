/**
 * platforms.repository.js — Supabase-backed (task 24.9)
 *
 * Replaces Mongoose Platform model.
 * Credentials (token, appSecret, webhookSecret) are stored encrypted in Postgres.
 *
 * DB table: platforms
 * Columns: id, workspace_id, type, label, status, health, account_id, bot_id,
 *          phone_number_id, page_id, app_id, token_encrypted, app_secret_encrypted,
 *          credentials_encrypted, webhook_configured, webhook_secret_encrypted,
 *          enabled, last_event_at, agent_id, metadata, created_at, updated_at
 *
 * PlatformRecord shape (camelCase — sanitized, no credentials):
 *   id, workspaceId, type, label, status, health, accountId, botId,
 *   phoneNumberId, pageId, appId, webhookConfigured, enabled,
 *   lastEventAt, agentId, metadata, createdAt, updatedAt
 *   token: 'configured' | '' (never the actual value in API responses)
 *
 * SECURITY: Credentials never leave the backend plaintext.
 * The encrypt/decrypt helpers from utils/encryption.js are used.
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const TABLE = 'platforms';

const CREDENTIAL_FIELDS = ['token', 'appSecret', 'webhookSecret'];

/**
 * Map raw Postgres row to camelCase and sanitize credentials for API output.
 * Credentials replaced with 'configured' if set.
 */
function mapAndSanitize(row) {
  if (!row) return null;
  const obj = mapRow(row);
  // Sanitize — show presence only
  if (obj.tokenEncrypted) { obj.token = 'configured'; }
  if (obj.appSecretEncrypted) { obj.appSecret = 'configured'; }
  if (obj.webhookSecretEncrypted) { obj.webhookSecret = 'configured'; }

  // Virtual credentials object for frontend backward compatibility
  obj.credentials = {
    phoneNumberId: obj.phoneNumberId || '',
    pageId: obj.pageId || '',
    accessToken: obj.tokenEncrypted ? 'configured' : '',
    webhookVerifyToken: obj.webhookSecretEncrypted ? 'configured' : '',
  };

  // Remove raw encrypted fields from output
  delete obj.tokenEncrypted;
  delete obj.appSecretEncrypted;
  delete obj.credentialsEncrypted;
  delete obj.webhookSecretEncrypted;
  return obj;
}

/**
 * Map raw row to camelCase WITH decrypted credentials (for internal use).
 */
function mapWithCredentials(row) {
  if (!row) return null;
  const obj = mapRow(row);
  if (obj.tokenEncrypted) {
    try { obj.token = decrypt(obj.tokenEncrypted); } catch { obj.token = ''; }
  }
  if (obj.appSecretEncrypted) {
    try { obj.appSecret = decrypt(obj.appSecretEncrypted); } catch { obj.appSecret = ''; }
  }
  if (obj.webhookSecretEncrypted) {
    try { obj.webhookSecret = decrypt(obj.webhookSecretEncrypted); } catch { obj.webhookSecret = ''; }
  }

  // Virtual credentials object for compatibility
  obj.credentials = {
    phoneNumberId: obj.phoneNumberId || '',
    pageId: obj.pageId || '',
    accessToken: obj.token || '',
    webhookVerifyToken: obj.webhookSecret || '',
  };

  delete obj.tokenEncrypted;
  delete obj.appSecretEncrypted;
  delete obj.credentialsEncrypted;
  delete obj.webhookSecretEncrypted;
  return obj;
}

export const platformsSupabaseRepository = {
  /**
   * List all platforms for a workspace (sanitized — no raw credentials).
   */
  async list({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    const rows = extractData(result, 'platforms.list');
    return (rows ?? []).map(mapAndSanitize);
  },

  /**
   * Find a single platform by ID (sanitized).
   */
  async findById({ workspaceId, platformId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', platformId)
      .maybeSingle();
    const row = extractSingle(result, 'platforms.findById');
    return row ? mapAndSanitize(row) : null;
  },

  /**
   * Find a platform with decrypted credentials (for webhook/message sending).
   * NEVER expose the return value of this function to HTTP responses.
   */
  async findByIdWithCredentials({ workspaceId, platformId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', platformId)
      .maybeSingle();
    const row = extractSingle(result, 'platforms.findByIdWithCredentials');
    return row ? mapWithCredentials(row) : null;
  },

  /**
   * Create a new platform. Credentials are encrypted before storage.
   */
  async create({ workspaceId, userId, payload }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const data = { ...payload };

    // Support nested credentials object sent by frontend
    if (data.credentials) {
      if (data.credentials.phoneNumberId) data.phoneNumberId = data.credentials.phoneNumberId;
      if (data.credentials.pageId) data.pageId = data.credentials.pageId;
      if (data.credentials.accessToken) data.token = data.credentials.accessToken;
      if (data.credentials.webhookVerifyToken) data.webhookSecret = data.credentials.webhookVerifyToken;
    }

    const insert = {
      workspace_id: workspaceId,
      type: data.type,
      label: data.label,
      status: data.status || 'pending_setup',
      health: data.health || 'not_configured',
      account_id: data.accountId || data.account_id || null,
      bot_id: data.botId || data.bot_id || null,
      phone_number_id: data.phoneNumberId || data.phone_number_id || null,
      page_id: data.pageId || data.page_id || null,
      app_id: data.appId || data.app_id || null,
      webhook_configured: data.webhookConfigured ?? false,
      enabled: data.enabled ?? true,
      agent_id: data.agentId || data.agent_id || null,
      metadata: data.metadata || {},
    };

    if (data.token) insert.token_encrypted = encrypt(data.token);
    if (data.appSecret) insert.app_secret_encrypted = encrypt(data.appSecret);
    if (data.webhookSecret) insert.webhook_secret_encrypted = encrypt(data.webhookSecret);

    const result = await client.from(TABLE).insert(insert).select().single();
    const row = extractSingle(result, 'platforms.create');
    return mapAndSanitize(row);
  },

  /**
   * Update platform fields. Credentials re-encrypted if provided.
   */
  async update({ workspaceId, platformId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const data = { ...updates };

    // Support nested credentials object sent by frontend
    if (data.credentials) {
      if (data.credentials.phoneNumberId) data.phoneNumberId = data.credentials.phoneNumberId;
      if (data.credentials.pageId) data.pageId = data.credentials.pageId;
      if (data.credentials.accessToken) data.token = data.credentials.accessToken;
      if (data.credentials.webhookVerifyToken) data.webhookSecret = data.credentials.webhookVerifyToken;
      delete data.credentials;
    }

    const set = {};
    const skip = new Set(['id', 'workspaceId', 'workspace_id', 'createdAt', 'created_at']);

    for (const [key, value] of Object.entries(data)) {
      if (skip.has(key)) continue;
      if (key === 'token' && value) { set.token_encrypted = encrypt(value); continue; }
      if (key === 'appSecret' && value) { set.app_secret_encrypted = encrypt(value); continue; }
      if (key === 'webhookSecret' && value) { set.webhook_secret_encrypted = encrypt(value); continue; }
      // camelCase → snake_case for known fields
      const mapped = {
        accountId: 'account_id', botId: 'bot_id', phoneNumberId: 'phone_number_id',
        pageId: 'page_id', appId: 'app_id', webhookConfigured: 'webhook_configured',
        lastEventAt: 'last_event_at', agentId: 'agent_id',
      }[key];
      set[mapped ?? key] = value;
    }

    const result = await client
      .from(TABLE)
      .update(set)
      .eq('workspace_id', workspaceId)
      .eq('id', platformId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'platforms.update');
    return row ? mapAndSanitize(row) : null;
  },

  /**
   * Delete a platform.
   */
  async remove({ workspaceId, platformId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('id', platformId);
    return !result.error;
  },

  /**
   * Update platform health status (for webhook processing).
   */
  async updateHealth({ workspaceId, platformId, health, lastEventAt }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const set = { health };
    if (lastEventAt) set.last_event_at = lastEventAt;
    const result = await client
      .from(TABLE)
      .update(set)
      .eq('workspace_id', workspaceId)
      .eq('id', platformId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'platforms.updateHealth');
    return row ? mapAndSanitize(row) : null;
  },

  /**
   * Find a platform by decrypted token value.
   * Used by webhook handlers to look up the platform from an inbound request token.
   * SECURITY: Returns full credentials since this is internal use only.
   */
  async findByToken({ type, token }) {
    const client = getSupabaseServiceClient();
    // Must fetch all platforms of this type and compare decrypted tokens
    // (tokens are stored encrypted — we can't query by encrypted value directly)
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('type', type);
    const rows = extractData(result, 'platforms.findByToken') ?? [];
    for (const row of rows) {
      let decrypted = '';
      try { decrypted = row.token_encrypted ? decrypt(row.token_encrypted) : ''; } catch { /* skip */ }
      if (decrypted === token) return mapWithCredentials(row);
    }
    return null;
  },

  /**
   * Find the most recently created platform of a given type (any workspace).
   * Used when no token param is provided — fallback to latest telegram bot.
   * Returns with decrypted credentials for internal webhook use.
   */
  async findLatestByType({ type }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = extractSingle(result, 'platforms.findLatestByType');
    return row ? mapWithCredentials(row) : null;
  },

  /**
   * Find a platform by accountId and type (for Meta/WA/IG webhook lookup).
   * accountId is stored plaintext in the account_id column.
   * Returns with decrypted credentials for internal webhook use.
   */
  async findByAccountId({ accountId, type }) {
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('account_id', accountId);
    if (type) q = q.eq('type', type);
    const result = await q.maybeSingle();
    const row = extractSingle(result, 'platforms.findByAccountId');
    return row ? mapWithCredentials(row) : null;
  },

  /**
   * Find a platform by phone_number_id and type (fallback lookup).
   * Returns with decrypted credentials for internal webhook use.
   */
  async findByPhoneNumberId({ phoneNumberId, type }) {
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('phone_number_id', phoneNumberId);
    if (type) q = q.eq('type', type);
    const result = await q.maybeSingle();
    const row = extractSingle(result, 'platforms.findByPhoneNumberId');
    return row ? mapWithCredentials(row) : null;
  },
};
