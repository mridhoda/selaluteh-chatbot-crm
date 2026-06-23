import { getSupabaseServiceClient } from '../supabase.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'jobs';

export const jobsRepository = {
  async create({ workspaceId, type, referenceType, referenceId, payload, deduplicationKey, maxAttempts = 3 }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).insert({
      workspace_id: workspaceId, type,
      reference_type: referenceType || null, reference_id: referenceId || null,
      payload: payload || {},
      max_attempts: maxAttempts,
      deduplication_key: deduplicationKey || null,
      status: 'pending',
    }).select().single();
    return extractSingle(result, 'jobs.create');
  },

  async claimNext({ type, now = new Date() }) {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from(TABLE)
      .update({ status: 'running', attempt_count: client.rpc('increment', { x: 1 }), next_run_at: null })
      .eq('type', type).eq('status', 'pending').lte('next_run_at', now.toISOString())
      .select().limit(1).maybeSingle();
    if (error) return null;
    return data || null;
  },

  async complete(id) {
    const client = getSupabaseServiceClient();
    return client.from(TABLE).update({ status: 'completed' }).eq('id', id);
  },

  async fail(id, errorMessage, nextRunAt) {
    const client = getSupabaseServiceClient();
    const updates = { status: 'failed', last_error: errorMessage };
    if (nextRunAt) updates.next_run_at = nextRunAt.toISOString();
    return client.from(TABLE).update(updates).eq('id', id);
  },

  async listPending(type) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('type', type).eq('status', 'pending').order('created_at', { ascending: true });
    return extractData(result, 'jobs.listPending') ?? [];
  },
};
