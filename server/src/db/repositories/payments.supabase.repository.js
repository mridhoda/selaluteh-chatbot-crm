/**
 * payments.supabase.repository.js — Supabase-backed (task 24.15)
 *
 * Replaces Mongoose Payment + PaymentEvent models.
 * DB tables: payments, payment_events
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';

const TABLE = 'payments';
const EVENTS_TABLE = 'payment_events';

export const paymentsSupabaseRepository = {
  async findById({ workspaceId, paymentId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('id', paymentId).maybeSingle();
    const row = extractSingle(result, 'payments.findById');
    return row ? mapRow(row) : null;
  },

  async findByOrder({ workspaceId, orderId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('order_id', orderId).order('attempt_number', { ascending: false }).limit(1).maybeSingle();
    const row = extractSingle(result, 'payments.findByOrder');
    return row ? mapRow(row) : null;
  },

  async findReusableAttempt({ workspaceId, orderId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('order_id', orderId).in('status', ['pending', 'paid']).order('attempt_number', { ascending: false }).limit(1).maybeSingle();
    const row = extractSingle(result, 'payments.findReusableAttempt');
    return row ? mapRow(row) : null;
  },

  async findByMerchantReference({ workspaceId, ref }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('merchant_reference', ref).maybeSingle();
    const row = extractSingle(result, 'payments.findByMerchantReference');
    return row ? mapRow(row) : null;
  },

  async findByProviderTransactionId(providerTransactionId) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('provider_transaction_id', providerTransactionId).maybeSingle();
    const row = extractSingle(result, 'payments.findByProviderTransactionId');
    return row ? mapRow(row) : null;
  },

  async list({ workspaceId, orderId, status, reconciliationStatus, provider, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (orderId) q = q.eq('order_id', orderId);
    if (status) q = q.eq('status', status);
    if (reconciliationStatus) {
      if (Array.isArray(reconciliationStatus)) q = q.in('reconciliation_status', reconciliationStatus);
      else q = q.eq('reconciliation_status', reconciliationStatus);
    }
    if (provider) q = q.eq('provider', provider);
    q = applyPagination(q, { page, limit });
    const result = await q;
    return mapRows(extractData(result, 'payments.list') ?? []);
  },

  async count({ workspaceId, orderId, status, reconciliationStatus, provider }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (orderId) q = q.eq('order_id', orderId);
    if (status) q = q.eq('status', status);
    if (reconciliationStatus) {
      if (Array.isArray(reconciliationStatus)) q = q.in('reconciliation_status', reconciliationStatus);
      else q = q.eq('reconciliation_status', reconciliationStatus);
    }
    if (provider) q = q.eq('provider', provider);
    const result = await q;
    return result.count ?? 0;
  },

  async create(data) {
    if (data.providerEventId || data.eventType || data.processingStatus) {
      return this.createEvent({ paymentId: data.paymentId || null, workspaceId: data.workspaceId, event: data });
    }
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      outlet_id: data.outletId,
      order_id: data.orderId,
      contact_id: data.contactId,
      provider: data.provider || 'midtrans',
      method: data.method || null,
      payment_method: data.paymentMethod || null,
      amount: data.amount,
      currency: data.currency || 'IDR',
      status: data.status || 'pending',
      attempt_number: data.attemptNumber || 1,
      merchant_reference: data.merchantReference || null,
      provider_transaction_id: data.providerTransactionId || null,
      payment_url: data.paymentUrl || null,
      expiry_time: data.expiryTime || null,
      reconciliation_status: data.reconciliationStatus || 'pending',
      metadata: data.metadata || {},
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'payments.create'));
  },

  async atomicStatusUpdate({ paymentId, expectedStatus, newStatus }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({ status: newStatus }).eq('id', paymentId).eq('status', expectedStatus).select().maybeSingle();
    const row = extractSingle(result, 'payments.atomicStatusUpdate');
    return row ? mapRow(row) : null;
  },

  async updatePayment(paymentId, updates) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update(updates).eq('id', paymentId).select().maybeSingle();
    const row = extractSingle(result, 'payments.updatePayment');
    return row ? mapRow(row) : null;
  },

  async needsAttentionCount(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).in('reconciliation_status', ['missing_webhook', 'unmatched', 'amount_mismatch']);
    return result.count ?? 0;
  },

  // ─── Payment Events ───────────────────────────────────────────────────────

  async createEvent({ paymentId, workspaceId, event }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(EVENTS_TABLE).insert({
      payment_id: paymentId,
      workspace_id: workspaceId,
      provider: event.provider || null,
      provider_event_id: event.providerEventId || null,
      event_type: event.type || event.eventType || 'webhook',
      processing_status: event.processingStatus || 'received',
      verification_result: event.verificationResult || null,
      amount: event.amount ?? null,
      currency: event.currency || null,
      fee_amount: event.feeAmount ?? null,
      net_amount: event.netAmount ?? null,
      payment_method: event.paymentMethod || null,
      raw_payload: event.rawPayload || event.raw || event.payload || {},
      status: event.status || null,
      metadata: event.metadata || {},
    }).select().single();
    return mapRow(extractSingle(result, 'payments.createEvent'));
  },

  async addEvent({ paymentId, event }) {
    const client = getSupabaseServiceClient();
    const paymentResult = await client.from(TABLE).select('workspace_id').eq('id', paymentId).maybeSingle();
    const payment = paymentResult.data ? mapRow(paymentResult.data) : null;
    return this.createEvent({ paymentId, workspaceId: payment?.workspaceId, event });
  },

  async listEvents({ paymentId }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(EVENTS_TABLE).select('*').eq('payment_id', paymentId).order('created_at', { ascending: true });
    return mapRows(extractData(result, 'payments.listEvents') ?? []);
  },

  async findByPayment({ workspaceId, paymentId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(EVENTS_TABLE).select('*').eq('workspace_id', workspaceId).eq('payment_id', paymentId).order('created_at', { ascending: true });
    return mapRows(extractData(result, 'paymentEvents.findByPayment') ?? []);
  },

  async findByProviderEventId(provider, providerEventId) {
    const client = getSupabaseServiceClient();
    const result = await client.from(EVENTS_TABLE).select('*').eq('provider', provider).eq('provider_event_id', providerEventId).maybeSingle();
    const row = extractSingle(result, 'paymentEvents.findByProviderEventId');
    return row ? mapRow(row) : null;
  },

  async updateProcessingStatus({ eventId, status, verificationResult }) {
    const client = getSupabaseServiceClient();
    const set = { processing_status: status };
    if (verificationResult !== undefined) set.verification_result = verificationResult;
    const result = await client.from(EVENTS_TABLE).update(set).eq('id', eventId).select().maybeSingle();
    const row = extractSingle(result, 'paymentEvents.updateProcessingStatus');
    return row ? mapRow(row) : null;
  },

  async updateReferences({ eventId, paymentId, orderId }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(EVENTS_TABLE).update({ payment_id: paymentId || null, order_id: orderId || null }).eq('id', eventId).select().maybeSingle();
    const row = extractSingle(result, 'paymentEvents.updateReferences');
    return row ? mapRow(row) : null;
  },
};
