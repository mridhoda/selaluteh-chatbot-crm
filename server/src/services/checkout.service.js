import { cartsRepository, checkoutsRepository, productsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

export async function createCheckout({ workspaceId, outletId, contactId, chatId, idempotencyKey, customerSnapshot, fulfillmentSnapshot }) {
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

  // Re-validate product availability at checkout
  for (const item of cart.items) {
    const availability = await productsRepository.findOneAvailability({ workspaceId, productId: item.productId, outletId });
    if (!availability || !availability.isAvailable) {
      throw new AppError('PRODUCT_UNAVAILABLE', `Product "${item.name}" is no longer available at this outlet`, 400);
    }
  }

  const items = cart.items.map((i) => ({
    productId: i.productId,
    name: i.name,
    quantity: i.quantity,
    unitPrice: i.effectivePrice,
    subtotal: i.subtotal,
    variant: i.variant,
    modifiers: i.modifiers,
  }));

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const checkout = await checkoutsRepository.create({
    workspaceId,
    outletId,
    cartId: cart._id,
    contactId,
    chatId,
    status: 'pending',
    idempotencyKey: idempotencyKey || undefined,
    items,
    subtotal: cart.total,
    total: cart.total,
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

  const updated = await checkoutsRepository.updateStatus({ workspaceId, checkoutId, status: 'confirmed' });
  return updated;
}

export async function getCheckoutDetail({ workspaceId, checkoutId }) {
  const checkout = await checkoutsRepository.findById({ workspaceId, checkoutId });
  if (!checkout) throw new AppError('NOT_FOUND', 'Checkout not found', 404);
  return checkout;
}
