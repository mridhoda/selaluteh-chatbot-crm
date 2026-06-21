import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'conversation_summaries';

export const conversationSummariesRepository = {
  async findLatestValid({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('chat_id', chatId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = extractSingle(result, 'summaries.findLatestValid');
    return row ? mapRow(row) : null;
  },

  async createForRange({ workspaceId, chatId, sessionId, summary, messageRangeStart, messageRangeEnd, messageCount, modelProvider, modelName, tokenCount }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        chat_id: chatId,
        session_id: sessionId || null,
        status: 'active',
        summary,
        message_range_start: messageRangeStart || null,
        message_range_end: messageRangeEnd || null,
        message_count: messageCount || 0,
        model_provider: modelProvider || null,
        model_name: modelName || null,
        token_count: tokenCount || null,
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'summaries.createForRange'));
  },

  async markSuperseded({ workspaceId, chatId, excludeId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client
      .from(TABLE)
      .update({ status: 'superseded', superseded_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('chat_id', chatId)
      .eq('status', 'active');
    if (excludeId) query = query.neq('id', excludeId);
    const result = await query.select();
    return mapRows(extractData(result, 'summaries.markSuperseded') ?? []);
  },

  async listBySession({ sessionId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'summaries.listBySession') ?? []);
  },

  async deleteExpired() {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();
    return (extractData(result, 'summaries.deleteExpired') ?? []).length;
  },
};
