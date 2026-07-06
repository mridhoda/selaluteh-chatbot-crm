/**
 * agents.supabase.repository.js — Supabase-backed
 *
 * Replaces Mongoose Agent + Knowledge models.
 * DB tables: agents, agent_outlets
 *
 * Agents store complex config (knowledge, followUps, database, etc.)
 * as JSONB columns in Postgres — direct JSON storage, no embedding.
 *
 * AgentRecord shape (camelCase):
 *   id, workspaceId, platformId, name, behavior, prompt, welcomeMessage,
 *   stickerUrl, tools, knowledge, followUps, database, complaintFields,
 *   complaintNotification, salesForms, payment, status, metadata,
 *   createdAt, updatedAt
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'agents';

function mapAgentRow(row) {
  if (!row) return null;
  const mapped = mapRow(row);
  if (mapped.metadata?.aiSettings) mapped.aiSettings = mapped.metadata.aiSettings;
  if (mapped.metadata?.outlets) mapped.outlets = mapped.metadata.outlets;
  return mapped;
}

export const agentsSupabaseRepository = {
  /**
   * List all agents in a workspace.
   */
  async list({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    return (extractData(result, 'agents.list') ?? []).map(mapAgentRow);
  },

  /**
   * Find agent by workspace + agent ID.
   */
  async findById({ workspaceId, agentId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', agentId)
      .maybeSingle();
    const row = extractSingle(result, 'agents.findById');
    if (!row) return null;
    return mapAgentRow(row);
  },

  /**
   * Find agent without workspace scope (for internal webhook processing).
   */
  async findByIdRaw(agentId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('id', agentId)
      .maybeSingle();
    const row = extractSingle(result, 'agents.findByIdRaw');
    if (!row) return null;
    return mapAgentRow(row);
  },

  /**
   * Create a new agent. Complex fields stored as JSONB.
   */
  async create({ workspaceId, name, platformId, channelConnectionId, prompt, behavior, welcomeMessage,
    stickerUrl, knowledge, followUps, database, complaintFields, complaintNotification,
    salesForms, payment, outlets, status = 'active', metadata = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: workspaceId,
      platform_id: platformId || null,
      channel_connection_id: channelConnectionId || null,
      name,
      behavior: behavior || '',
      prompt: prompt || '',
      welcome_message: welcomeMessage || 'Halo! Ada yang bisa saya bantu?',
      sticker_url: stickerUrl || null,
      tools: [],
      knowledge: Array.isArray(knowledge) ? knowledge : [],
      follow_ups: Array.isArray(followUps) ? followUps : [],
      database: Array.isArray(database) ? database : [],
      complaint_fields: Array.isArray(complaintFields) ? complaintFields : [],
      complaint_notification: complaintNotification || {},
      sales_forms: Array.isArray(salesForms) ? salesForms : [],
      payment: payment || {},
      status,
      metadata,
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'agents.create'));
  },

  /**
   * Update agent fields. Supports full or partial updates.
   * NOTE: aiSettings is stored inside metadata.aiSettings until the
   * ai_settings column migration is applied to the database.
   */
  async update({ workspaceId, agentId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const set = {};
    const fieldMap = {
      name: 'name', behavior: 'behavior', prompt: 'prompt',
      welcomeMessage: 'welcome_message', stickerUrl: 'sticker_url',
      tools: 'tools', knowledge: 'knowledge', followUps: 'follow_ups',
      database: 'database', complaintFields: 'complaint_fields',
      complaintNotification: 'complaint_notification', salesForms: 'sales_forms',
      payment: 'payment', status: 'status',
      platformId: 'platform_id',
      channelConnectionId: 'channel_connection_id',
    };
    for (const [k, v] of Object.entries(updates)) {
      if (fieldMap[k] !== undefined) set[fieldMap[k]] = v;
    }

    // Store aiSettings & outlets inside metadata until dedicated columns are migrated
    if (updates.aiSettings !== undefined || updates.metadata !== undefined || updates.outlets !== undefined) {
      const current = await client
        .from(TABLE)
        .select('metadata')
        .eq('workspace_id', workspaceId)
        .eq('id', agentId)
        .maybeSingle();
      const existingMeta = current?.data?.metadata || {};
      if (updates.aiSettings !== undefined && updates.outlets !== undefined) {
        set.metadata = { ...existingMeta, aiSettings: updates.aiSettings, outlets: updates.outlets };
      } else if (updates.aiSettings !== undefined) {
        set.metadata = { ...existingMeta, aiSettings: updates.aiSettings };
      } else if (updates.outlets !== undefined) {
        set.metadata = { ...existingMeta, outlets: updates.outlets };
      } else {
        set.metadata = { ...existingMeta, ...updates.metadata };
      }
    }

    const result = await client
      .from(TABLE)
      .update(set)
      .eq('workspace_id', workspaceId)
      .eq('id', agentId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'agents.update');
    if (!row) return null;
    return mapAgentRow(row);
  },

  /**
   * Delete an agent.
   */
  async deleteById({ workspaceId, agentId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client.from(TABLE).delete().eq('workspace_id', workspaceId).eq('id', agentId);
  },
};
