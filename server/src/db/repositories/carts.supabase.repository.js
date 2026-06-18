/**
 * carts.supabase.repository.js — Supabase-backed (task 24.12)
 *
 * Replaces Mongoose Cart model.
 * DB table: carts + cart_items
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'carts';
const ITEMS_TABLE = 'cart_items';

function mapCart(row) {
  if (!row) return null;
  const cart = mapRow(row);
  const rawItems = row.cart_items || [];
  cart.items = rawItems.map((item) => ({
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    name: item.product_name_snapshot,
    productNameSnapshot: item.product_name_snapshot,
    variantNameSnapshot: item.variant_name_snapshot,
    unitPrice: item.unit_price,
    effectivePrice: item.unit_price,
    quantity: item.quantity,
    subtotal: item.subtotal_amount,
    subtotalAmount: item.subtotal_amount,
    notes: item.notes,
    metadata: item.metadata || {},
  }));
  delete cart.cartItems;
  return cart;
}

export const cartsSupabaseRepository = {
  async findActiveByContact({ workspaceId, contactId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, cart_items(*)').eq('workspace_id', workspaceId).eq('contact_id', contactId).eq('status', 'active').order('created_at', { ascending: false }).limit(1);
    if (outletId) q = q.eq('outlet_id', outletId);
    const result = await q;
    const rows = extractData(result, 'carts.findActiveByContact');
    return rows?.[0] ? mapCart(rows[0]) : null;
  },

  async findActiveByChat({ workspaceId, chatId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*, cart_items(*)').eq('workspace_id', workspaceId).eq('chat_id', chatId).eq('status', 'active').maybeSingle();
    const row = extractSingle(result, 'carts.findActiveByChat');
    return row ? mapCart(row) : null;
  },

  async findById({ workspaceId, cartId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*, cart_items(*)').eq('workspace_id', workspaceId).eq('id', cartId).maybeSingle();
    const row = extractSingle(result, 'carts.findById');
    return row ? mapCart(row) : null;
  },

  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      outlet_id: data.outletId,
      contact_id: data.contactId || null,
      chat_id: data.chatId || null,
      status: data.status || 'active',
      expires_at: data.expiresAt || null,
      metadata: data.metadata || {},
    };
    const result = await client.from(TABLE).insert(insert).select('*, cart_items(*)').single();
    return mapCart(extractSingle(result, 'carts.create'));
  },

  async update({ workspaceId, cartId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    
    const set = {};
    const fieldMap = {
      total: 'total_amount',
      totalAmount: 'total_amount',
      subtotal: 'subtotal_amount',
      subtotalAmount: 'subtotal_amount',
      discount: 'discount_amount',
      discountAmount: 'discount_amount',
      deliveryFee: 'delivery_fee',
      status: 'status',
      expiresAt: 'expires_at',
      metadata: 'metadata',
    };
    
    for (const [k, v] of Object.entries(updates)) {
      if (fieldMap[k]) {
        set[fieldMap[k]] = v;
      }
    }

    if (updates.items && updates.items.length === 0) {
      await client.from(ITEMS_TABLE).delete().eq('workspace_id', workspaceId).eq('cart_id', cartId);
    }
    
    if (Object.keys(set).length > 0) {
      const result = await client.from(TABLE).update(set).eq('workspace_id', workspaceId).eq('id', cartId).select('*, cart_items(*)').maybeSingle();
      const row = extractSingle(result, 'carts.update');
      return row ? mapCart(row) : null;
    }
    
    return this.findById({ workspaceId, cartId });
  },

  async addItem({ workspaceId, cartId, item }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: workspaceId,
      cart_id: cartId,
      product_id: item.productId,
      variant_id: item.variantId || null,
      product_name_snapshot: item.productNameSnapshot || item.name || '',
      variant_name_snapshot: item.variantNameSnapshot || null,
      unit_price: item.unitPrice ?? item.effectivePrice ?? item.basePrice ?? 0,
      quantity: item.quantity,
      subtotal_amount: item.subtotalAmount ?? item.subtotal ?? (item.unitPrice ?? item.effectivePrice ?? item.basePrice ?? 0) * item.quantity,
      notes: item.notes || null,
      metadata: item.metadata || {},
    };
    await client.from(ITEMS_TABLE).insert(insert);
    return this.findById({ workspaceId, cartId });
  },

  async updateItem({ workspaceId, cartId, itemId, productId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(ITEMS_TABLE).update(updates).eq('cart_id', cartId).eq('workspace_id', workspaceId);
    q = itemId ? q.eq('id', itemId) : q.eq('product_id', productId);
    await q;
    return this.findById({ workspaceId, cartId });
  },

  async removeItem({ workspaceId, cartId, itemId, productId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(ITEMS_TABLE).delete().eq('cart_id', cartId).eq('workspace_id', workspaceId);
    q = itemId ? q.eq('id', itemId) : q.eq('product_id', productId);
    await q;
    return this.findById({ workspaceId, cartId });
  },

  async setStatus({ workspaceId, cartId, status }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client.from(TABLE).update({ status }).eq('workspace_id', workspaceId).eq('id', cartId);
  },

  async findExpired(before = new Date()) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('status', 'active').lte('expires_at', before.toISOString());
    return mapRows(extractData(result, 'carts.findExpired') ?? []);
  },

  async expireMany(cartIds) {
    const client = getSupabaseServiceClient();
    await client.from(TABLE).update({ status: 'expired' }).in('id', cartIds);
  },
};
