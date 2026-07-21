import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';

const RULES_TABLE = 'product_recommendations';
const EVENTS_TABLE = 'recommendation_events';

function ruleSelect() {
  return '*';
}

export const productRecommendationsRepository = {
  async listRules({ workspaceId, sourceProductId, targetProductId, outletId, recommendationType, placement, status, page = 1, limit = 50 } = {}) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client.from(RULES_TABLE).select(ruleSelect()).eq('workspace_id', workspaceId).order('priority', { ascending: false }).order('id', { ascending: true });
    if (sourceProductId) query = query.eq('source_product_id', sourceProductId);
    if (targetProductId) query = query.eq('target_product_id', targetProductId);
    if (outletId) query = query.eq('outlet_id', outletId);
    if (recommendationType) query = query.eq('recommendation_type', recommendationType);
    if (placement) query = query.eq('placement', placement);
    if (status) query = query.eq('status', status);
    query = applyPagination(query, { page, limit });
    return mapRows(extractData(await query, 'productRecommendations.listRules') || []);
  },

  async findRuleById({ workspaceId, recommendationId }) {
    requireWorkspaceId(workspaceId);
    const result = await getSupabaseServiceClient().from(RULES_TABLE).select(ruleSelect()).eq('workspace_id', workspaceId).eq('id', recommendationId).maybeSingle();
    const row = extractSingle(result, 'productRecommendations.findRuleById');
    return row ? mapRow(row) : null;
  },

  async createRule(data) {
    requireWorkspaceId(data.workspaceId);
    const result = await getSupabaseServiceClient().from(RULES_TABLE).insert({
      workspace_id: data.workspaceId,
      source_product_id: data.sourceProductId,
      target_product_id: data.targetProductId,
      outlet_id: data.outletId || null,
      recommendation_type: data.recommendationType,
      placement: data.placement || 'cart',
      headline: data.headline || null,
      priority: data.priority ?? 0,
      status: data.status || 'active',
      starts_at: data.startsAt || null,
      ends_at: data.endsAt || null,
      metadata: data.metadata || {},
    }).select(ruleSelect()).single();
    return mapRow(extractSingle(result, 'productRecommendations.createRule'));
  },

  async updateRule({ workspaceId, recommendationId, updates }) {
    requireWorkspaceId(workspaceId);
    const fields = {
      sourceProductId: 'source_product_id', targetProductId: 'target_product_id', outletId: 'outlet_id',
      recommendationType: 'recommendation_type', placement: 'placement', headline: 'headline', priority: 'priority',
      status: 'status', startsAt: 'starts_at', endsAt: 'ends_at', metadata: 'metadata',
    };
    const set = {};
    for (const [key, value] of Object.entries(updates || {})) if (fields[key]) set[fields[key]] = value;
    if (!Object.keys(set).length) return this.findRuleById({ workspaceId, recommendationId });
    const result = await getSupabaseServiceClient().from(RULES_TABLE).update(set).eq('workspace_id', workspaceId).eq('id', recommendationId).select(ruleSelect()).maybeSingle();
    const row = extractSingle(result, 'productRecommendations.updateRule');
    return row ? mapRow(row) : null;
  },

  async archiveRule({ workspaceId, recommendationId }) {
    return this.updateRule({ workspaceId, recommendationId, updates: { status: 'archived' } });
  },

  async listActiveRulesForSources({ workspaceId, sourceProductIds, outletId, placement = 'cart', now = new Date().toISOString() }) {
    requireWorkspaceId(workspaceId);
    if (!Array.isArray(sourceProductIds) || sourceProductIds.length === 0) return [];
    const client = getSupabaseServiceClient();
    let query = client.from(RULES_TABLE).select(ruleSelect())
      .eq('workspace_id', workspaceId).in('source_product_id', sourceProductIds)
      .eq('placement', placement).eq('status', 'active')
      .or(`outlet_id.is.null,outlet_id.eq.${outletId}`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('priority', { ascending: false }).order('id', { ascending: true });
    return mapRows(extractData(await query, 'productRecommendations.listActiveRulesForSources') || []);
  },

  async recordEvent(data) {
    requireWorkspaceId(data.workspaceId);
    const payload = {
      workspace_id: data.workspaceId,
      recommendation_id: data.recommendationId || null,
      source_product_id: data.sourceProductId || null,
      target_product_id: data.targetProductId,
      outlet_id: data.outletId || null,
      cart_id: data.cartId || null,
      order_id: data.orderId || null,
      session_id: data.sessionId || null,
      event_type: data.eventType,
      placement: data.placement || 'cart',
      idempotency_key: data.idempotencyKey || null,
      metadata: data.metadata || {},
    };
    const client = getSupabaseServiceClient();
    if (payload.idempotency_key) {
      const existing = await client.from(EVENTS_TABLE).select('*').eq('workspace_id', data.workspaceId).eq('idempotency_key', payload.idempotency_key).maybeSingle();
      const row = extractSingle(existing, 'productRecommendations.findEventByIdempotencyKey');
      if (row) return mapRow(row);
    }
    const result = await client.from(EVENTS_TABLE).insert(payload).select('*').single();
    return mapRow(extractSingle(result, 'productRecommendations.recordEvent'));
  },

  async listRulePerformance({ workspaceId, recommendationIds, from, to, outletId } = {}) {
    requireWorkspaceId(workspaceId);
    if (!Array.isArray(recommendationIds) || recommendationIds.length === 0) return [];
    const client = getSupabaseServiceClient();
    let query = client.from(EVENTS_TABLE).select('recommendation_id,event_type,target_product_id,order_id,metadata,created_at').eq('workspace_id', workspaceId).in('recommendation_id', recommendationIds).order('created_at', { ascending: false });
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lt('created_at', to);
    if (outletId) query = query.eq('outlet_id', outletId);
    return mapRows(extractData(await query, 'productRecommendations.listRulePerformance') || []);
  },

  async listEventsForAttribution({ workspaceId, cartId, sessionId, targetProductIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client.from(EVENTS_TABLE).select('*').eq('workspace_id', workspaceId).in('event_type', ['accepted', 'clicked']);
    if (cartId) query = query.eq('cart_id', cartId);
    else if (sessionId) query = query.eq('session_id', sessionId);
    if (Array.isArray(targetProductIds) && targetProductIds.length) query = query.in('target_product_id', targetProductIds);
    return mapRows(extractData(await query, 'productRecommendations.listEventsForAttribution') || []);
  },
};

export const recommendationEventsRepository = productRecommendationsRepository;
