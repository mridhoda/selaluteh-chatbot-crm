import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'knowledge_sources';

export const knowledgeSourcesRepository = {
  async createDraft({ workspaceId, title, sourceType, content, outletId, scope }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        title,
        source_type: sourceType,
        content: content || null,
        outlet_id: outletId || null,
        scope: scope || 'workspace',
        status: 'draft',
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'knowledgeSources.createDraft'));
  },

  async findById({ workspaceId, sourceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', sourceId)
      .maybeSingle();
    const row = extractSingle(result, 'knowledgeSources.findById');
    return row ? mapRow(row) : null;
  },

  async list({ workspaceId, status, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    if (outletId) q = q.eq('outlet_id', outletId);
    const result = await q;
    return mapRows(extractData(result, 'knowledgeSources.list') ?? []);
  },

  async updateDraft({ workspaceId, sourceId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const clean = { ...updates };
    delete clean.id;
    delete clean.workspace_id;
    delete clean.created_at;
    const result = await client
      .from(TABLE)
      .update(clean)
      .eq('workspace_id', workspaceId)
      .eq('id', sourceId)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'knowledgeSources.updateDraft'));
  },

  async publishVersion({ workspaceId, sourceId, publishedBy }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: publishedBy || null,
      })
      .eq('workspace_id', workspaceId)
      .eq('id', sourceId)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'knowledgeSources.publishVersion'));
  },

  async archive({ workspaceId, sourceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'archived' })
      .eq('workspace_id', workspaceId)
      .eq('id', sourceId)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'knowledgeSources.archive'));
  },
};
