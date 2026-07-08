/**
 * orders.supabase.repository.js — Supabase-backed (task 24.14)
 *
 * Replaces Mongoose Order model.
 * DB table: orders + order_items + order_events
 *
 * OrderRecord shape (camelCase):
 *   id, workspaceId, outletId, contactId, platformId, chatId, agentId,
 *   cartId, checkoutId, orderNumber, source, status, paymentStatus,
 *   fulfillmentStatus, customerNameSnapshot, customerPhoneSnapshot,
 *   channelSnapshot, customerSnapshot, fulfillmentSnapshot,
 *   subtotalAmount, discountAmount, deliveryFee, totalAmount, currency,
 *   paymentMethod, notes, formData, paidAt, metadata, createdAt, updatedAt
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';
import { derivePublicOrderStatus, getOrderCapabilities, FulfillmentStatus } from '../../orders/order-types.js';

const TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const EVENTS_TABLE = 'order_events';
const OPTIONAL_SCHEMA_ERRORS = new Set(['42703', 'PGRST204']);

function mapOrder(row) {
  if (!row) return null;
  const order = mapRow(row);
  const rawItems = row.order_items || [];
  order.items = rawItems.map((item) => ({
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    name: item.product_name_snapshot,
    productNameSnapshot: item.product_name_snapshot,
    unitPrice: item.unit_price,
    quantity: item.quantity,
    subtotal: item.subtotal_amount,
    subtotalAmount: item.subtotal_amount,
    metadata: item.metadata || {},
  }));
  order.totals = {
    subtotal: order.subtotalAmount,
    discount: order.discountAmount,
    deliveryFee: order.deliveryFee,
    total: order.totalAmount,
    currency: order.currency,
  };
  order.publicOrderStatus = derivePublicOrderStatus(order);
  order.capabilities = getOrderCapabilities(order);
  delete order.orderItems;

  // Map joined contacts row → contactId object (Supabase join returns as 'contacts' key)
  if (row.contacts && typeof row.contacts === 'object') {
    order.contactId = {
      id: row.contacts.id,
      name: row.contacts.name || null,
      phone: row.contacts.phone || null,
      handle: row.contacts.handle || null,
      external_id: row.contacts.external_id || null,
    };
  }

  // Map joined outlets row → outlet object
  if (row.outlets && typeof row.outlets === 'object') {
    order.outlet = {
      id: row.outlets.id,
      name: row.outlets.name || null,
      code: row.outlets.code || null,
      city: row.outlets.city || null,
    };
  }

  return order;
}

export const ordersSupabaseRepository = {
  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      outlet_id: data.outletId,
      contact_id: data.contactId,
      platform_id: data.platformId || null,
      chat_id: data.chatId || null,
      agent_id: data.agentId || null,
      cart_id: data.cartId || null,
      checkout_id: data.checkoutId || null,
      outlet_name_snapshot: data.outletNameSnapshot || data.outletName || '',
      source: data.source || 'telegram',
      status: data.status || 'new',
      public_order_token: data.publicOrderToken || data.public_order_token || undefined,
      channel: data.channel || (data.source === 'public_store' ? 'online_store' : null),
      qr_session_id: data.qrSessionId || null,
      table_id: data.tableId || null,
      qr_location_label: data.qrLocationLabel || null,
      fulfillment_type: data.fulfillmentType || 'pickup',
      payment_status: data.paymentStatus || 'unpaid',
      fulfillment_status: data.fulfillmentStatus || FulfillmentStatus.NOT_STARTED,
      customer_name_snapshot: data.customerNameSnapshot || data.customerName || '',
      customer_phone_snapshot: data.customerPhoneSnapshot || data.customerPhone || null,
      channel_snapshot: data.channelSnapshot || null,
      customer_snapshot: data.customerSnapshot || {},
      fulfillment_snapshot: data.fulfillmentSnapshot || {},
      subtotal_amount: data.subtotalAmount ?? data.totals?.subtotal ?? 0,
      discount_amount: data.discountAmount ?? 0,
      delivery_fee: data.deliveryFee ?? 0,
      total_amount: data.totalAmount ?? data.totals?.total ?? 0,
      currency: data.currency || data.totals?.currency || 'IDR',
      payment_method: data.paymentMethod || null,
      notes: data.notes || null,
      form_data: data.formData || {},
      metadata: data.metadata || {},
      order_number: data.orderNumber ?? undefined,
    };
    if (data.qrLocationId) insert.qr_location_id = data.qrLocationId;

    let result = await client.from(TABLE).insert(insert).select().single();
    if (result.error && data.qrLocationId && OPTIONAL_SCHEMA_ERRORS.has(result.error.code)) {
      delete insert.qr_location_id;
      result = await client.from(TABLE).insert(insert).select().single();
    }
    const order = mapRow(extractSingle(result, 'orders.create'));
    if (Array.isArray(data.items) && data.items.length > 0) {
      await client.from(ITEMS_TABLE).insert(data.items.map((item) => ({
        workspace_id: data.workspaceId,
        order_id: order.id,
        product_id: item.productId || null,
        variant_id: item.variantId || null,
        product_name_snapshot: item.productNameSnapshot || item.name || '',
        unit_price: item.unitPrice ?? item.effectivePrice ?? 0,
        quantity: item.quantity,
        subtotal_amount: item.subtotalAmount ?? item.subtotal ?? (item.unitPrice ?? item.effectivePrice ?? 0) * item.quantity,
        metadata: item.metadata || {},
      })));
    }
    return this.workspaceFindById({ workspaceId: data.workspaceId, orderId: order.id });
  },

  async workspaceList({ workspaceId, outletId, status, paymentStatus, search, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status), order_items(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (outletId) q = q.eq('outlet_id', outletId);
    if (status) q = q.eq('status', status);
    if (paymentStatus) q = q.eq('payment_status', paymentStatus);
    if (search) q = q.or(`order_number.ilike.%${search}%,customer_name_snapshot.ilike.%${search}%`);
    q = applyPagination(q, { page, limit });
    const result = await q;
    return (extractData(result, 'orders.workspaceList') ?? []).map(mapOrder);
  },

  async workspaceListScoped({ workspaceId, outletId, outletIds, status, paymentStatus, search, page = 1, limit = 50, chatId, contactId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status), order_items(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    if (status) q = q.eq('status', status);
    if (paymentStatus) q = q.eq('payment_status', paymentStatus);
    if (chatId) q = q.eq('chat_id', chatId);
    if (contactId) q = q.eq('contact_id', contactId);
    if (search) q = q.or(`order_number.ilike.%${search}%,customer_name_snapshot.ilike.%${search}%`);
    q = applyPagination(q, { page, limit });
    const result = await q;
    return (extractData(result, 'orders.workspaceListScoped') ?? []).map(mapOrder);
  },

  async workspaceCount({ workspaceId, outletId, status, paymentStatus, search }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (outletId) q = q.eq('outlet_id', outletId);
    if (status) q = q.eq('status', status);
    if (paymentStatus) q = q.eq('payment_status', paymentStatus);
    if (search) q = q.or(`order_number.ilike.%${search}%,customer_name_snapshot.ilike.%${search}%`);
    const result = await q;
    return result.count ?? 0;
  },

  async workspaceCountScoped({ workspaceId, outletId, outletIds, status, paymentStatus, search, chatId, contactId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    if (status) q = q.eq('status', status);
    if (paymentStatus) q = q.eq('payment_status', paymentStatus);
    if (chatId) q = q.eq('chat_id', chatId);
    if (contactId) q = q.eq('contact_id', contactId);
    if (search) q = q.or(`order_number.ilike.%${search}%,customer_name_snapshot.ilike.%${search}%`);
    const result = await q;
    return result.count ?? 0;
  },

  async workspaceFindById({ workspaceId, orderId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status), chats(*), order_items(*)').eq('workspace_id', workspaceId).eq('id', orderId).maybeSingle();
    const row = extractSingle(result, 'orders.workspaceFindById');
    return row ? mapOrder(row) : null;
  },

  async workspaceFindByOrderNumber({ workspaceId, orderNumber }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status), chats(*), order_items(*)')
      .eq('workspace_id', workspaceId)
      .eq('order_number', orderNumber)
      .maybeSingle();
    const row = extractSingle(result, 'orders.workspaceFindByOrderNumber');
    return row ? mapOrder(row) : null;
  },

  async workspaceFindByIdScoped({ workspaceId, orderId, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status), chats(*), order_items(*)').eq('workspace_id', workspaceId).eq('id', orderId);
    if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    const result = await q.maybeSingle();
    const row = extractSingle(result, 'orders.workspaceFindByIdScoped');
    return row ? mapOrder(row) : null;
  },

  async findOne({ workspaceId, orderId, chatId, outletId, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, contacts(*), chats(*)').eq('workspace_id', workspaceId);
    if (orderId) q = q.eq('id', orderId);
    if (chatId) q = q.eq('chat_id', chatId);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    const result = await q.maybeSingle();
    const row = extractSingle(result, 'orders.findOne');
    return row ? mapOrder(row) : null;
  },

  async findList({ workspaceId, chatId, contactId, status, outletId, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status)').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (chatId) q = q.eq('chat_id', chatId);
    if (contactId) q = q.eq('contact_id', contactId);
    if (status) q = q.eq('status', status);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    const result = await q;
    return (extractData(result, 'orders.findList') ?? []).map(mapOrder);
  },

  async updateOne({ workspaceId, orderId, updates, outletId, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).update(updates).eq('workspace_id', workspaceId).eq('id', orderId);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    const result = await q.select('*, contacts(*), chats(*)').maybeSingle();
    const row = extractSingle(result, 'orders.updateOne');
    return row ? mapOrder(row) : null;
  },

  async atomicStatusUpdate({ workspaceId, orderId, expectedStatus, newStatus, updates = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({ ...updates, status: newStatus }).eq('workspace_id', workspaceId).eq('id', orderId).eq('status', expectedStatus).select().maybeSingle();
    const row = extractSingle(result, 'orders.atomicStatusUpdate');
    return row ? mapOrder(row) : null;
  },

  async atomicPaymentStatusUpdate({ workspaceId, orderId, fromStatuses, newStatus, updates = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).update({ ...updates, payment_status: newStatus }).eq('workspace_id', workspaceId).eq('id', orderId);
    q = Array.isArray(fromStatuses) ? q.in('payment_status', fromStatuses) : q.eq('payment_status', fromStatuses);
    const result = await q.select('*, contacts(*), chats(*)').maybeSingle();
    const row = extractSingle(result, 'orders.atomicPaymentStatusUpdate');
    return row ? mapOrder(row) : null;
  },

  async atomicFulfillmentStatusUpdate({ workspaceId, orderId, expectedStatus, newStatus, updates = {} }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({ ...updates, fulfillment_status: newStatus }).eq('workspace_id', workspaceId).eq('id', orderId).eq('fulfillment_status', expectedStatus).select('*, contacts(*), chats(*)').maybeSingle();
    const row = extractSingle(result, 'orders.atomicFulfillmentStatusUpdate');
    return row ? mapOrder(row) : null;
  },

  async findByPublicOrderToken({ token }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*, contacts(id, name, phone, handle, external_id), outlets(id, name, code, city, status), order_items(*)').eq('public_order_token', token).maybeSingle();
    const row = extractSingle(result, 'orders.findByPublicOrderToken');
    return row ? mapOrder(row) : null;
  },

  async addTimelineEntry({ workspaceId, orderId, entry, eventType, actorType, actorUserId, metadata }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const normalizedEntry = entry || {
      type: eventType,
      actor: actorType,
      actorUserId,
      metadata,
    };
    await client.from(EVENTS_TABLE).insert({
      workspace_id: workspaceId,
      order_id: orderId,
      event_type: normalizedEntry.type || 'note',
      label: normalizedEntry.label || normalizedEntry.type || 'event',
      actor_type: normalizedEntry.actor || 'system',
      actor_user_id: normalizedEntry.actorUserId || null,
      metadata: normalizedEntry.metadata || {},
    });
  },

  async deleteOne({ workspaceId, orderId, outletId, outletIds }) {
    const err = new Error('Order hard delete is disabled. Cancel the order with a reason instead.');
    err.code = 'ORDER_DELETE_DISABLED';
    err.status = 405;
    throw err;
  },

  /**
   * Get recent orders for chat-scoped queries (for AI context building).
   */
  async findByChatId({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*, order_items(*)').eq('workspace_id', workspaceId).eq('chat_id', chatId).order('created_at', { ascending: false });
    return (extractData(result, 'orders.findByChatId') ?? []).map(mapOrder);
  },

  async getNextOrderNumber(workspaceId) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('order_number')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = extractSingle(result, 'orders.getNextOrderNumber');
    return row ? { orderNumber: row.order_number } : null;
  },
};
