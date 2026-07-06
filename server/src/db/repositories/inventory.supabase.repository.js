import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, requireOutletId, applyPagination } from '../supabase-query.js';
import { AppError } from '../../utils/errors.js';

const INV_TABLE = 'inventory_items';
const MOV_TABLE = 'stock_movements';

export const inventoryRepository = {

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findByProduct({ workspaceId, outletId, outletIds, productId, variant = null }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(INV_TABLE).select('*').eq('workspace_id', workspaceId).eq('product_id', productId);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    if (variant === null) q = q.is('variant', null);
    else if (variant !== undefined) q = q.eq('variant', variant);
    const result = await q.maybeSingle();
    const row = extractSingle(result, 'inventory.findByProduct');
    return row ? mapRow(row) : null;
  },

  async list({ workspaceId, outletId, outletIds, status, lowStockOnly, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(INV_TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    if (status) q = q.eq('status', status);
    if (lowStockOnly) q = q.lt('quantity', client.rpc('coalesce', { col: 'low_stock_threshold', default: 5 }));
    q = applyPagination(q, { page, limit });
    const result = await q;
    return mapRows(extractData(result, 'inventory.list') ?? []);
  },

  async count({ workspaceId, outletId, outletIds, status }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(INV_TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    if (status) q = q.eq('status', status);
    const result = await q;
    return result.count ?? 0;
  },

  async getMovements({ workspaceId, outletId, outletIds, productId, reason, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(MOV_TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (Array.isArray(outletIds)) q = outletIds.length > 0 ? q.in('outlet_id', outletIds) : q.limit(0);
    if (productId) q = q.eq('product_id', productId);
    if (reason) q = q.eq('reason', reason);
    q = applyPagination(q, { page, limit });
    const result = await q;
    return mapRows(extractData(result, 'inventory.getMovements') ?? []);
  },

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async upsertItem({ workspaceId, outletId, productId, variant = null, quantity, lowStockThreshold, status }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const payload = {
      workspace_id: workspaceId,
      outlet_id: outletId,
      product_id: productId,
      ...(variant !== null && { variant }),
      quantity: quantity ?? 0,
      low_stock_threshold: lowStockThreshold ?? 5,
      ...(status && { status }),
    };
    const result = await client.from(INV_TABLE).upsert(payload, {
      onConflict: 'workspace_id,outlet_id,product_id,variant',
      ignoreDuplicates: false,
    }).select().single();
    return mapRow(extractSingle(result, 'inventory.upsertItem'));
  },

  async atomicAdjust({ workspaceId, outletId, productId, variant = null, delta, reason, referenceType, referenceId, notes, userId }) {
    requireWorkspaceId(workspaceId);
    if (delta === 0) throw new AppError('INVALID_DELTA', 'Delta cannot be zero', 400);
    const client = getSupabaseServiceClient();
    let findQuery = client.from(INV_TABLE)
      .select('id, quantity, low_stock_threshold')
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId)
      .eq('product_id', productId);
    if (variant === null) findQuery = findQuery.is('variant', null);
    else if (variant !== undefined) findQuery = findQuery.eq('variant', variant);
    let { data: item, error: findErr } = await findQuery.maybeSingle();
    if (findErr) throw findErr;
    if (!item) {
      const { data: created } = await client.from(INV_TABLE).insert({
        workspace_id: workspaceId, outlet_id: outletId, product_id: productId, variant, quantity: 0,
      }).select('id, quantity, low_stock_threshold').single();
      item = created;
    }
    const newQty = item.quantity + delta;
    if (newQty < 0) throw new AppError('INSUFFICIENT_STOCK', `Insufficient stock at outlet ${outletId} for product ${productId}`, 409, { available: item.quantity, requested: delta });

    const { error: updErr } = await client.from(INV_TABLE).update({ quantity: newQty }).eq('id', item.id).eq('quantity', item.quantity);
    if (updErr) {
      if (updErr.code === 'PGRST106') throw new AppError('CONCURRENT_MODIFICATION', 'Inventory was modified concurrently', 409);
      throw updErr;
    }

    await client.from(MOV_TABLE).insert({
      workspace_id: workspaceId, outlet_id: outletId, product_id: productId, variant,
      quantity_change: delta, running_quantity: newQty, reason,
      reference_type: referenceType || null, reference_id: referenceId || null, notes: notes || null,
      created_by: userId || null,
    });

    return { itemId: item.id, productId, outletId, quantity: newQty, delta };
  },

  async setLowStockThreshold({ workspaceId, outletId, productId, threshold }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(INV_TABLE).update({ low_stock_threshold: threshold })
      .eq('workspace_id', workspaceId).eq('outlet_id', outletId).eq('product_id', productId).select().single();
    return mapRow(extractSingle(result, 'inventory.setLowStockThreshold'));
  },
};
