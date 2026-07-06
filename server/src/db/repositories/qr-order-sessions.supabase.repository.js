import { createHash } from 'node:crypto';
import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'qr_order_sessions';

export function hashQrToken(token) {
  return createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

function mapSession(row) {
  if (!row) return null;
  const session = mapRow(row);
  if (row.outlets && typeof row.outlets === 'object') {
    session.outlet = {
      id: row.outlets.id,
      name: row.outlets.name || null,
      code: row.outlets.code || null,
      city: row.outlets.city || null,
    };
  }
  return session;
}

export const qrOrderSessionsRepository = {
  hashToken: hashQrToken,

  async findActiveByToken({ token }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, outlets(id, name, code, city, status)')
      .eq('qr_token_hash', hashQrToken(token))
      .eq('is_active', true)
      .maybeSingle();
    const row = extractSingle(result, 'qrOrderSessions.findActiveByToken');
    return mapSession(row);
  },

  async create({ workspaceId, outletId, token, tableId, tableLabel, locationLabel, fulfillmentType = 'pickup', expiresAt = null }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).insert({
      workspace_id: workspaceId,
      outlet_id: outletId,
      qr_token_hash: hashQrToken(token),
      table_id: tableId || null,
      table_label: tableLabel || null,
      location_label: locationLabel || null,
      fulfillment_type: fulfillmentType,
      expires_at: expiresAt,
    }).select('*, outlets(id, name, code, city, status)').single();
    return mapSession(extractSingle(result, 'qrOrderSessions.create'));
  },
};
