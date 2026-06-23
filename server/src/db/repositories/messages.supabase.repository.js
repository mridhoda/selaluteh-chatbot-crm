/**
 * messages.supabase.repository.js — Supabase-backed (task 24.10)
 *
 * Replaces Mongoose Message model.
 *
 * DB table: chat_messages
 *
 * MessageRecord shape (camelCase):
 *   id, workspaceId, chatId, platformId, contactId, senderType,
 *   userId, direction, messageType, content, attachmentFileId,
 *   platformMessageId, rawPayload, createdAt
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';
import { buildPublicFileUrl } from '../../utils/file-urls.js';

const TABLE = 'chat_messages';

function isImageAttachment(attachment = {}, messageType = '') {
  return attachment.type === 'image'
    || messageType === 'image'
    || /\.(png|jpe?g|gif|webp)$/i.test(attachment.filename || attachment.url || '');
}

function normalizeAttachment(attachment, messageType = '') {
  if (!attachment) return null;
  const normalized = { ...attachment };
  if (!normalized.type) normalized.type = isImageAttachment(normalized, messageType) ? 'image' : 'document';
  if (!normalized.url && normalized.storedName) normalized.url = buildPublicFileUrl(normalized.storedName);
  return normalized;
}

function mapMessageRow(row) {
  if (!row) return null;
  const mapped = mapRow(row);
  if (row.users) {
    mapped.users = mapRow(row.users);
    mapped.agentName = row.users.name || '';
  }
  mapped.text = mapped.content || '';
  const rawPayload = mapped.rawPayload || row.raw_payload || {};
  mapped.rawPayload = rawPayload || {};
  mapped.attachment = normalizeAttachment(rawPayload?.attachment || mapped.attachment, mapped.messageType);
  if (mapped.attachment) {
    mapped.rawPayload = { ...mapped.rawPayload, attachment: mapped.attachment };
  }
  return mapped;
}

function mapMessageRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapMessageRow);
}

export const messagesSupabaseRepository = {
  /**
   * Create a new chat message.
   */
  async create(data) {
    const client = getSupabaseServiceClient();
    let platformId = data.platformId;
    let contactId = data.contactId;

    if ((!platformId || !contactId) && data.chatId) {
      const { data: chat } = await client.from('chats').select('platform_id, contact_id').eq('id', data.chatId).single();
      if (chat) {
        platformId ||= chat.platform_id;
        contactId ||= chat.contact_id;
      }
    }

    let senderType = data.senderType || data.sender_type || (data.from === 'user' ? 'customer' : 'ai');
    if (senderType === 'user') senderType = 'customer';
    if (senderType === 'human') senderType = 'admin';

    const rawPayload = data.rawPayload || data.raw_payload || (data.attachment ? { attachment: data.attachment } : {});
    if (rawPayload?.attachment) {
      rawPayload.attachment = normalizeAttachment(rawPayload.attachment, data.messageType || data.message_type);
    }

    const insert = {
      workspace_id: data.workspaceId,
      chat_id: data.chatId,
      platform_id: platformId,
      contact_id: contactId,
      sender_type: senderType,
      user_id: data.userId || null,
      direction: data.direction || (data.from === 'user' ? 'inbound' : 'outbound'),
      message_type: data.messageType || data.message_type || 'text',
      content: data.content || data.text || null,
      attachment_file_id: data.attachmentFileId || null,
      platform_message_id: data.platformMessageId || null,
      raw_payload: rawPayload || {},
    };
    const result = await client.from(TABLE).insert(insert).select('*, users:user_id(id, name)').single();
    const row = extractSingle(result, 'messages.create');
    return mapMessageRow(row);
  },

  /**
   * Create a message only if platformMessageId doesn't already exist.
   * Used for idempotent inbound message processing.
   */
  async createIfNotExists(workspaceId, platformMessageId, data) {
    if (!platformMessageId) return this.create(data);
    const client = getSupabaseServiceClient();
    // Check if exists
    const existing = await this.findByPlatformId(workspaceId, platformMessageId);
    if (existing) return existing;
    return this.create({ ...data, workspaceId, platformMessageId });
  },

  /**
   * Find a message by workspace + platform message ID.
   */
  async findByPlatformId(workspaceId, platformMessageId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, users:user_id(id, name)')
      .eq('workspace_id', workspaceId)
      .eq('platform_message_id', platformMessageId)
      .maybeSingle();
    const row = extractSingle(result, 'messages.findByPlatformId');
    return row ? mapMessageRow(row) : null;
  },

  /**
   * List messages for a chat, sorted oldest-first.
   */
  async listByChatId(chatId, { limit = 500 } = {}) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, users:user_id(id, name)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(limit);
    const rows = extractData(result, 'messages.listByChatId');
    return mapMessageRows(rows ?? []);
  },

  /**
   * Get the latest message for a chat.
   */
  async findLatestByChatId(chatId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, users:user_id(id, name)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = extractSingle(result, 'messages.findLatestByChatId');
    return row ? mapMessageRow(row) : null;
  },

  /**
   * Find a message by ID.
   */
  async findById(messageId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, users:user_id(id, name)')
      .eq('id', messageId)
      .maybeSingle();
    const row = extractSingle(result, 'messages.findById');
    return row ? mapMessageRow(row) : null;
  },

  /**
   * Update platform_message_id for a message (after send confirmation).
   */
  async updatePlatformMessageId(messageId, platformMessageId) {
    const client = getSupabaseServiceClient();
    await client
      .from(TABLE)
      .update({ platform_message_id: platformMessageId })
      .eq('id', messageId);
  },
};
