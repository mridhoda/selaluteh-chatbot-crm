import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';

const OUTLETS_TABLE = 'outlets';
const SETTINGS_TABLE = 'outlet_service_settings';
const HOURS_TABLE = 'outlet_operating_hours';
const SPECIAL_TABLE = 'outlet_special_hours';
const CHANNEL_TABLE = 'outlet_channel_policies';
const TAGS_TABLE = 'outlet_tags';

export const outletManagementRepository = {

  // ── Service Settings ──────────────────────────────────────────────────────

  async getServiceSettings(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(SETTINGS_TABLE).select('*').eq('workspace_id', workspaceId).eq('outlet_id', outletId).maybeSingle();
    return extractSingle(result, 'outlet.getServiceSettings');
  },

  async upsertServiceSettings(workspaceId, outletId, data) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const payload = { workspace_id: workspaceId, outlet_id: outletId, ...data };
    const result = await client.from(SETTINGS_TABLE).upsert(payload, { onConflict: 'outlet_id' }).select().single();
    return extractSingle(result, 'outlet.upsertServiceSettings');
  },

  // ── Operating Hours ──────────────────────────────────────────────────────

  async getOperatingHours(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(HOURS_TABLE).select('*').eq('workspace_id', workspaceId).eq('outlet_id', outletId).order('day_of_week').order('sequence');
    return mapRows(extractData(result, 'outlet.getOperatingHours') ?? []);
  },

  async replaceOperatingHours(workspaceId, outletId, hours) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client.from(HOURS_TABLE).delete().eq('workspace_id', workspaceId).eq('outlet_id', outletId);
    if (hours.length > 0) {
      const rows = hours.map(h => ({
        workspace_id: workspaceId,
        outlet_id: outletId,
        day_of_week: h.day_of_week,
        opens_at: h.opens_at,
        closes_at: h.closes_at,
        sequence: h.sequence ?? 0,
        is_closed: h.is_closed ?? false,
      }));
      await client.from(HOURS_TABLE).insert(rows);
    }
  },

  // ── Special Hours ────────────────────────────────────────────────────────

  async getSpecialHours(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(SPECIAL_TABLE).select('*').eq('workspace_id', workspaceId).eq('outlet_id', outletId).order('date');
    return mapRows(extractData(result, 'outlet.getSpecialHours') ?? []);
  },

  async createSpecialHour(workspaceId, outletId, data) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const payload = { workspace_id: workspaceId, outlet_id: outletId, ...data };
    const result = await client.from(SPECIAL_TABLE).insert(payload).select().single();
    return extractSingle(result, 'outlet.createSpecialHour');
  },

  async updateSpecialHour(workspaceId, id, data) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(SPECIAL_TABLE).update(data).eq('workspace_id', workspaceId).eq('id', id).select().single();
    return extractSingle(result, 'outlet.updateSpecialHour');
  },

  async deleteSpecialHour(workspaceId, id) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client.from(SPECIAL_TABLE).delete().eq('workspace_id', workspaceId).eq('id', id);
  },

  // ── Channel Policies ─────────────────────────────────────────────────────

  async getChannelPolicies(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(CHANNEL_TABLE).select('*').eq('workspace_id', workspaceId).eq('outlet_id', outletId);
    return mapRows(extractData(result, 'outlet.getChannelPolicies') ?? []);
  },

  async upsertChannelPolicy(workspaceId, outletId, data) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const payload = { workspace_id: workspaceId, outlet_id: outletId, ...data };
    const result = await client.from(CHANNEL_TABLE).upsert(payload, { onConflict: 'id' }).select().single();
    return extractSingle(result, 'outlet.upsertChannelPolicy');
  },

  // ── Tags ─────────────────────────────────────────────────────────────────

  async getTags(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TAGS_TABLE).select('tag').eq('workspace_id', workspaceId).eq('outlet_id', outletId);
    const rows = extractData(result, 'outlet.getTags') ?? [];
    return rows.map(r => r.tag);
  },

  async setTags(workspaceId, outletId, tags, userId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client.from(TAGS_TABLE).delete().eq('workspace_id', workspaceId).eq('outlet_id', outletId);
    if (tags.length > 0) {
      const rows = tags.map(tag => ({ workspace_id: workspaceId, outlet_id: outletId, tag, created_by: userId || null }));
      await client.from(TAGS_TABLE).insert(rows);
    }
  },
};
