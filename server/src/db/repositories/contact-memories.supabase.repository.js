import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'contact_memories';

export const contactMemoriesRepository = {
  async listActive({ workspaceId, contactId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contactId)
      .in('status', ['active', 'confirmed'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'memories.listActive') ?? []);
  },

  async findByKey({ workspaceId, contactId, memoryKey }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('contact_id', contactId)
      .eq('memory_key', memoryKey)
      .in('status', ['active', 'confirmed'])
      .maybeSingle();
    const row = extractSingle(result, 'memories.findByKey');
    return row ? mapRow(row) : null;
  },

  async createCandidate({ workspaceId, contactId, memoryKey, memoryValue, category, sourceType, sourceReferenceId, confidence }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        memory_key: memoryKey,
        memory_value: memoryValue,
        category,
        source_type: sourceType || 'model_extraction',
        source_reference_id: sourceReferenceId || null,
        confidence: confidence || 'medium',
        status: 'candidate',
      })
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'memories.createCandidate'));
  },

  async activate({ id }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'active', last_confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'memories.activate'));
  },

  async supersede({ id }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'superseded' })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'memories.supersede'));
  },

  async correct({ id, memoryValue }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ memory_value: memoryValue, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'memories.correct'));
  },

  async forget({ id }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return mapRow(extractSingle(result, 'memories.forget'));
  },

  async deleteExpired() {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .or(`valid_until.lt.${new Date().toISOString()},status.eq.deleted`)
      .select();
    return (extractData(result, 'memories.deleteExpired') ?? []).length;
  },
};
