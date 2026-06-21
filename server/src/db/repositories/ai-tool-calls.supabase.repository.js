import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'ai_tool_calls';

export const aiToolCallsRepository = {
  async createToolCall({ runId, workspaceId, toolName, input }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        run_id: runId,
        workspace_id: workspaceId,
        tool_name: toolName,
        input: input || {},
        status: 'proposed',
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'aiToolCalls.createToolCall'));
  },

  async completeToolCall({ id, result, latencyMs }) {
    const client = getSupabaseServiceClient();
    const res = await client
      .from(TABLE)
      .update({
        status: 'completed',
        result: result || {},
        latency_ms: latencyMs || null,
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(res, 'aiToolCalls.completeToolCall'));
  },

  async failToolCall({ id, errorCode, latencyMs }) {
    const client = getSupabaseServiceClient();
    const res = await client
      .from(TABLE)
      .update({
        status: 'failed',
        error_code: errorCode || null,
        latency_ms: latencyMs || null,
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(res, 'aiToolCalls.failToolCall'));
  },

  async listByRun({ runId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });
    return mapRows(extractData(result, 'aiToolCalls.listByRun') ?? []);
  },

  async list({ workspaceId, limit = 50, offset = 0 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    return mapRows(extractData(result, 'aiToolCalls.list') ?? []);
  },

  async deleteExpired(olderThanDays = 90) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .lt('created_at', cutoff)
      .select();
    return (extractData(result, 'aiToolCalls.deleteExpired') ?? []).length;
  },
};
