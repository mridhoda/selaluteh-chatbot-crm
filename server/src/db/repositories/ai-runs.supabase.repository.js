import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'ai_runs';

export const aiRunsRepository = {
  async createRun({ workspaceId, chatId, sessionId, agentId, agentVersion, inboundMessageId, startReason }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        chat_id: chatId,
        session_id: sessionId || null,
        agent_id: agentId || null,
        agent_version: agentVersion || null,
        status: 'created',
        inbound_message_id: inboundMessageId || null,
        start_reason: startReason || 'customer_message',
        context_metadata: {},
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'aiRuns.createRun'));
  },

  async markRunning({ runId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', runId)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'aiRuns.markRunning'));
  },

  async completeRun({ runId, assistantMessageId, latencyMs, inputTokens, outputTokens, endReason, contextMetadata }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        status: 'completed',
        assistant_message_id: assistantMessageId || null,
        completed_at: new Date().toISOString(),
        latency_ms: latencyMs || null,
        input_tokens: inputTokens || null,
        output_tokens: outputTokens || null,
        end_reason: endReason || 'response_sent',
        context_metadata: contextMetadata || {},
      })
      .eq('id', runId)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'aiRuns.completeRun'));
  },

  async failRun({ runId, errorCode, latencyMs }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        status: 'failed',
        error_code: errorCode || null,
        completed_at: new Date().toISOString(),
        latency_ms: latencyMs || null,
      })
      .eq('id', runId)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'aiRuns.failRun'));
  },

  async findById({ workspaceId, runId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', runId)
      .maybeSingle();
    const row = extractSingle(result, 'aiRuns.findById');
    return row ? mapRow(row) : null;
  },

  async list({ workspaceId, chatId, limit = 50, offset = 0 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (chatId) q = q.eq('chat_id', chatId);
    const result = await q;
    return mapRows(extractData(result, 'aiRuns.list') ?? []);
  },

  async deleteExpired(olderThanDays = 30) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .lt('created_at', cutoff)
      .select();
    return (extractData(result, 'aiRuns.deleteExpired') ?? []).length;
  },
};
