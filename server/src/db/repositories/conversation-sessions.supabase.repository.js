import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle, assertFound } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'conversation_sessions';

export const conversationSessionsRepository = {
  async findActiveByChat({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('chat_id', chatId)
      .eq('status', 'active')
      .maybeSingle();
    const row = extractSingle(result, 'sessions.findActiveByChat');
    return row ? mapRow(row) : null;
  },

  async create({ workspaceId, chatId, agentId, now }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        chat_id: chatId,
        agent_id: agentId || null,
        started_at: now || new Date().toISOString(),
        last_customer_message_at: now || new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'sessions.create'));
  },

  async touchCustomerActivity({ id }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ last_customer_message_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'sessions.touchCustomerActivity'));
  },

  async touchAssistantActivity({ id }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ last_assistant_message_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'sessions.touchAssistantActivity'));
  },

  async close({ id, reason }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        status: `closed_${reason || 'manual'}`,
        closed_at: new Date().toISOString(),
        close_reason: reason || null,
      })
      .eq('id', id)
      .eq('status', 'active')
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'sessions.close'));
  },

  async closeIdleSessions({ workspaceId, thresholdMinutes = 1440 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString();
    const result = await client
      .from(TABLE)
      .update({
        status: 'closed_idle',
        closed_at: new Date().toISOString(),
        close_reason: 'idle_timeout',
      })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .lt('last_customer_message_at', cutoff)
      .select();
    const rows = extractData(result, 'sessions.closeIdleSessions');
    return mapRows(rows ?? []);
  },

  async findById({ workspaceId, sessionId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', sessionId)
      .maybeSingle();
    const row = extractSingle(result, 'sessions.findById');
    return row ? mapRow(row) : null;
  },
};
