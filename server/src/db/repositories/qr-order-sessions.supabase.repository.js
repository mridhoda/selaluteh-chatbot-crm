import { createHash } from 'node:crypto';
import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'qr_order_sessions';
const OPTIONAL_SCHEMA_ERRORS = new Set(['42P01', '42703', 'PGRST200', 'PGRST205']);

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
      address: row.outlets.address || null,
      status: row.outlets.status || null,
    };
  }
  if (row.qr_codes && typeof row.qr_codes === 'object') {
    session.qrCode = mapRow(row.qr_codes);
  }
  if (row.qr_locations && typeof row.qr_locations === 'object') {
    session.qrLocation = mapRow(row.qr_locations);
  }
  return session;
}

export const qrOrderSessionsRepository = {
  hashToken: hashQrToken,

  async findSessionByToken({ sessionToken }) {
    return this.findActiveByToken({ token: sessionToken });
  },

  async findActiveSessionByToken({ sessionToken }) {
    return this.findActiveByToken({ token: sessionToken });
  },

  async findActiveByToken({ token }) {
    const client = getSupabaseServiceClient();
    let result = await client
      .from(TABLE)
      .select('*, outlets(id, name, code, city, address, status), qr_codes(id, public_code, status, expires_at, metadata), qr_locations(id, location_type, label, code, default_fulfillment_type, status, metadata)')
      .eq('qr_token_hash', hashQrToken(token))
      .eq('is_active', true)
      .maybeSingle();
    if (result.error && OPTIONAL_SCHEMA_ERRORS.has(result.error.code)) {
      result = await client
        .from(TABLE)
        .select('*, outlets(id, name, code, city, address, status)')
        .eq('qr_token_hash', hashQrToken(token))
        .eq('is_active', true)
        .maybeSingle();
    }
    const row = extractSingle(result, 'qrOrderSessions.findActiveByToken');
    return mapSession(row);
  },

  async findActiveQrCodeByToken({ token }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from('qr_codes')
      .select('*, outlets(id, name, code, city, address, status), qr_locations(id, location_type, label, code, default_fulfillment_type, status, metadata)')
      .eq('qr_token_hash', hashQrToken(token))
      .eq('status', 'active')
      .maybeSingle();
    if (result.error && OPTIONAL_SCHEMA_ERRORS.has(result.error.code)) return null;
    const row = extractSingle(result, 'qrOrderSessions.findActiveQrCodeByToken');
    if (!row) return null;
    const qrCode = mapRow(row);
    if (row.outlets && typeof row.outlets === 'object') qrCode.outlet = mapRow(row.outlets);
    if (row.qr_locations && typeof row.qr_locations === 'object') qrCode.qrLocation = mapRow(row.qr_locations);
    return qrCode;
  },

  async create({ workspaceId, outletId, token, tableId, tableLabel, locationLabel, fulfillmentType = 'pickup', expiresAt = null, qrCodeId = null, qrLocationId = null, selectedOutletId = null, lockedOutletId = null, lockedLocationId = null, customerContext = null }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).insert({
      workspace_id: workspaceId,
      outlet_id: outletId || lockedOutletId || selectedOutletId || null,
      qr_token_hash: hashQrToken(token),
      qr_code_id: qrCodeId,
      qr_location_id: qrLocationId || lockedLocationId || null,
      selected_outlet_id: selectedOutletId || null,
      locked_outlet_id: lockedOutletId || outletId || null,
      locked_location_id: lockedLocationId || null,
      table_id: tableId || null,
      table_label: tableLabel || null,
      location_label: locationLabel || null,
      fulfillment_type: fulfillmentType,
      expires_at: expiresAt,
      customer_context: customerContext || {},
    }).select('*, outlets(id, name, code, city, address, status), qr_codes(id, public_code, status, expires_at, metadata), qr_locations(id, location_type, label, code, default_fulfillment_type, status, metadata)').single();
    return mapSession(extractSingle(result, 'qrOrderSessions.create'));
  },

  async createSession(data) {
    return this.create(data);
  },

  async updateSelectedOutlet({ workspaceId, sessionId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE)
      .update({ selected_outlet_id: outletId, outlet_id: outletId })
      .eq('workspace_id', workspaceId)
      .eq('id', sessionId)
      .select('*, outlets(id, name, code, city, address, status), qr_codes(id, public_code, status, expires_at, metadata), qr_locations(id, location_type, label, code, default_fulfillment_type, status, metadata)')
      .maybeSingle();
    const row = extractSingle(result, 'qrOrderSessions.updateSelectedOutlet');
    return row ? mapSession(row) : null;
  },

  async markCompleted({ workspaceId, sessionId, orderId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE)
      .update({ is_active: false, session_status: 'completed', order_id: orderId, completed_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', sessionId)
      .select('*, outlets(id, name, code, city, address, status), qr_codes(id, public_code, status, expires_at, metadata), qr_locations(id, location_type, label, code, default_fulfillment_type, status, metadata)')
      .maybeSingle();
    const row = extractSingle(result, 'qrOrderSessions.markCompleted');
    return row ? mapSession(row) : null;
  },

  async expireOldSessions(now = new Date()) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE)
      .update({ is_active: false, session_status: 'expired', revoked_at: new Date(now).toISOString() })
      .eq('is_active', true)
      .lte('expires_at', now.toISOString())
      .select();
    if (result.error && OPTIONAL_SCHEMA_ERRORS.has(result.error.code)) return [];
    return (result.data || []).map(mapSession);
  },
};
