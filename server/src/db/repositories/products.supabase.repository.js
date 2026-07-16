/**
 * products.supabase.repository.js — Supabase-backed (task 24.11)
 *
 * Replaces Mongoose Product + ProductOutletAvailability models.
 *
 * DB tables: products, product_outlet_availability
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';
import Fuse from 'fuse.js';

const TABLE = 'products';
const AVAIL_TABLE = 'product_outlet_availability';

export const productsSupabaseRepository = {
  /**
   * List products with optional filters.
   */
  async list({ workspaceId, status, search, categoryId, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (status === 'active') q = q.eq('is_active', true);
    if (status === 'inactive') q = q.eq('is_active', false);
    if (categoryId) q = q.eq('category_id', categoryId);
    if (search) q = q.ilike('name', `%${search}%`);
    q = applyPagination(q, { page, limit });
    const result = await q;
    return mapRows(extractData(result, 'products.list') ?? []);
  },

  async search({ workspaceId, query, limit = 10, status = 'active' }) {
    requireWorkspaceId(workspaceId);
    const searchTerm = String(query || '').trim();
    if (!searchTerm) return this.list({ workspaceId, status, limit });

    const exactMatches = await this.list({ workspaceId, status, search: searchTerm, limit });
    if (exactMatches.length >= limit) return exactMatches.slice(0, limit);

    const products = await this.findProducts({ workspaceId, isActive: status === 'active' ? true : undefined });
    const fuse = new Fuse(products, {
      keys: [
        { name: 'name', weight: 0.75 },
        { name: 'shortDescription', weight: 0.12 },
        { name: 'description', weight: 0.08 },
        { name: 'sku', weight: 0.03 },
        { name: 'tags', weight: 0.02 },
      ],
      threshold: 0.45,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true,
    });

    const seen = new Set(exactMatches.map((product) => String(product.id)));
    const fuzzyMatches = fuse.search(searchTerm)
      .map((result) => result.item)
      .filter((product) => {
        const key = String(product.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return [...exactMatches, ...fuzzyMatches].slice(0, limit);
  },

  /**
   * Count products with optional filters.
   */
  async count({ workspaceId, status, search, categoryId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (status === 'active') q = q.eq('is_active', true);
    if (status === 'inactive') q = q.eq('is_active', false);
    if (categoryId) q = q.eq('category_id', categoryId);
    if (search) q = q.ilike('name', `%${search}%`);
    const result = await q;
    return result.count ?? 0;
  },

  /**
   * Find by workspace + product ID.
   */
  async findById({ workspaceId, productId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('id', productId).maybeSingle();
    const row = extractSingle(result, 'products.findById');
    return row ? mapRow(row) : null;
  },

  async listCategories({ workspaceId, brandId } = {}) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client.from('product_categories').select('*').eq('workspace_id', workspaceId).order('sort_order', { ascending: true });
    if (brandId) query = query.eq('brand_id', brandId);
    const result = await query;
    return mapRows(extractData(result, 'catalog.listCategories') ?? []);
  },

  async listProductsForOutlet({ workspaceId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(AVAIL_TABLE)
      .select('*, products(*)')
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId);
    const rows = extractData(result, 'catalog.listProductsForOutlet') ?? [];
    return rows
      .map((row) => ({ ...mapRow(row.products || {}), outletAvailability: mapRow(row) }))
      .filter((product) => product.id);
  },

  async findProductWithModifiers({ workspaceId, productId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, product_modifiers(*)')
      .eq('workspace_id', workspaceId)
      .eq('id', productId)
      .maybeSingle();
    const row = extractSingle(result, 'catalog.findProductWithModifiers');
    if (!row) return null;
    const product = mapRow(row);
    product.modifiers = mapRows(row.product_modifiers || []);
    return product;
  },

  async findProductsByIds({ workspaceId, productIds }) {
    requireWorkspaceId(workspaceId);
    if (!Array.isArray(productIds) || productIds.length === 0) return [];
    return this.findProducts({ workspaceId, ids: productIds });
  },

  async listAvailabilityForOutlet({ workspaceId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(AVAIL_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('outlet_id', outletId);
    return mapRows(extractData(result, 'catalog.listAvailabilityForOutlet') ?? []);
  },

  /**
   * Find products matching arbitrary query (used by AI service).
   */
  async findProducts({ workspaceId, outletId, isActive, ids } = {}) {
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*').order('created_at', { ascending: false });
    if (workspaceId) q = q.eq('workspace_id', workspaceId);
    if (isActive !== undefined) q = q.eq('is_active', isActive);
    if (ids && ids.length > 0) q = q.in('id', ids);
    const result = await q;
    return mapRows(extractData(result, 'products.findProducts') ?? []);
  },

  /**
   * Create a product.
   */
  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      name: data.name,
      slug: data.slug || null,
      sku: data.sku || null,
      short_description: data.shortDescription || null,
      description: data.description || null,
      base_price: data.basePrice ?? data.price ?? 0,
      cost_price: data.costPrice || null,
      currency: data.currency || 'IDR',
      thumbnail_url: data.thumbnailUrl || null,
      tags: data.tags || [],
      is_featured: data.isFeatured ?? false,
      is_active: data.isActive ?? true,
      stock_tracking: data.stockTracking ?? false,
      stock_quantity: data.stockQuantity ?? null,
      category_id: data.categoryId || null,
      metadata: data.metadata || {},
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'products.create'));
  },

  /**
   * Update product fields.
   */
  async update({ workspaceId, productId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const set = {};
    const fieldMap = {
      name: 'name', slug: 'slug', sku: 'sku',
      shortDescription: 'short_description', description: 'description',
      basePrice: 'base_price', costPrice: 'cost_price', currency: 'currency',
      thumbnailUrl: 'thumbnail_url', tags: 'tags', isFeatured: 'is_featured',
      isActive: 'is_active', stockTracking: 'stock_tracking',
      stockQuantity: 'stock_quantity', categoryId: 'category_id', metadata: 'metadata',
    };
    for (const [k, v] of Object.entries(updates)) {
      if (fieldMap[k]) set[fieldMap[k]] = v;
    }
    const result = await client.from(TABLE).update(set).eq('workspace_id', workspaceId).eq('id', productId).select().maybeSingle();
    const row = extractSingle(result, 'products.update');
    return row ? mapRow(row) : null;
  },

  /**
   * Archive (deactivate) a product.
   */
  async archive({ workspaceId, productId }) {
    return this.update({ workspaceId, productId, updates: { isActive: false } });
  },

  // ─── Product Outlet Availability ─────────────────────────────────────────

  async findAvailabilityByOutlet({ workspaceId, outletId, status, isAvailable, productIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(AVAIL_TABLE).select('*').eq('workspace_id', workspaceId).eq('outlet_id', outletId);
    if (status) q = q.eq('status', status);
    if (isAvailable !== undefined) q = q.eq('is_available', isAvailable);
    if (productIds && productIds.length > 0) q = q.in('product_id', productIds);
    const result = await q;
    return mapRows(extractData(result, 'products.findAvailabilityByOutlet') ?? []);
  },

  async findAvailabilityByProduct({ workspaceId, productId, status, isAvailable, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(AVAIL_TABLE).select('*').eq('workspace_id', workspaceId).eq('product_id', productId);
    if (status) q = q.eq('status', status);
    if (isAvailable !== undefined) q = q.eq('is_available', isAvailable);
    if (outletIds && outletIds.length > 0) q = q.in('outlet_id', outletIds);
    const result = await q;
    return mapRows(extractData(result, 'products.findAvailabilityByProduct') ?? []);
  },

  async findAvailability({ workspaceId, productId, outletId, status, isAvailable, productIds, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(AVAIL_TABLE).select('*').eq('workspace_id', workspaceId);
    if (productId) q = q.eq('product_id', productId);
    if (outletId) q = q.eq('outlet_id', outletId);
    if (status) q = q.eq('status', status);
    if (isAvailable !== undefined) q = q.eq('is_available', isAvailable);
    if (productIds && productIds.length > 0) q = q.in('product_id', productIds);
    if (outletIds && outletIds.length > 0) q = q.in('outlet_id', outletIds);
    const result = await q;
    return mapRows(extractData(result, 'products.findAvailability') ?? []);
  },

  async findOneAvailability({ workspaceId, productId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(AVAIL_TABLE).select('*').eq('workspace_id', workspaceId).eq('product_id', productId).eq('outlet_id', outletId).maybeSingle();
    const row = extractSingle(result, 'products.findOneAvailability');
    return row ? mapRow(row) : null;
  },

  async upsertAvailability({ workspaceId, productId, outletId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const base = {
      workspace_id: workspaceId,
      product_id: productId,
      variant_id: updates.variantId ?? null,
      outlet_id: outletId,
      is_available: updates.isAvailable ?? true,
      price_override: updates.priceOverride ?? null,
      stock_quantity: updates.stockQuantity ?? null,
      status: updates.status || 'active',
    };
    let existingQuery = client.from(AVAIL_TABLE)
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('product_id', productId)
      .eq('outlet_id', outletId);
    existingQuery = updates.variantId
      ? existingQuery.eq('variant_id', updates.variantId)
      : existingQuery.is('variant_id', null);
    const { data: existing, error: findError } = await existingQuery.maybeSingle();
    if (findError) throw findError;

    const result = existing
      ? await client.from(AVAIL_TABLE).update(base).eq('id', existing.id).select().single()
      : await client.from(AVAIL_TABLE).insert(base).select().single();
    return mapRow(extractSingle(result, 'products.upsertAvailability'));
  },

  async syncProductOutletAvailability({ workspaceId, productId, outletIds, stockQuantity = null }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const selectedIds = new Set((outletIds || []).map(String));
    const { data: currentRows, error: findError } = await client
      .from(AVAIL_TABLE)
      .select('id, outlet_id, variant_id')
      .eq('workspace_id', workspaceId)
      .eq('product_id', productId)
      .is('variant_id', null);
    if (findError) throw findError;

    const currentByOutlet = new Map((currentRows || []).map((row) => [String(row.outlet_id), row]));
    for (const row of currentRows || []) {
      if (selectedIds.has(String(row.outlet_id))) {
        const { error } = await client.from(AVAIL_TABLE).update({ is_available: true, status: 'active' }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await client.from(AVAIL_TABLE).update({ is_available: false, status: 'inactive' }).eq('id', row.id);
        if (error) throw error;
      }
    }

    for (const outletId of selectedIds) {
      if (currentByOutlet.has(outletId)) continue;
      await this.upsertAvailability({
        workspaceId,
        productId,
        outletId,
        updates: { isAvailable: true, stockQuantity, status: 'active' },
      });
    }

    return this.findAvailabilityByProduct({ workspaceId, productId });
  },
};
