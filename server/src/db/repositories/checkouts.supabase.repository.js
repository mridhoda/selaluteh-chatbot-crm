/**
 * checkouts.supabase.repository.js — Supabase-backed (task 24.13)
 *
 * Replaces Mongoose Checkout model.
 * DB table: checkouts + checkout_items
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'checkouts';
const ITEMS_TABLE = 'checkout_items';

function mapCheckout(row) {
  if (!row) return null;
  const checkout = mapRow(row);
  const rawItems = row.checkout_items || [];
  checkout.items = rawItems.map((item) => ({
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
  checkout.subtotal = checkout.subtotalAmount;
  checkout.total = checkout.totalAmount;
  delete checkout.checkoutItems;
  return checkout;
}

export const checkoutsSupabaseRepository = {
  async findById({ workspaceId, checkoutId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*, checkout_items(*)').eq('workspace_id', workspaceId).eq('id', checkoutId).maybeSingle();
    const row = extractSingle(result, 'checkouts.findById');
    return row ? mapCheckout(row) : null;
  },

  async findByIdempotencyKey({ workspaceId, key }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('idempotency_key', key).maybeSingle();
    const row = extractSingle(result, 'checkouts.findByIdempotencyKey');
    return row ? mapCheckout(row) : null;
  },

  async findActiveByCart({ workspaceId, cartId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('cart_id', cartId).in('status', ['pending', 'confirmed']).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const row = extractSingle(result, 'checkouts.findActiveByCart');
    return row ? mapCheckout(row) : null;
  },

  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      outlet_id: data.outletId,
      cart_id: data.cartId || null,
      chat_id: data.chatId || null,
      contact_id: data.contactId || null,
      status: data.status || 'pending',
      idempotency_key: data.idempotencyKey || null,
      subtotal_amount: data.subtotalAmount ?? 0,
      total_amount: data.totalAmount ?? 0,
      currency: data.currency || 'IDR',
      customer_name: data.customerName || null,
      customer_phone: data.customerPhone || null,
      customer_address: data.customerAddress || null,
      delivery_method: data.deliveryMethod || null,
      customer_snapshot: data.customerSnapshot || {},
      fulfillment_snapshot: data.fulfillmentSnapshot || {},
      notes: data.notes || null,
      expires_at: data.expiresAt || null,
      metadata: data.metadata || {},
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    const checkout = mapRow(extractSingle(result, 'checkouts.create'));
    if (Array.isArray(data.items) && data.items.length > 0) {
      await client.from(ITEMS_TABLE).insert(data.items.map((item) => ({
        workspace_id: data.workspaceId,
        checkout_id: checkout.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name_snapshot: item.productNameSnapshot || item.name || '',
        unit_price: item.unitPrice ?? item.effectivePrice ?? 0,
        quantity: item.quantity,
        subtotal_amount: item.subtotalAmount ?? item.subtotal ?? (item.unitPrice ?? item.effectivePrice ?? 0) * item.quantity,
        metadata: item.metadata || {},
      })));
    }
    return this.findById({ workspaceId: data.workspaceId, checkoutId: checkout.id });
  },

  async updateStatus({ workspaceId, checkoutId, status }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).update({ status }).eq('workspace_id', workspaceId).eq('id', checkoutId).select().maybeSingle();
    const row = extractSingle(result, 'checkouts.updateStatus');
    return row ? mapCheckout(row) : null;
  },

  async findExpired(before = new Date()) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').in('status', ['pending', 'confirmed']).lte('expires_at', before.toISOString());
    return mapRows(extractData(result, 'checkouts.findExpired') ?? []);
  },

  async expireMany(checkoutIds) {
    const client = getSupabaseServiceClient();
    await client.from(TABLE).update({ status: 'expired' }).in('id', checkoutIds);
  },
};
