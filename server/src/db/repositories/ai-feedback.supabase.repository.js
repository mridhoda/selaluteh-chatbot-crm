import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'ai_feedback';

export const aiFeedbackRepository = {
  async create({ workspaceId, runId, rating, reasonCode, comment, reviewedBy }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        run_id: runId,
        rating: rating || null,
        reason_code: reasonCode || null,
        comment: comment || null,
        reviewed_by: reviewedBy || null,
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'aiFeedback.create'));
  },

  async listByRun({ runId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'aiFeedback.listByRun') ?? []);
  },

  async listByAgentVersion({ workspaceId, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, ai_runs!inner(agent_version)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return mapRows(extractData(result, 'aiFeedback.listByAgentVersion') ?? []);
  },
};
