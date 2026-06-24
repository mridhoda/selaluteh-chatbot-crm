import { inventoryRepository } from '../db/repositories/inventory.supabase.repository.js';
import { AppError } from '../utils/errors.js';
import { buildOutletScopedQuery, assertOutletAccess } from './access-control.service.js';

export async function getStock({ workspaceId, outletId, outletIds, productId, variant = null }) {
  const item = await inventoryRepository.findByProduct({ workspaceId, outletId, outletIds, productId, variant });
  if (!item) return { productId, outletId, quantity: 0, lowStockThreshold: 5, status: 'active' };
  return item;
}

export async function listInventory({ workspaceId, outletId, outletIds, status, lowStockOnly, page, limit }) {
  const data = await inventoryRepository.list({ workspaceId, outletId, outletIds, status, lowStockOnly, page, limit });
  const total = await inventoryRepository.count({ workspaceId, outletId, outletIds, status });
  return { data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 50 } };
}

export async function listInventoryForUser({ user, outletId, status, lowStockOnly, page, limit }) {
  const scope = await buildOutletScopedQuery(user, outletId);
  return listInventory({
    workspaceId: scope.workspaceId,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
    status,
    lowStockOnly,
    page,
    limit,
  });
}

export async function getStockForUser({ user, outletId, productId, variant = null }) {
  const scope = await buildOutletScopedQuery(user, outletId);
  return getStock({ workspaceId: scope.workspaceId, outletId: scope.outletId, outletIds: scope.outletIds, productId, variant });
}

export async function adjustStock({ workspaceId, outletId, productId, variant = null, delta, reason, notes, userId }) {
  if (typeof delta !== 'number' || delta === 0) {
    throw new AppError('VALIDATION', 'delta must be a non-zero number', 400);
  }
  const validReasons = ['adjustment', 'reserve', 'release', 'consume', 'return', 'transfer_in', 'transfer_out', 'initial'];
  if (!validReasons.includes(reason)) {
    throw new AppError('VALIDATION', `reason must be one of: ${validReasons.join(', ')}`, 400);
  }
  const res = await inventoryRepository.atomicAdjust({
    workspaceId, outletId, productId, variant, delta, reason, notes, userId,
  });

  try {
    await auditLogsRepository.log({
      workspaceId,
      outletId,
      actorId: userId,
      action: 'stock.adjust',
      resourceType: 'product',
      resourceId: productId,
      details: {
        quantityChange: delta,
        oldQuantity: res.quantity - delta,
        newQuantity: res.quantity,
        reason,
        notes,
        variant,
      }
    });
  } catch (err) {
    console.error('Failed to log stock adjust audit log:', err);
  }

  return res;
}

export async function reserveStock({ workspaceId, outletId, productId, variant = null, quantity, orderId }) {
  const delta = -Math.abs(quantity);
  return inventoryRepository.atomicAdjust({
    workspaceId, outletId, productId, variant, delta, reason: 'reserve',
    referenceType: 'order', referenceId: orderId,
    notes: `Reserved for order ${orderId}`,
  });
}

export async function releaseStock({ workspaceId, outletId, productId, variant = null, quantity, orderId }) {
  const delta = Math.abs(quantity);
  return inventoryRepository.atomicAdjust({
    workspaceId, outletId, productId, variant, delta, reason: 'release',
    referenceType: 'order', referenceId: orderId,
    notes: `Released from order ${orderId}`,
  });
}

export async function consumeStock({ workspaceId, outletId, productId, variant = null, quantity, orderId }) {
  const delta = -Math.abs(quantity);
  return inventoryRepository.atomicAdjust({
    workspaceId, outletId, productId, variant, delta, reason: 'consume',
    referenceType: 'order', referenceId: orderId,
    notes: `Consumed by order ${orderId}`,
  });
}

export async function returnStock({ workspaceId, outletId, productId, variant = null, quantity, orderId }) {
  const delta = Math.abs(quantity);
  return inventoryRepository.atomicAdjust({
    workspaceId, outletId, productId, variant, delta, reason: 'return',
    referenceType: 'order', referenceId: orderId,
    notes: `Returned from order ${orderId}`,
  });
}

export async function transferStock({ workspaceId, fromOutletId, toOutletId, productId, variant = null, quantity, userId }) {
  if (fromOutletId === toOutletId) {
    throw new AppError('VALIDATION', 'Source and destination outlet must differ', 400);
  }
  const qty = Math.abs(quantity);
  await inventoryRepository.atomicAdjust({
    workspaceId, outletId: fromOutletId, productId, variant, delta: -qty, reason: 'transfer_out',
    notes: `Transfer to outlet ${toOutletId}`,
    userId,
  });
  await inventoryRepository.atomicAdjust({
    workspaceId, outletId: toOutletId, productId, variant, delta: qty, reason: 'transfer_in',
    notes: `Transfer from outlet ${fromOutletId}`,
    userId,
  });
  return { productId, variant, quantity: qty, fromOutletId, toOutletId };
}

export async function getMovements({ workspaceId, outletId, productId, reason, page, limit }) {
  const data = await inventoryRepository.getMovements({ workspaceId, outletId, productId, reason, page, limit });
  return { data, meta: { total: data.length, page: parseInt(page) || 1, limit: parseInt(limit) || 50 } };
}

export async function getMovementsForUser({ user, outletId, productId, reason, page, limit }) {
  const scope = await buildOutletScopedQuery(user, outletId);
  const data = await inventoryRepository.getMovements({
    workspaceId: scope.workspaceId,
    outletId: scope.outletId,
    outletIds: scope.outletIds,
    productId,
    reason,
    page,
    limit,
  });
  return { data, meta: { total: data.length, page: parseInt(page) || 1, limit: parseInt(limit) || 50 } };
}

export async function assertInventoryOutletAccess(user, outletId) {
  await assertOutletAccess(user, outletId);
}

export async function getLowStockItems({ workspaceId, outletId }) {
  const items = await inventoryRepository.list({ workspaceId, outletId, lowStockOnly: true, limit: 200 });
  return items.filter(i => i.status === 'active').map(i => ({
    productId: i.productId,
    outletId: i.outletId,
    quantity: i.quantity,
    threshold: i.lowStockThreshold,
  }));
}
