import { getSupabaseServiceClient } from '../supabase.js';
import { mapRows } from '../supabase-mapper.js';
import { extractData } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'knowledge_chunks';

export const knowledgeChunksRepository = {
  async insertChunks(chunks) {
    if (!chunks || chunks.length === 0) return [];
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).insert(chunks).select();
    return mapRows(extractData(result, 'knowledgeChunks.insertChunks') ?? []);
  },

  async listChunks({ sourceId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('source_id', sourceId)
      .order('chunk_index', { ascending: true });
    return mapRows(extractData(result, 'knowledgeChunks.listChunks') ?? []);
  },

  async deleteSupersededChunks({ sourceId, olderThanVersion }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .eq('source_id', sourceId)
      .lt('source_version', olderThanVersion)
      .select();
    return (extractData(result, 'knowledgeChunks.deleteSuperseded') ?? []).length;
  },

  async vectorSearch({ workspaceId, embedding, matchThreshold = 0.7, matchCount = 10, outletId, agentId }) {
    if (!embedding || !Array.isArray(embedding)) return [];
    const client = getSupabaseServiceClient();
    let q = client.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_workspace_id: workspaceId,
    });
    if (outletId) q = q.eq('outlet_id', outletId);
    if (agentId) q = q.eq('agent_id', agentId);
    const result = await q;
    return mapRows(extractData(result, 'knowledgeChunks.vectorSearch') ?? []);
  },

  async fullTextSearch({ workspaceId, query, matchCount = 10, outletId, agentId }) {
    requireWorkspaceId(workspaceId);
    if (!query || !query.trim()) return [];
    const client = getSupabaseServiceClient();
    const terms = query.trim().split(/\s+/).filter(Boolean);
    const orFilters = terms.map(t => `content.ilike.%${t}%`).join(',');
    let q = client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .or(orFilters)
      .limit(matchCount);
    if (outletId) q = q.eq('outlet_id', outletId);
    if (agentId) q = q.eq('agent_id', agentId);
    const result = await q;
    return mapRows(extractData(result, 'knowledgeChunks.fullTextSearch') ?? []);
  },
};
