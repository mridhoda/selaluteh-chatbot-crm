import { getSupabaseServiceClient } from '../supabase.js';
import { mapRows } from '../supabase-mapper.js';
import { extractData } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';
import { withRepositoryTx } from './repository-contract.js';

const QR_SCAN_TABLE = 'qr_scan_events';
const CHECKOUT_TABLE = 'checkout_analytics_events';

const baseRepository = {
  async trackQrScan(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(QR_SCAN_TABLE).insert({
      workspace_id: data.workspaceId,
      qr_code_id: data.qrCodeId || data.qrId || null,
      qr_session_id: data.qrSessionId || null,
      outlet_id: data.outletId || null,
      location_id: data.locationId || null,
      source_type: data.sourceType || data.qrSource || null,
      metadata: data.metadata || {},
    }).select().single();
    return result.error ? null : result.data;
  },

  async trackCheckoutStarted(data) {
    return this.trackCheckoutEvent({ ...data, eventType: 'checkout_started' });
  },

  async trackCheckoutCompleted(data) {
    return this.trackCheckoutEvent({ ...data, eventType: 'checkout_completed' });
  },

  async trackPaymentSucceeded(data) {
    return this.trackCheckoutEvent({ ...data, eventType: 'payment_succeeded' });
  },

  async trackOrderCompleted(data) {
    return this.trackCheckoutEvent({ ...data, eventType: 'order_completed' });
  },

  async trackCheckoutEvent(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(CHECKOUT_TABLE).insert({
      workspace_id: data.workspaceId,
      event_type: data.eventType,
      checkout_id: data.checkoutId || null,
      order_id: data.orderId || null,
      payment_id: data.paymentId || null,
      qr_code_id: data.qrCodeId || null,
      qr_session_id: data.qrSessionId || null,
      outlet_id: data.outletId || null,
      amount: data.amount ?? null,
      currency: data.currency || null,
      metadata: data.metadata || {},
    }).select().single();
    return result.error ? null : result.data;
  },

  async getQrPerformanceReport({ workspaceId, qrCodeId, outletId, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client.from(QR_SCAN_TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (qrCodeId) query = query.eq('qr_code_id', qrCodeId);
    if (outletId) query = query.eq('outlet_id', outletId);
    query = applyPagination(query, { page, limit });
    const result = await query;
    if (result.error) return [];
    return mapRows(extractData(result, 'analytics.getQrPerformanceReport') ?? []);
  },
};

export const analyticsRepository = withRepositoryTx(baseRepository);
