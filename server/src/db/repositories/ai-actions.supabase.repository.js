/**
 * ai-actions.supabase.repository.js — Supabase-backed (task 24.17)
 *
 * Replaces Mongoose AIAction model.
 * DB table: ai_actions
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle } from '../supabase-errors.js';

const TABLE = 'ai_actions';

export const aiActionsSupabaseRepository = {
  async create(data) {
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      chat_id: data.chatId || null,
      chat_message_id: data.chatMessageId || null,
      agent_id: data.agentId || null,
      action_type: data.actionType || data.action_type,
      status: data.status || 'proposed',
      input: data.input || {},
      output: data.output || {},
      error: data.error || null,
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'aiActions.create'));
  },

  async markValidated(id) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    const row = extractSingle(result, 'aiActions.markValidated');
    return row ? mapRow(row) : null;
  },

  async markExecuted(id, output = {}) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({
      status: 'executed',
      output,
      executed_at: new Date().toISOString(),
      error: null,
    }).eq('id', id).select().maybeSingle();
    const row = extractSingle(result, 'aiActions.markExecuted');
    return row ? mapRow(row) : null;
  },

  async markRejected(id, reason) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({
      status: 'rejected',
      error: typeof reason === 'string' ? reason : JSON.stringify(reason),
    }).eq('id', id).select().maybeSingle();
    const row = extractSingle(result, 'aiActions.markRejected');
    return row ? mapRow(row) : null;
  },

  async markFailed(id, error) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({
      status: 'failed',
      error: typeof error === 'string' ? error : error?.message || String(error),
    }).eq('id', id).select().maybeSingle();
    const row = extractSingle(result, 'aiActions.markFailed');
    return row ? mapRow(row) : null;
  },

  async findById(id) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('id', id).maybeSingle();
    const row = extractSingle(result, 'aiActions.findById');
    return row ? mapRow(row) : null;
  },

  async findPendingByChat({ chatId, limit = 10 }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('chat_id', chatId).in('status', ['proposed', 'confirmed']).order('created_at', { ascending: false }).limit(limit);
    const { data } = result;
    return (data ?? []).map(mapRow);
  },
};
