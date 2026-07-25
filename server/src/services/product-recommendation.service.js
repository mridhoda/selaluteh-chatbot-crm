import {
  auditLogsRepository,
  cartsRepository,
  modifiersRepository,
  productRecommendationsRepository,
  productsRepository,
} from '../db/repositories/index.js';
import { inventoryRepository } from '../db/repositories/inventory.supabase.repository.js';
import { assertOutletAccess, canAccessAllOutlets } from './access-control.service.js';
import { AppError } from '../utils/errors.js';

const TYPES = new Set(['upsell', 'cross_sell']);
const ACTIONS = new Set(['add', 'replace_source']);
const STATUSES = new Set(['active', 'inactive', 'archived']);
const PLACEMENT = 'cart';
const EVENTS = new Set(['impression', 'clicked', 'accepted', 'dismissed', 'purchased']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID.test(String(value || ''));
}

function validation(message, details = null) {
  throw new AppError('VALIDATION_ERROR', message, 400, details);
}

export function validateRecommendationInput(input = {}, { partial = false } = {}) {
  const aliases = {
    source_product_id: 'sourceProductId', target_product_id: 'targetProductId', outlet_id: 'outletId',
    recommendation_type: 'recommendationType', action_type: 'actionType', starts_at: 'startsAt', ends_at: 'endsAt',
  };
  const value = { ...input };
  for (const [snake, camel] of Object.entries(aliases)) if (value[snake] !== undefined) value[camel] = value[snake];
  const required = ['sourceProductId', 'targetProductId', 'recommendationType'];
  if (!partial) for (const field of required) if (!value[field]) validation(`${field} is required`);
  for (const field of ['sourceProductId', 'targetProductId', 'outletId']) {
    if (value[field] !== undefined && value[field] !== null && !isUuid(value[field])) validation(`${field} must be a UUID`);
  }
  if (value.sourceProductId && value.targetProductId && String(value.sourceProductId) === String(value.targetProductId)) {
    validation('sourceProductId and targetProductId must differ');
  }
  if (value.recommendationType !== undefined && !TYPES.has(value.recommendationType)) validation('recommendationType must be upsell or cross_sell');
  if (value.actionType !== undefined && !ACTIONS.has(value.actionType)) validation('actionType must be add or replace_source');
  if (value.actionType === 'replace_source' && value.recommendationType !== 'upsell') validation('replace_source is available only for upsell rules');
  if (value.placement !== undefined && value.placement !== PLACEMENT) validation('placement must be cart');
  if (value.status !== undefined && !STATUSES.has(value.status)) validation('status is invalid');
  if (value.priority !== undefined && (!Number.isInteger(value.priority) || value.priority < -1000 || value.priority > 1000)) validation('priority must be an integer between -1000 and 1000');
  if (value.headline !== undefined && value.headline !== null && (typeof value.headline !== 'string' || value.headline.length > 160)) validation('headline must be at most 160 characters');
  for (const field of ['startsAt', 'endsAt']) {
    if (value[field] !== undefined && value[field] !== null && Number.isNaN(Date.parse(value[field]))) validation(`${field} must be a valid date`);
  }
  if (value.startsAt && value.endsAt && Date.parse(value.endsAt) <= Date.parse(value.startsAt)) validation('endsAt must be after startsAt');
  if (value.metadata !== undefined && (!value.metadata || typeof value.metadata !== 'object' || Array.isArray(value.metadata))) validation('metadata must be an object');
  return value;
}

function isInSchedule(rule, now = new Date()) {
  const time = now.getTime();
  return (!rule.startsAt || Date.parse(rule.startsAt) <= time) && (!rule.endsAt || Date.parse(rule.endsAt) > time);
}

function targetIsAvailable(product, availability, inventory, now = new Date()) {
  if (!product || product.isActive === false) return false;
  if (availability && (availability.isAvailable === false || String(availability.status || 'active') !== 'active')) return false;
  if (availability?.availableFrom && Date.parse(availability.availableFrom) > now.getTime()) return false;
  if (availability?.availableUntil && Date.parse(availability.availableUntil) <= now.getTime()) return false;
  if (product.stockTracking === true && Number(inventory?.quantity ?? product.stockQuantity ?? 0) <= 0) return false;
  return true;
}

function toPublicModifiers(groups = []) {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    ...(group.type ? { type: group.type } : {}),
    ...(group.minSelection != null ? { min_selections: Number(group.minSelection) } : {}),
    ...(group.maxSelection != null ? { max_selections: Number(group.maxSelection) } : {}),
    required: group.required === true || group.type === 'required',
    options: (group.options || []).map((option) => ({
      id: option.id,
      name: option.name,
      price_delta: Number(option.priceDelta ?? option.price_delta ?? 0),
    })),
  }));
}

export function sortAndDedupeRecommendations(rows = [], cartProductIds = []) {
  const cart = new Set(cartProductIds.map(String));
  const seen = new Set();
  return [...rows]
    .filter((row) => !cart.has(String(row.targetProductId)) && !seen.has(String(row.targetProductId)))
    .sort((a, b) => Number(b.outletSpecificity || 0) - Number(a.outletSpecificity || 0)
      || Number(b.priority || 0) - Number(a.priority || 0)
      || String(a.id).localeCompare(String(b.id)))
    .filter((row) => {
      const key = String(row.targetProductId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function validateWorkspaceProducts({ workspaceId, sourceProductId, targetProductId }) {
  const [source, target] = await Promise.all([
    productsRepository.findById({ workspaceId, productId: sourceProductId }),
    productsRepository.findById({ workspaceId, productId: targetProductId }),
  ]);
  if (!source) throw new AppError('SOURCE_PRODUCT_NOT_FOUND', 'Source product not found', 404);
  if (!target) throw new AppError('TARGET_PRODUCT_NOT_FOUND', 'Target product not found', 404);
  return { source, target };
}

async function validateAdminRule({ user, data, existing = null }) {
  const merged = validateRecommendationInput({ ...(existing || {}), ...data });
  const { source, target } = await validateWorkspaceProducts({ workspaceId: user.workspaceId, sourceProductId: merged.sourceProductId, targetProductId: merged.targetProductId });
  if (merged.status === 'active' && target.isActive === false) validation('active recommendations require an active target product');
  if (merged.outletId) await assertOutletAccess(user, merged.outletId);
  else if (!canAccessAllOutlets(user)) throw new AppError('FORBIDDEN', 'Outlet-scoped access is required for this rule', 403);
  return { merged, source, target };
}

async function assertRuleScope(user, outletId) {
  if (outletId) return assertOutletAccess(user, outletId);
  if (!canAccessAllOutlets(user)) throw new AppError('FORBIDDEN', 'Workspace-wide recommendation access is not allowed', 403);
}

async function writeAudit({ user, action, recommendationId, details }) {
  try {
    await auditLogsRepository.log({ workspaceId: user.workspaceId, actorId: user.id, action, resourceType: 'product_recommendation', resourceId: recommendationId, details });
  } catch (error) {
    console.error(`Failed to log ${action} audit log:`, error);
  }
}

export async function listRecommendationRules({ user, filters = {} }) {
  await assertRuleScope(user, filters.outletId);
  const rules = await productRecommendationsRepository.listRules({ workspaceId: user.workspaceId, ...filters });
  return { data: rules };
}

export async function createRecommendationRule({ user, data }) {
  const { merged } = await validateAdminRule({ user, data });
  const rule = await productRecommendationsRepository.createRule({ workspaceId: user.workspaceId, ...merged });
  await writeAudit({ user, action: 'product_recommendation.create', recommendationId: rule.id, details: { sourceProductId: rule.sourceProductId, targetProductId: rule.targetProductId, type: rule.recommendationType } });
  return rule;
}

export async function updateRecommendationRule({ user, recommendationId, data }) {
  const existing = await productRecommendationsRepository.findRuleById({ workspaceId: user.workspaceId, recommendationId });
  if (!existing) throw new AppError('NOT_FOUND', 'Recommendation rule not found', 404);
  const { merged } = await validateAdminRule({ user, data, existing });
  const rule = await productRecommendationsRepository.updateRule({ workspaceId: user.workspaceId, recommendationId, updates: merged });
  await writeAudit({ user, action: 'product_recommendation.update', recommendationId, details: { changed: Object.keys(data || {}) } });
  return rule;
}

export async function archiveRecommendationRule({ user, recommendationId }) {
  const existing = await productRecommendationsRepository.findRuleById({ workspaceId: user.workspaceId, recommendationId });
  if (!existing) return null;
  await assertRuleScope(user, existing.outletId);
  const rule = await productRecommendationsRepository.archiveRule({ workspaceId: user.workspaceId, recommendationId });
  await writeAudit({ user, action: 'product_recommendation.archive', recommendationId, details: {} });
  return rule;
}

export async function resolvePublicRecommendations({ workspaceId, outletId, cartProductIds = [], placement = PLACEMENT, limit = 3, now = new Date() }) {
  if (!workspaceId || !isUuid(outletId)) validation('workspaceId and outletId are required');
  if (placement !== PLACEMENT) validation('placement must be cart');
  if (!Array.isArray(cartProductIds) || cartProductIds.length > 50 || cartProductIds.some((id) => !isUuid(id))) validation('cartProductIds must contain at most 50 UUIDs');
  const normalizedCartIds = [...new Set(cartProductIds.map(String))];
  const rules = await productRecommendationsRepository.listActiveRulesForSources({ workspaceId, sourceProductIds: normalizedCartIds, outletId, placement, now: now.toISOString() });
  const eligibleRules = rules.filter((rule) => isInSchedule(rule, now));
  if (!eligibleRules.length) return [];
  const targetIds = [...new Set(eligibleRules.map((rule) => String(rule.targetProductId)))];
  const [products, availability, inventory, modifiersByProduct] = await Promise.all([
    productsRepository.findProductsByIds({ workspaceId, productIds: targetIds }),
    productsRepository.findAvailability({ workspaceId, outletId, productIds: targetIds }),
    inventoryRepository.list({ workspaceId, outletId, limit: 1000 }),
    modifiersRepository.listGroupsForProducts({ workspaceId, productIds: targetIds }),
  ]);
  const productsById = new Map(products.map((product) => [String(product.id), product]));
  const availabilityById = new Map(availability.map((row) => [String(row.productId), row]));
  const inventoryById = new Map(inventory.map((row) => [String(row.productId), row]));
  const cards = eligibleRules.map((rule) => {
    const product = productsById.get(String(rule.targetProductId));
    const outletAvailability = availabilityById.get(String(rule.targetProductId));
    if (!targetIsAvailable(product, outletAvailability, inventoryById.get(String(rule.targetProductId)), now)) return null;
    const price = outletAvailability?.priceOverride ?? product.basePrice ?? 0;
    return {
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description || '',
      image_url: product.thumbnailUrl || null,
      unit_price: Number(price),
      currency: product.currency || 'IDR',
      type: rule.recommendationType,
      actionType: rule.actionType || 'add',
      headline: rule.headline || null,
      sourceProductId: rule.sourceProductId,
      targetProductId: product.id,
      recommendationId: rule.id,
      priority: rule.priority,
      outletSpecificity: rule.outletId ? 1 : 0,
      modifiers: toPublicModifiers(modifiersByProduct.get(String(product.id)) || []),
    };
  }).filter(Boolean);
  return sortAndDedupeRecommendations(cards, normalizedCartIds).slice(0, Math.min(3, Math.max(1, Number(limit) || 3)))
    .map(({ priority, outletSpecificity, ...card }) => card);
}

function safeEventMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => ['cart_context'].includes(key) && typeof value === 'string').map(([key, value]) => [key, value.slice(0, 120)]));
}

export async function ingestRecommendationEvent({ workspaceId, outletId, event }) {
  const eventType = event?.eventType;
  if (!EVENTS.has(eventType)) validation('eventType is invalid');
  if (eventType === 'purchased') validation('purchased events are recorded only after verified payment');
  if (event?.placement && event.placement !== PLACEMENT) validation('placement must be cart');
  if (!isUuid(event?.targetProductId)) validation('targetProductId must be a UUID');
  if (event?.sourceProductId && !isUuid(event.sourceProductId)) validation('sourceProductId must be a UUID');
  if (event?.recommendationId && !isUuid(event.recommendationId)) validation('recommendationId must be a UUID');
  if (event?.cartId && !isUuid(event.cartId)) validation('cartId must be a UUID');
  if (event?.idempotencyKey && String(event.idempotencyKey).length > 160) validation('idempotencyKey is too long');
  if (event?.sessionId && String(event.sessionId).length > 160) validation('sessionId is too long');

  let rule = event.recommendationId
    ? await productRecommendationsRepository.findRuleById({ workspaceId, recommendationId: event.recommendationId })
    : null;
  if (!rule && event.sourceProductId) {
    rule = (await productRecommendationsRepository.listActiveRulesForSources({ workspaceId, sourceProductIds: [event.sourceProductId], outletId, placement: PLACEMENT })).find((candidate) => String(candidate.targetProductId) === String(event.targetProductId));
  }
  if (rule && event.sourceProductId && String(rule.sourceProductId) !== String(event.sourceProductId)) validation('recommendation event source does not match the server-side rule');
  if (!rule || rule.status !== 'active' || !isInSchedule(rule) || String(rule.targetProductId) !== String(event.targetProductId) || (rule.outletId && String(rule.outletId) !== String(outletId))) validation('recommendation event does not match an active server-side rule');
  const product = await productsRepository.findById({ workspaceId, productId: event.targetProductId });
  if (!product) validation('targetProductId is not in this workspace');
  if (event.cartId) {
    const cart = await cartsRepository.findById({ workspaceId, cartId: event.cartId });
    if (!cart || String(cart.outletId) !== String(outletId)) validation('cartId is not valid for this storefront outlet');
  }
  try {
    return { recorded: true, event: await productRecommendationsRepository.recordEvent({
      workspaceId, outletId, recommendationId: rule.id, sourceProductId: rule.sourceProductId, targetProductId: rule.targetProductId,
      cartId: event.cartId || null, sessionId: event.sessionId || null, eventType, placement: PLACEMENT,
      idempotencyKey: event.idempotencyKey || null, metadata: safeEventMetadata(event.metadata),
    }) };
  } catch (error) {
    console.warn('Recommendation event tracking failed:', error.message);
    return { recorded: false };
  }
}

export async function attributePaidOrder({ workspaceId, order }) {
  if (!order || String(order.paymentStatus || order.payment_status).toLowerCase() !== 'paid') return { attributed: 0 };
  const items = Array.isArray(order.items) ? order.items : [];
  const targetProductIds = [...new Set(items.map((item) => item.productId || item.product_id).filter(Boolean).map(String))];
  if (!targetProductIds.length) return { attributed: 0 };
  const events = await productRecommendationsRepository.listEventsForAttribution({ workspaceId, cartId: order.cartId, sessionId: order.metadata?.recommendationSessionId, targetProductIds });
  const itemByProduct = new Map(items.map((item) => [String(item.productId || item.product_id), item]));
  const seen = new Set();
  let attributed = 0;
  for (const event of events) {
    const key = `${event.recommendationId}:${event.targetProductId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const item = itemByProduct.get(String(event.targetProductId));
    if (!item) continue;
    await productRecommendationsRepository.recordEvent({
      workspaceId, recommendationId: event.recommendationId, sourceProductId: event.sourceProductId, targetProductId: event.targetProductId,
      outletId: order.outletId, orderId: order.id, cartId: order.cartId, sessionId: event.sessionId, eventType: 'purchased', placement: PLACEMENT,
      idempotencyKey: `purchased:${order.id}:${event.recommendationId}:${event.targetProductId}`,
      metadata: { attributedRevenue: Number(item.subtotalAmount ?? item.subtotal ?? (item.unitPrice || 0) * (item.quantity || 0)) },
    });
    attributed += 1;
  }
  return { attributed };
}

export async function getRecommendationReport({ user, filters = {} }) {
  await assertRuleScope(user, filters.outletId);
  const rules = await productRecommendationsRepository.listRules({ workspaceId: user.workspaceId, status: filters.status, outletId: filters.outletId, recommendationType: filters.recommendationType, page: 1, limit: 1000 });
  const events = await productRecommendationsRepository.listRulePerformance({ workspaceId: user.workspaceId, recommendationIds: rules.map((rule) => rule.id), from: filters.from, to: filters.to, outletId: filters.outletId });
  const byRule = new Map(rules.map((rule) => [String(rule.id), { recommendationId: rule.id, impressions: 0, clicks: 0, accepted: 0, purchases: 0, revenue: 0 }]));
  for (const event of events) {
    const row = byRule.get(String(event.recommendationId));
    if (!row) continue;
    if (event.eventType === 'impression') row.impressions += 1;
    if (event.eventType === 'clicked') row.clicks += 1;
    if (event.eventType === 'accepted') row.accepted += 1;
    if (event.eventType === 'purchased') { row.purchases += 1; row.revenue += Number(event.metadata?.attributedRevenue || 0); }
  }
  return { data: [...byRule.values()].map((row) => ({ ...row, acceptanceRate: row.impressions ? row.accepted / row.impressions : null, purchaseConversion: row.accepted ? row.purchases / row.accepted : null })) };
}

export const productRecommendationInternals = { isUuid, isInSchedule, targetIsAvailable, safeEventMetadata };
