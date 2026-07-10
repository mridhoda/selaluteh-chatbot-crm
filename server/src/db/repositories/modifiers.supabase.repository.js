import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const GROUPS_TABLE = 'modifier_groups';
const OPTIONS_TABLE = 'modifier_options';
const LINKS_TABLE = 'product_modifier_groups';

function normalizeGroup(row = {}, options = [], links = []) {
  const group = mapRow(row);
  group.options = options.filter((option) => String(option.modifierGroupId) === String(group.id));
  group.productLinks = links.filter((link) => String(link.modifierGroupId) === String(group.id));
  return group;
}

export const modifiersRepository = {
  async listGroups({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const [groupsResult, optionsResult, linksResult] = await Promise.all([
      client.from(GROUPS_TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      client.from(OPTIONS_TABLE).select('*').eq('workspace_id', workspaceId).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      client.from(LINKS_TABLE).select('*, products(id, name, sku, base_price, thumbnail_url, category_id, is_active, metadata)').eq('workspace_id', workspaceId).order('sort_order', { ascending: true }),
    ]);
    const groups = mapRows(extractData(groupsResult, 'modifiers.listGroups.groups') || []);
    const options = mapRows(extractData(optionsResult, 'modifiers.listGroups.options') || []);
    const links = (extractData(linksResult, 'modifiers.listGroups.links') || []).map((row) => ({
      ...mapRow(row),
      product: row.products ? mapRow(row.products) : null,
    }));
    return groups.map((group) => normalizeGroup(group, options, links));
  },

  async listGroupsForProducts({ workspaceId, productIds = [] }) {
    requireWorkspaceId(workspaceId);
    if (!Array.isArray(productIds) || productIds.length === 0) return new Map();
    const client = getSupabaseServiceClient();
    const linksResult = await client
      .from(LINKS_TABLE)
      .select('product_id, modifier_group_id, is_required, sort_order, modifier_groups(*, modifier_options(*))')
      .eq('workspace_id', workspaceId)
      .in('product_id', productIds)
      .order('sort_order', { ascending: true });
    const rows = extractData(linksResult, 'modifiers.listGroupsForProducts') || [];
    const byProduct = new Map();
    for (const row of rows) {
      const groupRow = row.modifier_groups;
      if (!groupRow || groupRow.status === 'inactive') continue;
      const group = mapRow(groupRow);
      group.options = mapRows(groupRow.modifier_options || []).filter((option) => option.isActive !== false);
      group.required = row.is_required === true || group.type === 'required';
      group.minSelections = group.minSelection;
      group.maxSelections = group.maxSelection;
      const key = String(row.product_id);
      byProduct.set(key, [...(byProduct.get(key) || []), group]);
    }
    return byProduct;
  },

  async replaceProductLinks({ workspaceId, modifierGroupId, productIds = [] }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const deleteResult = await client
      .from(LINKS_TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('modifier_group_id', modifierGroupId);
    extractData(deleteResult, 'modifiers.replaceProductLinks.delete');
    const rows = productIds.map((productId, index) => ({
      workspace_id: workspaceId,
      product_id: productId,
      modifier_group_id: modifierGroupId,
      sort_order: index + 1,
    }));
    if (rows.length === 0) return [];
    const insertResult = await client.from(LINKS_TABLE).insert(rows).select('*');
    return mapRows(extractData(insertResult, 'modifiers.replaceProductLinks.insert') || []);
  },
};
