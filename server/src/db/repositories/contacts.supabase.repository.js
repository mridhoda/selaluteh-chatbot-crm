/**
 * contacts.supabase.repository.js — Supabase-backed (task 24.10)
 *
 * Replaces Mongoose Contact model.
 *
 * DB table: contacts
 * Unique constraint: (workspace_id, platform_id, external_id)
 *
 * ContactRecord shape (camelCase):
 *   id, workspaceId, platformId, externalId, name, phone, email, handle,
 *   tags, lastOutletId, metadata, createdAt, updatedAt
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';

const TABLE = 'contacts';

function mapContactRow(row) {
  if (!row) return null;
  const mapped = mapRow(row);
  mapped.platformAccountId = mapped.externalId;
  return mapped;
}

function mapContactRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapContactRow);
}

export const contactsSupabaseRepository = {
  /**
   * List contacts with optional search/tags filter.
   */
  async list({ workspaceId, search, tags, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (search) {
      q = q.or(`name.ilike.%${search}%,handle.ilike.%${search}%,external_id.ilike.%${search}%`);
    }
    if (tags && tags.length > 0) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      q = q.overlaps('tags', tagList);
    }
    q = applyPagination(q, { page, limit });
    const result = await q;
    const rows = extractData(result, 'contacts.list');
    return mapContactRows(rows ?? []);
  },

  /**
   * Count contacts with optional search/tags filter.
   */
  async count({ workspaceId, search, tags }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (search) {
      q = q.or(`name.ilike.%${search}%,handle.ilike.%${search}%`);
    }
    if (tags && tags.length > 0) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      q = q.overlaps('tags', tagList);
    }
    const result = await q;
    if (result.error) return 0;
    return result.count ?? 0;
  },

  /**
   * Find a contact by workspace + contact ID.
   */
  async findById({ workspaceId, contactId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', contactId)
      .maybeSingle();
    const row = extractSingle(result, 'contacts.findById');
    return row ? mapContactRow(row) : null;
  },

  /**
   * Update contact fields.
   */
  async update({ workspaceId, contactId, updates }) {
    requireWorkspaceId(workspaceId);
    const allowed = ['name', 'handle', 'tags', 'phone', 'email', 'metadata'];
    const set = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) set[key] = updates[key];
    }
    if (updates.lastOutletId !== undefined) set.last_outlet_id = updates.lastOutletId;
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update(set)
      .eq('workspace_id', workspaceId)
      .eq('id', contactId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'contacts.update');
    return row ? mapContactRow(row) : null;
  },

  /**
   * Upsert a contact by platform identity (workspace_id + platform_id + external_id).
   * Uses ON CONFLICT to update name/handle/lastSeen if they change.
   *
   * @param {string} workspaceId
   * @param {string} platformId - UUID of the platform
   * @param {string} externalId - Platform-specific account ID
   * @param {object} data - { name, handle, phone, tags, metadata }
   */
  async upsertByProviderIdentity(workspaceId, platformId, externalId, data = {}) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const base = {
      workspace_id: workspaceId,
      platform_id: platformId,
      external_id: externalId,
      name: data.name || '',
      handle: data.handle || null,
      phone: data.phone || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
    };
    const result = await client
      .from(TABLE)
      .upsert(base, { onConflict: 'workspace_id,platform_id,external_id', ignoreDuplicates: false })
      .select()
      .single();
    const row = extractSingle(result, 'contacts.upsertByProviderIdentity');
    return mapContactRow(row);
  },

  /**
   * Upsert a contact identity scoped to an exact channel connection.
   * Used by multi-tenant Telegram routing where the same Telegram user can
   * talk to multiple bots and must remain isolated per connection.
   */
  async upsertByChannelIdentity({ workspaceId, channelConnectionId, providerUserId, platformId = null, data = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const base = {
      workspace_id: workspaceId,
      channel_connection_id: channelConnectionId,
      platform_id: platformId,
      external_id: providerUserId,
      name: data.name || '',
      handle: data.handle || null,
      phone: data.phone || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
    };

    if (platformId) {
      const existingResult = await client
        .from(TABLE)
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform_id', platformId)
        .eq('external_id', providerUserId)
        .maybeSingle();
      const existing = extractSingle(existingResult, 'contacts.upsertByChannelIdentity.findLegacy');
      if (existing) {
        const updateResult = await client
          .from(TABLE)
          .update({
            channel_connection_id: channelConnectionId,
            name: base.name,
            handle: base.handle,
            phone: base.phone,
            tags: base.tags,
            metadata: { ...(existing.metadata || {}), ...(base.metadata || {}) },
          })
          .eq('id', existing.id)
          .select()
          .single();
        const updated = extractSingle(updateResult, 'contacts.upsertByChannelIdentity.updateLegacy');
        return mapContactRow(updated);
      }
    }

    const result = await client
      .from(TABLE)
      .upsert(base, { onConflict: 'channel_connection_id,external_id', ignoreDuplicates: false })
      .select()
      .single();
    const row = extractSingle(result, 'contacts.upsertByChannelIdentity');
    return mapContactRow(row);
  },

  /**
   * Set the last outlet for a contact (for routing context).
   */
  async setLastOutlet(contactId, outletId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ last_outlet_id: outletId })
      .eq('id', contactId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'contacts.setLastOutlet');
    return row ? mapContactRow(row) : null;
  },
};
