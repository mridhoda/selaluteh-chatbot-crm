import { cartsRepository, checkoutsRepository, productsRepository } from '../db/repositories/index.js';
import { inventoryRepository } from '../db/repositories/inventory.supabase.repository.js';
import { AppError } from '../utils/errors.js';
import { assertPickupCheckout, buildCartVersionIdempotencyKey } from '../ai/security/commerce-guardrails.js';

export async function createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey, customerSnapshot, fulfillmentSnapshot }) {
  assertPickupCheckout({ fulfillmentSnapshot: fulfillmentSnapshot || { method: 'pickup' }, selectedOutletId: outletId });
  if (idempotencyKey) {
    const existing = await checkoutsRepository.findByIdempotencyKey({ workspaceId, key: idempotencyKey });
    if (existing) return existing;
  }

  // Check for any active cart across outlets to detect mismatch
  const anyCart = await cartsRepository.findActiveByContact({ workspaceId, contactId });
  if (anyCart && String(anyCart.outletId) !== String(outletId)) {
    throw new AppError('CART_OUTLET_MISMATCH', 'Cart belongs to a different outlet', 409);
  }

  const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId, outletId });
  if (!cart || cart.items.length === 0) throw new AppError('EMPTY_CART', 'Cart is empty', 400);
  if (cart.expiresAt && cart.expiresAt < new Date()) throw new AppError('EXPIRED_CART', 'Cart has expired', 400);
  const checkoutIdempotencyKey = idempotencyKey || buildCartVersionIdempotencyKey({ cartId: cart.id, cartVersion: cart.version ?? cart.updatedAt ?? cart.items.length });
  if (!idempotencyKey) {
    const existing = await checkoutsRepository.findByIdempotencyKey({ workspaceId, key: checkoutIdempotencyKey });
    if (existing) return existing;
  }

  // Re-validate product availability and check stock (soft check — skip if no availability record to allow AI-added items)
  for (const item of cart.items) {
    try {
      const availability = await productsRepository.findOneAvailability({ workspaceId, productId: item.productId, outletId });
      if (availability && availability.isAvailable === false) {
        throw new AppError('PRODUCT_UNAVAILABLE', `Product "${item.name}" is no longer available at this outlet`, 400);
      }
      const stock = await inventoryRepository.findByProduct({ workspaceId, outletId, productId: item.productId });
      if (stock && typeof stock.quantity === 'number' && stock.quantity < item.quantity) {
        throw new AppError('INSUFFICIENT_STOCK', `Insufficient stock for "${item.name}" (available: ${stock.quantity}, requested: ${item.quantity})`, 400);
      }
    } catch (e) {
      if (e.code === 'PRODUCT_UNAVAILABLE' || e.code === 'INSUFFICIENT_STOCK') throw e;
      // Ignore availability lookup errors (e.g. not linked to outlet) for AI-added items
      console.warn(`[checkout] availability check skipped for product ${item.productId}:`, e.message);
    }
  }

  const cartTotal = cart.total || cart.items.reduce((sum, i) => sum + (i.subtotal || i.subtotalAmount || 0), 0);

  const items = cart.items.map((i) => ({
    productId: i.productId,
    name: i.name || i.productNameSnapshot || '',
    productNameSnapshot: i.name || i.productNameSnapshot || '',
    quantity: i.quantity,
    unitPrice: i.unitPrice ?? i.effectivePrice ?? 0,
    subtotal: i.subtotal ?? i.subtotalAmount ?? 0,
    subtotalAmount: i.subtotal ?? i.subtotalAmount ?? 0,
    variant: i.variant,
    modifiers: i.modifiers,
  }));

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const checkout = await checkoutsRepository.create({
    workspaceId,
    outletId,
    cartId: cart.id,
    contactId,
    chatId,
    status: 'pending',
    idempotencyKey: checkoutIdempotencyKey,
    items,
    subtotalAmount: cartTotal,
    totalAmount: cartTotal,
    currency: cart.currency || 'IDR',
    customerSnapshot: customerSnapshot || {},
    fulfillmentSnapshot: fulfillmentSnapshot || { method: 'pickup' },
    expiresAt,
  });

  return checkout;
}

export async function confirmCheckout({ workspaceId, checkoutId }) {
  const checkout = await checkoutsRepository.findById({ workspaceId, checkoutId });
  if (!checkout) throw new AppError('NOT_FOUND', 'Checkout not found', 404);
  if (checkout.status !== 'pending') throw new AppError('INVALID_STATE', 'Checkout is not in pending state', 409);

  await checkoutsRepository.updateStatus({ workspaceId, checkoutId, status: 'confirmed' });
  // Re-fetch with full checkout_items join so createOrderFromCheckout gets items
  return checkoutsRepository.findById({ workspaceId, checkoutId });
}

export async function getCheckoutDetail({ workspaceId, checkoutId }) {
  const checkout = await checkoutsRepository.findById({ workspaceId, checkoutId });
  if (!checkout) throw new AppError('NOT_FOUND', 'Checkout not found', 404);
  return checkout;
}
