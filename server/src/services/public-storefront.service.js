import crypto from 'node:crypto';
import { contactsRepository, ordersRepository, outletLocationsRepository, outletsRepository, paymentsRepository, storefrontsRepository, workspacesRepository, idempotencyRepository } from '../db/repositories/index.js';
import { listCustomerProductsForOutlet } from './product.service.js';
import { getQrStoreContext } from './qr-order-session.service.js';
import { createOrderFromCheckout } from './order.service.js';
import { createPaymentSessionForOrder, syncPaymentWithProvider, toPaymentSessionResponse } from './payment.service.js';
import { derivePublicOrderStatus } from '../orders/order-types.js';
import { AppError } from '../utils/errors.js';
import { getSupabaseServiceClient } from '../db/supabase.js';
import { mapRow } from '../db/supabase-mapper.js';
import { recordSecurityEvent } from './security-event.service.js';

const MAX_PUBLIC_CART_QUANTITY = 99;

function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase();
}

function stableHash(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function isOutletOrderable(outlet) {
  if (!outlet) return false;
  if (String(outlet.status || '').toLowerCase() !== 'active') return false;
  if (outlet.storefrontOutlet) {
    return outlet.storefrontOutlet.isVisible !== false && outlet.storefrontOutlet.orderingEnabled !== false && outlet.storefrontOutlet.pickupEnabled !== false;
  }
  const metadata = outlet.metadata || {};
  return metadata.isVisible !== false && metadata.visible !== false && metadata.orderingEnabled !== false && metadata.acceptsOrders !== false && metadata.pickupEnabled !== false;
}

function getModifierGroups(product = {}) {
  const metadata = product.metadata || {};
  const candidates = [product.modifiers, metadata.modifiers, metadata.modifierGroups, metadata.modifier_groups];
  return candidates.find(Array.isArray) || [];
}

function normalizeModifierOption(option = {}, index = 0) {
  const id = option.id || option.optionId || option.option_id || option.value || option.name || `option_${index + 1}`;
  return {
    id: String(id),
    name: option.name || option.label || option.optionName || option.option_name || String(id),
    price_delta: Number(option.priceDelta ?? option.price_delta ?? option.price ?? option.amount ?? 0) || 0,
  };
}

function normalizeModifierGroup(group = {}, index = 0) {
  const id = group.id || group.groupId || group.group_id || group.modifierGroupId || group.modifier_group_id || group.name || `group_${index + 1}`;
  const options = Array.isArray(group.options) ? group.options : Array.isArray(group.values) ? group.values : [];
  const min = group.minSelections ?? group.min_selections ?? group.minSelected ?? group.min_selected ?? group.min ?? null;
  const max = group.maxSelections ?? group.max_selections ?? group.maxSelected ?? group.max_selected ?? group.max ?? null;
  return {
    id: String(id),
    name: group.name || group.label || String(id),
    min_selections: min == null ? null : Number(min),
    max_selections: max == null ? null : Number(max),
    required: group.required === true,
    options: options.map(normalizeModifierOption),
  };
}

function toPublicModifierGroups(product = {}) {
  return getModifierGroups(product)
    .map(normalizeModifierGroup)
    .filter((group) => group.id && group.options.length > 0)
    .map((group) => ({
      id: group.id,
      name: group.name,
      ...(Number.isFinite(group.min_selections) ? { min_selections: group.min_selections } : {}),
      ...(Number.isFinite(group.max_selections) ? { max_selections: group.max_selections } : {}),
      required: group.required,
      options: group.options.map((option) => ({ id: option.id, name: option.name, price_delta: option.price_delta })),
    }));
}

function getWorkspacePublicSettings(workspace = {}, settings = {}) {
  const metadata = { ...(workspace.metadata || {}), ...(settings.metadata || {}) };
  const publicStore = metadata.publicStore || metadata.public_store || {};
  const slug = normalizeSlug(publicStore.slug || metadata.storefrontSlug || metadata.storefront_slug || workspace.slug || workspace.id);
  return {
    slug,
    brandline: publicStore.brandline || metadata.brandline || null,
    orderingEnabled: publicStore.orderingEnabled ?? metadata.orderingEnabled ?? true,
    metadata,
  };
}

function toPublicOutlet(outlet, storefrontOutlet = {}, location = null) {
  const metadata = outlet.metadata || {};
  const latitude = Number(location?.latitude ?? metadata.latitude);
  const longitude = Number(location?.longitude ?? metadata.longitude);
  const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  return {
    id: outlet.id,
    name: outlet.name,
    address: outlet.address || null,
    city: outlet.city || null,
    is_open: String(outlet.status || '').toLowerCase() === 'active',
    ordering_enabled: storefrontOutlet.orderingEnabled ?? (metadata.orderingEnabled !== false && metadata.acceptsOrders !== false),
    pickup_enabled: storefrontOutlet.pickupEnabled ?? (metadata.pickupEnabled !== false),
    dine_in_enabled: storefrontOutlet.dineInEnabled === true,
    takeaway_enabled: storefrontOutlet.takeawayEnabled === true,
    ...(hasValidCoordinates ? { latitude, longitude } : {}),
    ...(location?.googleMapsUri || metadata.googleMapsLink || metadata.googleMapsUrl
      ? { google_maps_url: location?.googleMapsUri || metadata.googleMapsLink || metadata.googleMapsUrl }
      : {}),
  };
}

function toPublicProduct(product) {
  const availability = product.outletAvailability || {};
  const price = Number(availability.priceOverride ?? product.basePrice ?? product.price ?? 0);
  const isAvailable = product.isActive !== false && availability.isAvailable !== false && String(availability.status || 'active').toLowerCase() === 'active';
  return {
    id: product.id,
    name: product.name,
    slug: product.slug || null,
    description: product.shortDescription || product.description || '',
    category: product.category || product.metadata?.category || 'Menu',
    image_url: product.thumbnailUrl || null,
    currency: product.currency || 'IDR',
    unit_price: price,
    availability: isAvailable ? 'available' : 'unavailable',
    modifiers: toPublicModifierGroups(product),
  };
}

function validateAndPriceModifiers({ product, modifiers }) {
  const modifierGroups = new Map((product.modifiers || []).map((group) => [String(group.id), group]));
  if (!Array.isArray(modifiers)) return { errors: [{ code: 'INVALID_MODIFIER_PAYLOAD', product_id: product.id, message: 'Modifiers must be an array.' }], modifiers: [], totalPriceDelta: 0 };

  const errors = [];
  const selectedByGroup = new Map();
  const normalized = [];

  for (const modifier of modifiers) {
    const groupId = modifier?.modifier_group_id || modifier?.modifierGroupId || modifier?.group_id || modifier?.groupId;
    const optionId = modifier?.option_id || modifier?.optionId || modifier?.id;
    const group = modifierGroups.get(String(groupId));
    if (!group) {
      errors.push({ code: 'INVALID_MODIFIER_GROUP', product_id: product.id, modifier_group_id: groupId || null, message: 'Modifier group is not valid for this product.' });
      continue;
    }
    const option = (group.options || []).find((candidate) => String(candidate.id) === String(optionId));
    if (!option) {
      errors.push({ code: 'INVALID_MODIFIER_OPTION', product_id: product.id, modifier_group_id: group.id, option_id: optionId || null, message: 'Modifier option is not valid for this group.' });
      continue;
    }
    selectedByGroup.set(group.id, (selectedByGroup.get(group.id) || 0) + 1);
    normalized.push({
      modifier_group_id: group.id,
      option_id: option.id,
      name: group.name,
      option_name: option.name,
      price_delta: option.price_delta,
    });
  }

  for (const group of modifierGroups.values()) {
    const selectedCount = selectedByGroup.get(group.id) || 0;
    const minSelections = Number.isFinite(group.min_selections) ? group.min_selections : (group.required ? 1 : null);
    const maxSelections = Number.isFinite(group.max_selections) ? group.max_selections : null;
    if (minSelections != null && selectedCount < minSelections) {
      errors.push({ code: 'MODIFIER_MIN_SELECTIONS', product_id: product.id, modifier_group_id: group.id, message: `Select at least ${minSelections} option(s) for ${group.name}.` });
    }
    if (maxSelections != null && selectedCount > maxSelections) {
      errors.push({ code: 'MODIFIER_MAX_SELECTIONS', product_id: product.id, modifier_group_id: group.id, message: `Select at most ${maxSelections} option(s) for ${group.name}.` });
    }
  }

  return {
    errors,
    modifiers: normalized,
    totalPriceDelta: normalized.reduce((sum, modifier) => sum + Number(modifier.price_delta || 0), 0),
  };
}

function emptyCartSnapshot() {
  return {
    currency: 'IDR',
    subtotal_amount: 0,
    discount_amount: 0,
    service_fee_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    items: [],
  };
}

async function findWorkspaceByStorefrontSlug(storefrontSlug) {
  const slug = normalizeSlug(storefrontSlug);
  if (!slug) throw new AppError('STORE_NOT_FOUND', 'Storefront not found', 404);

  const storefront = await storefrontsRepository.findActiveBySlug({ slug });
  if (storefront) {
    const workspace = await workspacesRepository.findById(storefront.workspaceId);
    if (workspace && String(workspace.status || '').toLowerCase() === 'active') {
      const settings = await workspacesRepository.getSettings(workspace.id).catch(() => null);
      return {
        workspace,
        settings,
        storefront,
        publicSettings: {
          slug: storefront.slug,
          brandline: storefront.brandline || null,
          orderingEnabled: storefront.orderingEnabled !== false,
          metadata: storefront.metadata || {},
        },
      };
    }
  }

  const client = getSupabaseServiceClient();
  const result = await client.from('workspaces').select('*').eq('status', 'active');
  if (result.error) throw result.error;
  for (const row of result.data || []) {
    const workspace = mapRow(row);
    const settings = await workspacesRepository.getSettings(workspace.id).catch(() => null);
    const publicSettings = getWorkspacePublicSettings(workspace, settings || {});
    if (publicSettings.slug === slug) return { workspace, settings, publicSettings };
  }
  throw new AppError('STORE_NOT_FOUND', 'Storefront not found', 404);
}

async function buildPublicMenu({ workspaceId, outletId, page = 0, limit = 24, category, search }) {
  const { products, categories, pagination } = await listCustomerProductsForOutlet({ workspaceId, outletId, page, limit, category, search });
  const publicProducts = products.map(toPublicProduct);
  return {
    categories: categories.map((name) => ({ id: `cat_${String(name).trim().toLowerCase()}`, name })),
    products: publicProducts,
    pagination,
  };
}

export async function getPublicStorefront({ storefrontSlug, outletId, page, limit, category, search, includeMenu = true }) {
  const { workspace, settings, storefront: storefrontRecord, publicSettings } = await findWorkspaceByStorefrontSlug(storefrontSlug);
  if (publicSettings.orderingEnabled === false) throw new AppError('STORE_INACTIVE', 'Storefront is not accepting orders', 403);
  const mappedStorefrontOutlets = storefrontRecord
    ? await storefrontsRepository.listActiveOutlets({ workspaceId: workspace.id, storefrontId: storefrontRecord.id })
    : [];
  const outlets = mappedStorefrontOutlets.length > 0
    ? mappedStorefrontOutlets.map((row) => ({ ...row.outlet, storefrontOutlet: row })).filter((outlet) => outlet.id)
    : await outletsRepository.findActiveByWorkspace(workspace.id);
  const publicOutlets = outlets.filter(isOutletOrderable);
  const outletLocations = await outletLocationsRepository.listVerifiedEligible(workspace.id).catch(() => []);
  const locationByOutletId = new Map(outletLocations.map((location) => [String(location.outletId), location]));
  if (outletId && !publicOutlets.some((outlet) => String(outlet.id) === String(outletId))) {
    throw new AppError('OUTLET_UNAVAILABLE', 'Outlet is not available for ordering', 409);
  }
  const selectedOutlet = outletId ? publicOutlets.find((outlet) => String(outlet.id) === String(outletId)) : publicOutlets[0];
  const menu = includeMenu && selectedOutlet
    ? await buildPublicMenu({ workspaceId: workspace.id, outletId: selectedOutlet.id, page, limit, category, search })
    : { categories: [], products: [], pagination: { page: 0, limit: 0, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  const storefrontMetadata = storefrontRecord?.metadata || {};

  const response = {
    storefront: {
      id: workspace.id,
      slug: publicSettings.slug,
      name: storefrontRecord?.name || settings?.businessDisplayName || workspace.name,
      brandline: publicSettings.brandline,
      description: storefrontMetadata.description || '',
      ordering_enabled: true,
      theme: {
        ...(publicSettings.theme || {}),
        logoUrl: storefrontMetadata.logoUrl || storefrontMetadata.logo_url || publicSettings.theme?.logoUrl || null,
        faviconUrl: storefrontMetadata.faviconUrl || storefrontMetadata.favicon_url || null,
      },
      banner: {
        imageUrl: storefrontMetadata.bannerUrl || storefrontMetadata.banner_url || null,
        linkUrl: storefrontMetadata.bannerLinkUrl || storefrontMetadata.banner_link_url || '',
        title: storefrontMetadata.bannerTitle || 'Promo Store',
      },
      banners: Array.isArray(storefrontMetadata.banners)
        ? storefrontMetadata.banners.slice(0, 5).map((banner) => ({
          imageUrl: banner.imageUrl || banner.image_url || null,
          linkUrl: banner.linkUrl || banner.link_url || '',
          title: banner.title || storefrontMetadata.bannerTitle || 'Promo Store',
        })).filter((banner) => banner.imageUrl)
        : [],
      bannerIntervalSeconds: Math.min(60, Math.max(2, Number(storefrontMetadata.bannerIntervalSeconds || storefrontMetadata.banner_interval_seconds || 5))),
    },
    outlets: publicOutlets.map((outlet) => toPublicOutlet(outlet, outlet.storefrontOutlet || {}, locationByOutletId.get(String(outlet.id)))),
    menu,
  };
  Object.defineProperty(response, 'internal', {
    value: { storefrontId: storefrontRecord?.id || null, workspaceId: workspace.id },
    enumerable: false,
  });
  return response;
}

export async function getPublicStoreMenu({ storefrontSlug, outletId, page, limit, category, search }) {
  const { workspace, storefront: storefrontRecord, publicSettings } = await findWorkspaceByStorefrontSlug(storefrontSlug);
  if (publicSettings.orderingEnabled === false) throw new AppError('STORE_INACTIVE', 'Store is not accepting orders', 403);
  const mappedStorefrontOutlets = storefrontRecord
    ? await storefrontsRepository.listActiveOutlets({ workspaceId: workspace.id, storefrontId: storefrontRecord.id })
    : [];
  const outlets = mappedStorefrontOutlets.length > 0
    ? mappedStorefrontOutlets.map((row) => ({ ...row.outlet, storefrontOutlet: row })).filter((outlet) => outlet.id)
    : await outletsRepository.findActiveByWorkspace(workspace.id);
  const selectedOutlet = (outletId ? outlets.find((outlet) => String(outlet.id) === String(outletId)) : outlets.find(isOutletOrderable));
  if (!selectedOutlet || !isOutletOrderable(selectedOutlet)) throw new AppError('OUTLET_UNAVAILABLE', 'Outlet is not available for ordering', 409);
  return buildPublicMenu({ workspaceId: workspace.id, outletId: selectedOutlet.id, page, limit, category, search });
}

async function resolvePublicOrderContext({ channel, storefrontSlug, outletId, qrToken }) {
  if (channel === 'qr_store') {
    const qrContext = await getQrStoreContext({ qrToken, outletId });
    const isUniversalQr = qrContext.qr_session?.scope === 'universal' || qrContext.qr_session?.qr_type === 'universal';
    if (isUniversalQr && !outletId) {
      throw new AppError('QR_OUTLET_REQUIRED', 'Pilih outlet terlebih dahulu untuk Universal QR.', 400);
    }
    if (!qrContext.outlet) {
      throw new AppError('QR_OUTLET_REQUIRED', 'Pilih outlet terlebih dahulu untuk melanjutkan.', 400);
    }
    if (!isUniversalQr && outletId && String(outletId) !== String(qrContext.outlet.id)) {
      throw new AppError('QR_OUTLET_MISMATCH', 'QR ini hanya berlaku untuk outlet yang tertera.', 409);
    }
    return {
      workspaceId: qrContext.qr_session.workspace_id,
      outletId: qrContext.outlet.id,
      outlet: qrContext.outlet,
      qrContext,
      storefront: null,
    };
  }

  const storefront = await getPublicStorefront({ storefrontSlug, outletId });
  const selectedOutlet = storefront.outlets.find((outlet) => String(outlet.id) === String(outletId));
  if (!selectedOutlet) throw new AppError('OUTLET_NOT_FOUND', 'Outlet not found', 404);
  if (!selectedOutlet.ordering_enabled || !selectedOutlet.pickup_enabled || !selectedOutlet.is_open) {
    throw new AppError('OUTLET_UNAVAILABLE', 'Outlet is not available for ordering', 409);
  }
  return {
    workspaceId: storefront.storefront.id,
    outletId: selectedOutlet.id,
    outlet: selectedOutlet,
    qrContext: null,
    storefront,
  };
}

export async function validatePublicCart({ channel = 'online_store', storefrontSlug, outletId, qrToken, qrSessionToken, fulfillmentType = 'pickup', items = [] }) {
  const normalizedChannel = channel === 'qr_store' ? 'qr_store' : 'online_store';
  if (fulfillmentType && fulfillmentType !== 'pickup') {
    throw new AppError('ORDER_PICKUP_ONLY', 'Current alpha checkout supports pickup only', 400);
  }
  let context = normalizedChannel === 'qr_store'
    ? await resolvePublicOrderContext({ channel: normalizedChannel, storefrontSlug, outletId, qrToken: qrToken || qrSessionToken })
    : null;
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, errors: [{ code: 'CART_EMPTY', message: 'Cart must contain at least one item.' }], cart_snapshot: emptyCartSnapshot(), warnings: [] };
  }

  context ||= await resolvePublicOrderContext({ channel: normalizedChannel, storefrontSlug, outletId, qrToken: qrToken || qrSessionToken });
  const menu = await buildPublicMenu({ workspaceId: context.workspaceId, outletId: context.outletId, limit: Number.MAX_SAFE_INTEGER });
  const productsById = new Map(menu.products.map((product) => [String(product.id), product]));
  const errors = [];
  const snapshotItems = [];

  for (const item of items) {
    const productId = item.product_id || item.productId;
    const quantity = Number(item.quantity || 0);
    const product = productsById.get(String(productId));
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_PUBLIC_CART_QUANTITY) {
      errors.push({ code: 'INVALID_QUANTITY', product_id: productId, message: 'Quantity is invalid.' });
      continue;
    }
    if (!product) {
      errors.push({ code: 'PRODUCT_UNAVAILABLE', product_id: productId, message: 'Product is not available at this outlet.' });
      continue;
    }
    const modifierValidation = validateAndPriceModifiers({ product, modifiers: item.modifiers || [] });
    if (modifierValidation.errors.length > 0) {
      errors.push(...modifierValidation.errors);
      continue;
    }
    const unitPrice = Number(product.unit_price || 0);
    const unitPriceWithModifiers = unitPrice + modifierValidation.totalPriceDelta;
    snapshotItems.push({
      product_id: product.id,
      product_name: product.name,
      image_url: product.thumbnailUrl || null,
      quantity,
      unit_price: unitPrice,
      modifier_total: modifierValidation.totalPriceDelta,
      unit_total: unitPriceWithModifiers,
      line_total: unitPriceWithModifiers * quantity,
      availability: 'available',
      modifiers: modifierValidation.modifiers,
      note: String(item.note || '').slice(0, 300) || null,
    });
  }

  const subtotal = snapshotItems.reduce((sum, item) => sum + item.line_total, 0);
  return {
    valid: errors.length === 0,
    cart_snapshot: {
      currency: 'IDR',
      subtotal_amount: subtotal,
      discount_amount: 0,
      service_fee_amount: 0,
      tax_amount: 0,
      total_amount: subtotal,
      items: snapshotItems,
    },
    errors,
    warnings: [],
    context,
  };
}

function toCheckoutLikePayload({ validation, customer, contactId, idempotencyKey, customerNote, channel, recommendationSessionId }) {
  const snapshot = validation.cart_snapshot;
  const context = validation.context;
  const qrContext = context.qrContext?.qr_context || null;
  return {
    id: null,
    outletId: context.outletId,
    contactId: contactId || null,
    chatId: null,
    channel,
    qrSessionId: context.qrContext?.qr_session?.id || null,
    tableId: qrContext?.table_id || null,
    qrLocationId: qrContext?.qr_location_id || null,
    qrLocationLabel: qrContext?.location_label || null,
    metadata: {
      publicStorefrontId: context.storefront?.internal?.storefrontId || null,
      publicStorefrontSlug: context.storefront?.slug || null,
      qrCodeId: context.qrContext?.qr_session?.qr_code_id || null,
      qrScope: context.qrContext?.qr_session?.scope || null,
      qrType: context.qrContext?.qr_session?.qr_type || null,
      ...(recommendationSessionId ? { recommendationSessionId } : {}),
      qrLocation: qrContext ? {
        id: qrContext.qr_location_id || null,
        label: qrContext.location_label || null,
        locationType: qrContext.location_type || null,
        fulfillmentType: qrContext.fulfillment_type || null,
      } : null,
      idempotencyKey,
    },
    customerSnapshot: {
      name: customer?.name || null,
      contactName: customer?.name || null,
      phone: customer?.phone || null,
    },
    fulfillmentSnapshot: {
      method: qrContext?.fulfillment_type || 'pickup',
      outletName: context.outlet?.name || null,
      qrLocation: qrContext ? {
        id: qrContext.qr_location_id || null,
        label: qrContext.location_label || null,
        locationType: qrContext.location_type || null,
      } : null,
      customerNote: customerNote || null,
    },
    subtotalAmount: snapshot.subtotal_amount,
    totalAmount: snapshot.total_amount,
    currency: snapshot.currency,
    items: snapshot.items.map((item) => ({
      productId: item.product_id,
      productNameSnapshot: item.product_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      subtotalAmount: item.line_total,
      metadata: { modifiers: item.modifiers, note: item.note, imageUrl: item.image_url || null },
    })),
  };
}

function idempotencyProcessingResponse() {
  return {
    idempotency: {
      status: 'processing',
      message: 'Checkout request is already being processed. Retry with the same Idempotency-Key shortly.',
    },
    next: { retry_after_seconds: 5 },
  };
}

function buildIdempotencyFailureError(record) {
  return new AppError('PAYMENT_CREATION_RECOVERY_REQUIRED', 'Checkout payment creation is in a recoverable failed state. Retry the same Idempotency-Key after operational recovery.', 503, {
    idempotency: {
      status: 'failed',
      retryable: true,
      reference: record?.id || null,
    },
  });
}

function sanitizePaymentCreationError(err) {
  return {
    code: err?.code || 'PAYMENT_CREATION_FAILED',
    message: 'Payment session creation failed after checkout was accepted.',
    status: err?.status || err?.statusCode || 503,
    failed_at: new Date().toISOString(),
    recovery: 'Inspect order_idempotency_records.error_snapshot/resource_id and create or reconcile the missing payment before retrying the same key.',
  };
}

async function resolveExistingIdempotencyClaim({ record, requestHash, workspaceId = null }) {
  if (record?.requestHash !== requestHash) {
    await recordSecurityEvent({
      workspaceId,
      eventType: 'checkout.idempotency_conflict',
      severity: 'medium',
      metadata: { idempotencyRecordId: record?.id || null, commandType: 'public_checkout' },
    });
    throw new AppError('IDEMPOTENCY_KEY_CONFLICT', 'Request checkout berbeda dengan request sebelumnya.', 409);
  }
  if (record?.responseSnapshot) return record.responseSnapshot;
  if (record?.status === 'failed' || record?.errorSnapshot) throw buildIdempotencyFailureError(record);
  return idempotencyProcessingResponse();
}

async function claimIdempotencyRecord({ workspaceId, idempotencyKey, requestHash }) {
  return idempotencyRepository.claimProcessing({
    workspaceId,
    key: idempotencyKey,
    commandType: 'public_checkout',
    requestHash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

async function completeIdempotencyRecord({ workspaceId, idempotencyKey, orderId, responseSnapshot }) {
  return idempotencyRepository.markCompleted({
    workspaceId,
    key: idempotencyKey,
    commandType: 'public_checkout',
    resourceId: orderId,
    responseJson: responseSnapshot,
  });
}

async function failIdempotencyRecord({ workspaceId, idempotencyKey, orderId, errorSnapshot }) {
  return idempotencyRepository.markFailed({
    workspaceId,
    key: idempotencyKey,
    commandType: 'public_checkout',
    resourceId: orderId,
    errorJson: errorSnapshot,
  });
}

function toPublicCheckoutOrder(order) {
  return {
    id: order.publicOrderToken,
    order_number: order.orderNumber,
    public_order_token: order.publicOrderToken,
    channel: order.channel || 'online_store',
    outlet_id: order.outletId,
    fulfillment_type: order.fulfillmentType || 'pickup',
    payment_status: order.paymentStatus,
    fulfillment_status: order.fulfillmentStatus,
    public_order_status: derivePublicOrderStatus(order),
    total_amount: Number(order.totalAmount || order.totals?.total || 0),
    currency: order.currency || order.totals?.currency || 'IDR',
    created_at: order.createdAt,
  };
}

function toPublicCheckoutPayment(payment) {
  const response = payment?.paymentId ? payment : toPaymentSessionResponse(payment);
  return {
    id: response?.paymentId,
    provider: response?.provider,
    status: response?.status,
    payment_url: response?.paymentUrl || null,
    expires_at: response?.expiresAt || null,
    amount: response?.amount || 0,
    currency: response?.currency || 'IDR',
  };
}

export async function createPublicCheckout({ idempotencyKey, body }) {
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim();
  if (!normalizedIdempotencyKey) throw new AppError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required', 400);
  if (!body?.customer?.name?.trim()) throw new AppError('CUSTOMER_NAME_REQUIRED', 'Customer name is required', 400);
  if (!body?.customer?.phone?.trim()) throw new AppError('CUSTOMER_PHONE_REQUIRED', 'Customer phone is required', 400);
  const channel = body?.channel === 'qr_store' ? 'qr_store' : 'online_store';
  const validation = await validatePublicCart({ ...body, channel, outletId: body?.outlet_id || body?.outletId, qrToken: body?.qr_token || body?.qrToken || body?.qr_session_token || body?.qrSessionToken, fulfillmentType: body?.fulfillment_type || body?.fulfillmentType || 'pickup' });
  if (!validation.valid) throw new AppError('CART_INVALID', 'Cart is invalid', 400, { errors: validation.errors });

  const safePayload = {
    channel,
    storefrontSlug: body?.storefront_slug || body?.storefrontSlug || null,
    outletId: validation.context.outletId,
    qrToken: channel === 'qr_store' ? (body?.qr_token || body?.qrToken || body?.qr_session_token || body?.qrSessionToken || null) : null,
    fulfillmentType: 'pickup',
    customer: { name: body?.customer?.name.trim(), phone: body?.customer?.phone.trim() },
    items: validation.cart_snapshot.items,
    customerNote: body?.customer?.note || body?.customer_note || body?.customerNote || null,
    recommendationSessionId: body?.recommendationSessionId || body?.recommendation_session_id || null,
  };
  const requestHash = stableHash(safePayload);
  const workspaceId = validation.context.workspaceId;
  const claim = await claimIdempotencyRecord({ workspaceId, idempotencyKey: normalizedIdempotencyKey, requestHash });
  if (!claim.claimed) {
    return resolveExistingIdempotencyClaim({ record: claim.record, requestHash, workspaceId });
  }

  const checkout = toCheckoutLikePayload({
    validation,
    customer: safePayload.customer,
    contactId: (await contactsRepository.upsertPublicStoreCustomer({
      workspaceId,
      name: safePayload.customer.name,
      phone: safePayload.customer.phone,
      email: null,
      password: null,
      storefrontSlug: safePayload.storefrontSlug,
      outletId: safePayload.outletId,
    }))?.id,
    idempotencyKey: normalizedIdempotencyKey,
    customerNote: safePayload.customerNote,
    channel,
    recommendationSessionId: safePayload.recommendationSessionId,
  });
  const order = await createOrderFromCheckout({ workspaceId, checkout, user: null });
  let payment;
  try {
    payment = await createPaymentSessionForOrder({
      user: null,
      workspaceId,
      orderId: order.id,
      customer: safePayload.customer,
      idempotencyKey: normalizedIdempotencyKey,
    });
  } catch (err) {
    const errorSnapshot = sanitizePaymentCreationError(err);
    await failIdempotencyRecord({ workspaceId, idempotencyKey: normalizedIdempotencyKey, orderId: order.id, errorSnapshot }).catch(() => null);
    throw new AppError('PAYMENT_CREATION_FAILED', 'Payment session could not be created. The checkout is recorded for safe recovery; retry with the same Idempotency-Key after recovery.', 503, {
      idempotency: { status: 'failed', retryable: true },
    });
  }
  const response = {
    order: toPublicCheckoutOrder(order),
    payment: toPublicCheckoutPayment(payment),
    next: {
      payment_pending_url: `/payment/pending/${payment.paymentId}`,
      public_order_url: `/order/${order.publicOrderToken}`,
    },
  };
  await completeIdempotencyRecord({ workspaceId, idempotencyKey: normalizedIdempotencyKey, orderId: order.id, responseSnapshot: response });
  return response;
}

export async function getPublicPaymentStatus({ paymentId, publicOrderToken }) {
  if (!publicOrderToken) throw new AppError('PAYMENT_NOT_FOUND', 'Payment not found', 404);
  let payment = await paymentsRepository.findByIdGlobal({ paymentId });
  if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 'Payment not found', 404);
  if (['pending', 'processing'].includes(String(payment.status || '').toLowerCase()) && payment.providerTransactionId) {
    try {
      await syncPaymentWithProvider({ workspaceId: payment.workspaceId, paymentId: payment.id });
      payment = await paymentsRepository.findByIdGlobal({ paymentId }) || payment;
    } catch (error) {
      // The payment page can continue polling when the provider status is temporarily unavailable.
      console.warn(`[PublicPaymentStatus] Provider sync skipped for ${paymentId}:`, error.message);
    }
  }
  let order = payment.orderId ? await ordersRepository.workspaceFindById({ workspaceId: payment.workspaceId, orderId: payment.orderId }) : null;
  if (!order?.publicOrderToken) throw new AppError('PAYMENT_NOT_FOUND', 'Payment not found', 404);
  if (String(order.publicOrderToken) !== String(publicOrderToken)) throw new AppError('PAYMENT_NOT_FOUND', 'Payment not found', 404);
  if (payment.status === 'paid' && order.paymentStatus !== 'paid') {
    await ordersRepository.syncPaidOrderFromPayment({ workspaceId: payment.workspaceId, orderId: payment.orderId });
    order = await ordersRepository.workspaceFindById({ workspaceId: payment.workspaceId, orderId: payment.orderId });
  }
  const pending = ['pending', 'processing'].includes(String(payment.status || '').toLowerCase());
  return {
    payment: {
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      amount: Number(payment.amount || 0),
      currency: payment.currency || 'IDR',
      expires_at: payment.expiresAt || null,
      ...(pending ? { payment_url: payment.paymentUrl || payment.paymentLink || null } : {}),
      ...(payment.status === 'paid' ? { paid_at: payment.paidAt || null } : {}),
    },
    order: {
      public_order_token: order.publicOrderToken,
      public_order_status: derivePublicOrderStatus(order),
    },
  };
}

export const publicStorefrontInternals = {
  stableHash,
  toPublicProduct,
  toPublicOutlet,
  toCheckoutLikePayload,
  emptyCartSnapshot,
  normalizeSlug,
  isOutletOrderable,
  toPublicModifierGroups,
  validateAndPriceModifiers,
  idempotencyProcessingResponse,
  sanitizePaymentCreationError,
  resolveExistingIdempotencyClaim,
};
