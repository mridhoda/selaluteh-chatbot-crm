import { productsRepository } from '../db/repositories/index.js';
import { assertOutletAccess, buildOutletScopedQuery, canManageWorkspace } from './access-control.service.js';
import { AppError } from '../utils/errors.js';
import { resolveEffectivePrice } from './effective-price.service.js';
import { auditLogsRepository } from '../db/repositories/audit-logs.supabase.repository.js';

export async function listProducts({ user, outletId, status, search, page, limit, sort }) {
  const workspaceId = user.workspaceId;
  const products = await productsRepository.list({ workspaceId, status, search, page, limit, sort });
  const total = await productsRepository.count({ workspaceId, status, search });

  if (!outletId) {
    return { data: products, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
  }

  await assertOutletAccess(user, outletId);
  const availability = await productsRepository.findAvailabilityByOutlet({
    workspaceId,
    outletId,
    productIds: products.map((p) => p.id),
  });

  const availabilityByProduct = new Map(availability.map((row) => [String(row.productId), row]));
  const enriched = products.map((product) => ({
    ...product,
    outletAvailability: availabilityByProduct.get(String(product.id)) || null,
  }));

  return { data: enriched, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function listTelegramProductsForOutlet({ workspaceId, outletId, page = 0, limit = 8 }) {
  if (!workspaceId) throw new AppError('VALIDATION', 'workspace_id is required', 400);
  if (!outletId) throw new AppError('VALIDATION', 'outlet_id is required for customer-facing product list', 400);

  const products = await productsRepository.findProducts({ workspaceId, isActive: true });
  const availability = await productsRepository.findAvailabilityByOutlet({
    workspaceId,
    outletId,
    status: 'active',
    isAvailable: true,
    productIds: products.map((p) => p.id),
  });
  const availableProductIds = new Set(availability.map((row) => String(row.productId)));

  const filtered = products
    .filter((product) => availableProductIds.has(String(product.id)))
    .map((product) => ({
      ...product,
      outletAvailability: availability.find((row) => String(row.productId) === String(product.id)) || null,
    }));

  const total = filtered.length;
  const start = page * limit;
  const paged = filtered.slice(start, start + limit);

  return {
    products: paged,
    pagination: {
      page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasNext: start + limit < total, hasPrev: page > 0,
    },
  };
}

export async function getProductDetail({ user, productId }) {
  const product = await productsRepository.findById({ workspaceId: user.workspaceId, productId });
  if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
  return product;
}

export async function getProductWithAvailability({ user, productId, outletId }) {
  const product = await productsRepository.findById({ workspaceId: user.workspaceId, productId });
  if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);

  if (outletId) {
    await assertOutletAccess(user, outletId);
    const availability = await productsRepository.findOneAvailability({
      workspaceId: user.workspaceId, productId, outletId,
    });
    return { ...product, outletAvailability: availability || null };
  }

  return product;
}

export async function createProduct({ user, data }) {
  if (!canManageWorkspace(user)) throw new AppError('FORBIDDEN', 'Forbidden', 403);

  if (data.basePrice < 0) throw new AppError('VALIDATION', 'basePrice cannot be negative', 400);
  if (data.costPrice != null && data.costPrice < 0) throw new AppError('VALIDATION', 'costPrice cannot be negative', 400);

  const product = await productsRepository.create({
    workspaceId: user.workspaceId,
    name: data.name,
    slug: data.slug || undefined,
    sku: data.sku || undefined,
    shortDescription: data.shortDescription || '',
    description: data.description || '',
    basePrice: data.basePrice,
    costPrice: data.costPrice ?? null,
    currency: data.currency || 'IDR',
    thumbnailUrl: data.thumbnailUrl || '',
    tags: data.tags || [],
    isFeatured: data.isFeatured ?? false,
    isActive: data.isActive ?? true,
    stockTracking: data.stockTracking ?? false,
    stockQuantity: data.stockQuantity ?? null,
    metadata: data.metadata || {},
  });

  try {
    await auditLogsRepository.log({
      workspaceId: user.workspaceId,
      actorId: user.id,
      action: 'product.create',
      resourceType: 'product',
      resourceId: product.id,
      details: { name: product.name, sku: product.sku }
    });
  } catch (err) {
    console.error('Failed to log product.create audit log:', err);
  }

  return product;
}

export async function updateProduct({ user, productId, data }) {
  if (!canManageWorkspace(user)) throw new AppError('FORBIDDEN', 'Forbidden', 403);

  const existing = await productsRepository.findById({ workspaceId: user.workspaceId, productId });
  if (!existing) throw new AppError('NOT_FOUND', 'Product not found', 404);

  const allowedUpdates = {};
  const updatable = ['name', 'slug', 'sku', 'shortDescription', 'description', 'basePrice', 'costPrice',
    'currency', 'thumbnailUrl', 'tags', 'isFeatured', 'isActive', 'stockTracking', 'stockQuantity', 'metadata'];
  for (const key of updatable) {
    if (data[key] !== undefined) allowedUpdates[key] = data[key];
  }

  if (allowedUpdates.basePrice !== undefined && allowedUpdates.basePrice < 0) {
    throw new AppError('VALIDATION', 'basePrice cannot be negative', 400);
  }
  if (allowedUpdates.costPrice !== undefined && allowedUpdates.costPrice < 0) {
    throw new AppError('VALIDATION', 'costPrice cannot be negative', 400);
  }

  const updated = await productsRepository.update({ workspaceId: user.workspaceId, productId, updates: allowedUpdates });

  try {
    if (existing.basePrice !== updated.basePrice) {
      await auditLogsRepository.log({
        workspaceId: user.workspaceId,
        actorId: user.id,
        action: 'product.price_change',
        resourceType: 'product',
        resourceId: productId,
        details: { oldPrice: existing.basePrice, newPrice: updated.basePrice }
      });
    }

    if (existing.isActive !== updated.isActive) {
      await auditLogsRepository.log({
        workspaceId: user.workspaceId,
        actorId: user.id,
        action: 'product.status_change',
        resourceType: 'product',
        resourceId: productId,
        details: { oldStatus: existing.isActive ? 'Active' : 'Inactive', newStatus: updated.isActive ? 'Active' : 'Inactive' }
      });
    }

    const oldTags = existing.tags || [];
    const newTags = updated.tags || [];
    if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
      await auditLogsRepository.log({
        workspaceId: user.workspaceId,
        actorId: user.id,
        action: 'product.tags_update',
        resourceType: 'product',
        resourceId: productId,
        details: { oldTags, newTags }
      });
    }

    const editedFields = [];
    if (existing.name !== updated.name) editedFields.push('Name');
    if (existing.description !== updated.description) editedFields.push('Description');
    if (existing.shortDescription !== updated.shortDescription) editedFields.push('Short Description');
    if (existing.category !== updated.category) editedFields.push('Category');
    if (existing.sku !== updated.sku) editedFields.push('SKU');
    if (editedFields.length > 0) {
      await auditLogsRepository.log({
        workspaceId: user.workspaceId,
        actorId: user.id,
        action: 'product.update',
        resourceType: 'product',
        resourceId: productId,
        details: { fields: editedFields }
      });
    }
  } catch (err) {
    console.error('Failed to log product update audit logs:', err);
  }

  return updated;
}

export async function archiveProduct({ user, productId }) {
  if (!canManageWorkspace(user)) throw new AppError('FORBIDDEN', 'Forbidden', 403);

  const existing = await productsRepository.findById({ workspaceId: user.workspaceId, productId });
  if (!existing) throw new AppError('NOT_FOUND', 'Product not found', 404);

  const res = await productsRepository.archive({ workspaceId: user.workspaceId, productId });

  try {
    await auditLogsRepository.log({
      workspaceId: user.workspaceId,
      actorId: user.id,
      action: 'product.delete',
      resourceType: 'product',
      resourceId: productId,
      details: { name: existing.name, sku: existing.sku }
    });
  } catch (err) {
    console.error('Failed to log product.delete audit log:', err);
  }

  return res;
}

export async function updateOutletAvailability({ user, productId, outlets }) {
  if (!canManageWorkspace(user)) throw new AppError('FORBIDDEN', 'Forbidden', 403);

  const product = await productsRepository.findById({ workspaceId: user.workspaceId, productId });
  if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);

  const results = [];
  for (const item of outlets || []) {
    const outletId = item.outletId || item.outlet_id;
    await assertOutletAccess(user, outletId);
    const row = await productsRepository.upsertAvailability({
      workspaceId: user.workspaceId,
      productId,
      variantId: item.variantId || item.variant_id || null,
      outletId,
      updates: {
        isAvailable: item.isAvailable ?? item.is_available ?? true,
        priceOverride: item.priceOverride ?? item.price_override ?? null,
        stockQuantity: item.stockQuantity ?? item.stock_quantity ?? null,
        status: item.status || 'active',
        availableFrom: item.availableFrom || item.available_from || null,
        availableUntil: item.availableUntil || item.available_until || null,
      },
    });
    results.push(row);
  }

  try {
    await auditLogsRepository.log({
      workspaceId: user.workspaceId,
      actorId: user.id,
      action: 'product.outlet_availability_change',
      resourceType: 'product',
      resourceId: productId,
      details: { outlets: outlets.map(o => ({ outletId: o.outletId || o.outlet_id, isAvailable: o.isAvailable ?? true })) }
    });
  } catch (err) {
    console.error('Failed to log product.outlet_availability_change:', err);
  }

  return results;
}

export async function requireProductAvailableAtOutlet({ user, productId, outletId }) {
  await buildOutletScopedQuery(user, outletId);
  const product = await productsRepository.findById({ workspaceId: user.workspaceId, productId });
  if (!product || !product.isActive) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  }

  const availability = (await productsRepository.findAvailability({
    workspaceId: user.workspaceId,
    productId,
    outletId,
    status: 'active',
    isAvailable: true,
  }))[0] || null;

  if (!availability) {
    throw new AppError('PRODUCT_UNAVAILABLE', 'Product is not available at selected outlet', 400);
  }

  const now = new Date();
  const tz = 'Asia/Makassar';
  const currentTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  if (availability.availableFrom && currentTime < new Date(availability.availableFrom)) {
    throw new AppError('PRODUCT_NOT_YET_AVAILABLE', 'Product is not yet available at this outlet', 400);
  }
  if (availability.availableUntil && currentTime > new Date(availability.availableUntil)) {
    throw new AppError('PRODUCT_EXPIRED', 'Product is no longer available at this outlet', 400);
  }

  return { product, availability: resolveEffectivePrice(product, availability) };
}
