import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'outlet_locations';
const HISTORY_TABLE = 'outlet_location_history';

function toDb(row) {
  return {
    workspace_id: row.workspaceId,
    outlet_id: row.outletId,
    provider: row.provider,
    provider_place_id: row.providerPlaceId,
    source_url: row.sourceUrl,
    google_maps_uri: row.googleMapsUri,
    display_name: row.displayName,
    formatted_address: row.formattedAddress,
    city: row.city,
    province: row.province,
    country_code: row.countryCode,
    postal_code: row.postalCode,
    latitude: row.latitude,
    longitude: row.longitude,
    location_source: row.locationSource,
    status: row.status,
    confidence: row.confidence,
    resolver_version: row.resolverVersion,
    location_version: row.locationVersion,
    resolved_at: row.resolvedAt,
    verified_at: row.verifiedAt,
    last_verification_at: row.lastVerificationAt,
    next_verification_at: row.nextVerificationAt,
  };
}

export const outletLocationsRepository = {
  async getByOutlet(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('outlet_id', outletId).maybeSingle();
    return mapRow(extractSingle(result, 'outletLocations.getByOutlet'));
  },

  async listByWorkspace(workspaceId, { status } = {}) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('workspace_id', workspaceId);
    if (status) q = q.eq('status', status);
    const result = await q;
    return mapRows(extractData(result, 'outletLocations.listByWorkspace') || []);
  },

  async listVerifiedEligible(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('status', 'VERIFIED');
    return mapRows(extractData(result, 'outletLocations.listVerifiedEligible') || []);
  },

  async listDueVerification(limit = 50) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('status', 'VERIFIED')
      .lte('next_verification_at', new Date().toISOString())
      .order('next_verification_at', { ascending: true })
      .limit(limit);
    return mapRows(extractData(result, 'outletLocations.listDueVerification') || []);
  },

  async saveConfirmedLocation(workspaceId, outletId, fields) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const record = toDb({ workspaceId, outletId, ...fields });
    record.updated_at = new Date().toISOString();
    const result = await client.from(TABLE).upsert(record, { onConflict: 'workspace_id,outlet_id', ignoreDuplicates: false }).select().maybeSingle();
    return mapRow(extractSingle(result, 'outletLocations.saveConfirmedLocation'));
  },

  async update(workspaceId, outletId, fields) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const record = {};
    for (const [k, v] of Object.entries(toDb(fields))) { if (v !== undefined) record[k] = v; }
    record.updated_at = new Date().toISOString();
    const result = await client.from(TABLE).update(record).eq('workspace_id', workspaceId).eq('outlet_id', outletId).select().maybeSingle();
    return mapRow(extractSingle(result, 'outletLocations.update'));
  },

  async delete(workspaceId, outletId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client.from(TABLE).delete().eq('workspace_id', workspaceId).eq('outlet_id', outletId);
  },

  // History
  async addHistoryEntry({ outletLocationId, actorUserId, action, oldSnapshot, newSnapshot, distanceChangeMeters, reviewStatus, resolverVersion, metadata }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(HISTORY_TABLE).insert({
      outlet_location_id: outletLocationId,
      actor_user_id: actorUserId,
      action,
      old_snapshot: oldSnapshot,
      new_snapshot: newSnapshot,
      distance_change_meters: distanceChangeMeters,
      review_status: reviewStatus,
      resolver_version: resolverVersion,
      metadata,
    }).select().maybeSingle();
    return mapRow(extractSingle(result, 'outletLocations.addHistoryEntry'));
  },

  async getHistory(workspaceId, outletId, { page = 1, limit = 50 } = {}) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const loc = await this.getByOutlet(workspaceId, outletId);
    if (!loc) return [];
    const offset = (page - 1) * limit;
    const result = await client.from(HISTORY_TABLE).select('*').eq('outlet_location_id', loc.id)
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    return mapRows(extractData(result, 'outletLocations.getHistory') || []);
  },
};
