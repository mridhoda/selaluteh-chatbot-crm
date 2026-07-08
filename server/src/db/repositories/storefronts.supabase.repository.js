import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const STOREFRONTS_TABLE = 'storefronts';
const STOREFRONT_OUTLETS_TABLE = 'storefront_outlets';
const MISSING_RELATION = new Set(['42P01', 'PGRST205']);

function isMissingRelationError(error) {
  return error && MISSING_RELATION.has(error.code);
}

function mapStorefrontOutlet(row) {
  if (!row) return null;
  const mapped = mapRow(row);
  if (row.outlets && typeof row.outlets === 'object') {
    mapped.outlet = mapRow(row.outlets);
  }
  return mapped;
}

export const storefrontsRepository = {
  async findStorefrontBySlug({ workspaceId, slug }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(STOREFRONTS_TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('slug', String(slug || '').trim().toLowerCase())
      .maybeSingle();
    if (isMissingRelationError(result.error)) return null;
    const row = extractSingle(result, 'storefronts.findStorefrontBySlug');
    return row ? mapRow(row) : null;
  },

  async findActiveBySlug({ slug }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(STOREFRONTS_TABLE)
      .select('*')
      .eq('slug', String(slug || '').trim().toLowerCase())
      .eq('status', 'active')
      .maybeSingle();
    if (isMissingRelationError(result.error)) return null;
    const row = extractSingle(result, 'storefronts.findActiveBySlug');
    return row ? mapRow(row) : null;
  },

  async listActiveOutlets({ workspaceId, storefrontId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(STOREFRONT_OUTLETS_TABLE)
      .select('*, outlets(id, workspace_id, name, code, slug, city, region, address, phone, status, metadata, created_at, updated_at)')
      .eq('workspace_id', workspaceId)
      .eq('storefront_id', storefrontId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('sort_order', { ascending: true });
    if (isMissingRelationError(result.error)) return [];
    return (extractData(result, 'storefronts.listActiveOutlets') || []).map(mapStorefrontOutlet);
  },

  async listStorefrontOutlets({ workspaceId, storefrontId }) {
    return this.listActiveOutlets({ workspaceId, storefrontId });
  },

  async isOutletAvailableForStorefront({ workspaceId, storefrontId, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(STOREFRONT_OUTLETS_TABLE)
      .select('id, status, is_visible')
      .eq('workspace_id', workspaceId)
      .eq('storefront_id', storefrontId)
      .eq('outlet_id', outletId)
      .eq('status', 'active')
      .maybeSingle();
    if (isMissingRelationError(result.error)) return false;
    const row = extractSingle(result, 'storefronts.isOutletAvailableForStorefront');
    return Boolean(row && row.is_visible !== false);
  },
};
