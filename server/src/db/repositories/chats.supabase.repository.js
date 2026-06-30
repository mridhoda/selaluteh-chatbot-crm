/**
 * chats.supabase.repository.js — Supabase-backed (task 24.10)
 *
 * Replaces Mongoose Chat model.
 *
 * DB table: chats
 * Unique: (workspace_id, platform_id, contact_id)
 *
 * ChatRecord shape (camelCase):
 *   id, workspaceId, platformId, contactId, currentOutletId, status,
 *   aiEnabled, isBlocked, isEscalated, takenOverByUserId, assignedAt,
 *   resolvedAt, lastMessageAt, unread, state, metadata, createdAt, updatedAt
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';
import { decrypt } from '../../utils/encryption.js';

const TABLE = 'chats';

function mapChatRow(row) {
  if (!row) return null;
  const mapped = mapRow(row);
  mapped.unread = row.metadata?.unread ?? 0;

  if (row.contacts) {
    mapped.contacts = mapRow(row.contacts);
    mapped.contactName = row.contacts.name || '';
    mapped.platformAccountId = row.contacts.external_id || '';
  }
  if (row.platforms) {
    mapped.platforms = mapRow(row.platforms);
    mapped.platforms.token = row.platforms.token_encrypted ? decrypt(row.platforms.token_encrypted) : '';
    mapped.platform = row.platforms.type || '';
    mapped.outletName = row.platforms.label || '';
  }
  if (row.channel_connections) {
    mapped.channelConnections = mapRow(row.channel_connections);
  }
  if (row.outlets) {
    mapped.outlets = mapRow(row.outlets);
    mapped.outletName = row.outlets.name || mapped.outletName || '';
  }
  if (row.taken_over_by) {
    mapped.takenOverBy = mapRow(row.taken_over_by);
    mapped.takenOverByName = row.taken_over_by.name || '';
  }
  return mapped;
}

function mapChatRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapChatRow);
}

export const chatsSupabaseRepository = {
  /**
   * List chats for a workspace with optional filters.
   * Supports: status, takenOverByUserId, assigned, unassigned, isEscalated, dateFrom, dateTo.
   */
  async list({ workspaceId, status, takenOverByUserId, assigned, unassigned, isEscalated, dateFrom, dateTo, limit = 200 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client
      .from(TABLE)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false })
      .limit(limit);
    if (status) q = q.eq('status', status);
    if (takenOverByUserId) q = q.eq('taken_over_by_user_id', takenOverByUserId);
    if (assigned) q = q.not('taken_over_by_user_id', 'is', null);
    if (unassigned) q = q.is('taken_over_by_user_id', null);
    if (isEscalated !== undefined) q = q.eq('is_escalated', isEscalated);
    if (dateFrom) q = q.gte('last_message_at', dateFrom);
    if (dateTo) q = q.lte('last_message_at', dateTo);
    const result = await q;
    const rows = extractData(result, 'chats.list');
    return mapChatRows(rows ?? []);
  },

  /**
   * Find all chat IDs in a workspace (for access control / order queries).
   * Returns [{ id }] objects.
   */
  async findWorkspaceChatIds(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('id')
      .eq('workspace_id', workspaceId);
    const rows = extractData(result, 'chats.findWorkspaceChatIds');
    return (rows ?? []).map((r) => ({ id: r.id, _id: r.id }));
  },

  /**
   * Find a chat by ID with platform and contact joined.
   */
  async findByIdWithPlatformAndContact(chatId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, contacts(*), platforms(*), channel_connections(*), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .eq('id', chatId)
      .maybeSingle();
    const row = extractSingle(result, 'chats.findByIdWithPlatformAndContact');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Find a chat by workspace + ID (with joins).
   */
  async findById({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .eq('workspace_id', workspaceId)
      .eq('id', chatId)
      .maybeSingle();
    const row = extractSingle(result, 'chats.findById');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Upsert a chat by platform + contact identity.
   */
  async upsertByPlatformContact({ workspaceId, platformId, contactId, data = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const cleanData = { ...data };
    delete cleanData.agent_id;
    delete cleanData.agentId;
    const base = {
      workspace_id: workspaceId,
      platform_id: platformId,
      contact_id: contactId,
      ...cleanData,
    };
    const result = await client
      .from(TABLE)
      .upsert(base, { onConflict: 'workspace_id,platform_id,contact_id', ignoreDuplicates: false })
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .single();
    const row = extractSingle(result, 'chats.upsertByPlatformContact');
    return mapChatRow(row);
  },

  /**
   * Upsert a chat/conversation scoped to a channel connection and provider
   * conversation id. This is the canonical Telegram multi-tenant key.
   */
  async upsertByChannelConversation({ workspaceId, channelConnectionId, providerConversationId, contactId, platformId = null, data = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const cleanData = { ...data };
    delete cleanData.agent_id;
    delete cleanData.agentId;
    const base = {
      workspace_id: workspaceId,
      channel_connection_id: channelConnectionId,
      provider_conversation_id: providerConversationId,
      platform_id: platformId,
      contact_id: contactId,
      ...cleanData,
    };
    const result = await client
      .from(TABLE)
      .upsert(base, { onConflict: 'channel_connection_id,provider_conversation_id', ignoreDuplicates: false })
      .select('*, contacts(*), platforms(id, type, label), channel_connections(*), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .single();
    const row = extractSingle(result, 'chats.upsertByChannelConversation');
    return mapChatRow(row);
  },

  async findByIdWithConnectionAndContact({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, contacts(*), platforms(id, type, label), channel_connections(*), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .eq('workspace_id', workspaceId)
      .eq('id', chatId)
      .maybeSingle();
    const row = extractSingle(result, 'chats.findByIdWithConnectionAndContact');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Mark inbound activity (increment unread, update lastMessageAt, open).
   */
  async markInboundActivity(chatId) {
    const client = getSupabaseServiceClient();
    const { data: chat } = await client.from(TABLE).select('metadata').eq('id', chatId).single();
    const metadata = chat?.metadata ?? {};
    const unread = (metadata.unread ?? 0) + 1;
    const newMetadata = { ...metadata, unread };
    const result = await client
      .from(TABLE)
      .update({ last_message_at: new Date().toISOString(), status: 'open', is_escalated: false, metadata: newMetadata })
      .eq('id', chatId)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .maybeSingle();
    const row = extractSingle(result, 'chats.markInboundActivity');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Set the current outlet for a chat.
   */
  async setCurrentOutlet(chatId, outletId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ current_outlet_id: outletId })
      .eq('id', chatId)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .maybeSingle();
    const row = extractSingle(result, 'chats.setCurrentOutlet');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Mark a chat as read (reset unread counter).
   */
  async markRead({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const { data: chat } = await client
      .from(TABLE)
      .select('metadata')
      .eq('workspace_id', workspaceId)
      .eq('id', chatId)
      .single();
    const metadata = chat?.metadata ?? {};
    const newMetadata = { ...metadata, unread: 0 };
    await client
      .from(TABLE)
      .update({ metadata: newMetadata })
      .eq('workspace_id', workspaceId)
      .eq('id', chatId);
  },

  /**
   * Acquire human takeover — set taken_over_by_user_id.
   */
  async acquireTakeover({ chatId, userId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ taken_over_by_user_id: userId, assigned_at: new Date().toISOString(), ai_enabled: false })
      .eq('id', chatId)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .maybeSingle();
    const row = extractSingle(result, 'chats.acquireTakeover');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Release human takeover — clear taken_over_by_user_id.
   */
  async releaseTakeover({ chatId, userId }) {
    const client = getSupabaseServiceClient();
    // Only release if the user matches
    const result = await client
      .from(TABLE)
      .update({ taken_over_by_user_id: null, assigned_at: null, ai_enabled: true })
      .eq('id', chatId)
      .eq('taken_over_by_user_id', userId)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .maybeSingle();
    const row = extractSingle(result, 'chats.releaseTakeover');
    return row ? mapChatRow(row) : null;
  },

  /**
   * Delete a chat and cascade (FK cascade handles messages).
   */
  async deleteById({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client
      .from(TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('id', chatId);
  },

  /**
   * Update a chat.
   */
  async update({ chatId, updates }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update(updates)
      .eq('id', chatId)
      .select('*, contacts(*), platforms(id, type, label), outlets(id, name), taken_over_by:users!taken_over_by_user_id(id, name)')
      .maybeSingle();
    const row = extractSingle(result, 'chats.update');
    return row ? mapChatRow(row) : null;
  },
};
