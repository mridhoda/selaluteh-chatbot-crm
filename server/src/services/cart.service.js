import { cartsRepository } from '../db/repositories/index.js';
import { productsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

export async function getOrCreateActiveCart({ workspaceId, outletId, contactId, chatId, platformType }) {
  let cart = await cartsRepository.findActiveByContact({ workspaceId, contactId, outletId });
  if (cart) return cart;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  cart = await cartsRepository.create({
    workspaceId, outletId, contactId, chatId, platformType,
    items: [], total: 0, currency: 'IDR', status: 'active', expiresAt,
  });
  return cart;
}

export async function addItem({ workspaceId, outletId, contactId, chatId, platformType, productId, quantity = 1, variant = null, modifiers = [] }) {
  const product = await productsRepository.findById({ workspaceId, productId });
  if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  if (!product.isActive) throw new AppError('PRODUCT_UNAVAILABLE', 'Product is not available', 400);

  // Check for existing cart across any outlet to enforce single-outlet rule
  const existingCartAny = await cartsRepository.findActiveByContact({ workspaceId, contactId });
  if (existingCartAny && String(existingCartAny.outletId) !== String(outletId)) {
    throw new AppError('CART_OUTLET_MISMATCH', 'Cart belongs to a different outlet. Clear cart first.', 409);
  }

  let availability = null;
  if (outletId) {
    availability = await productsRepository.findOneAvailability({ workspaceId, productId, outletId });
    if (!availability || !availability.isAvailable) {
      throw new AppError('PRODUCT_UNAVAILABLE', 'Product not available at this outlet', 400);
    }
  }

  const effectivePrice = availability?.priceOverride || product.basePrice;
  const subtotal = effectivePrice * quantity;

  const cart = await getOrCreateActiveCart({ workspaceId, outletId, contactId, chatId, platformType });

  const existingItem = cart.items.find((i) => String(i.productId) === String(productId));
  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    const newSubtotal = effectivePrice * newQty;
    const updated = await cartsRepository.updateItem({
      workspaceId, cartId: cart.id, productId,
      updates: { quantity: newQty, subtotal: newSubtotal },
    });
    const total = updated.items.reduce((sum, i) => sum + i.subtotal, 0);
    await cartsRepository.update({ workspaceId, cartId: cart.id, updates: { total } });
    return cartsRepository.findActiveByContact({ workspaceId, contactId, outletId });
  }

  const item = {
    productId: product.id,
    name: product.name,
    basePrice: product.basePrice,
    effectivePrice,
    quantity,
    variant,
    modifiers,
    subtotal,
  };

  const updated = await cartsRepository.addItem({ workspaceId, cartId: cart.id, item });
  const total = updated.items.reduce((sum, i) => sum + i.subtotal, 0);
  await cartsRepository.update({ workspaceId, cartId: cart.id, updates: { total } });
  return cartsRepository.findActiveByContact({ workspaceId, contactId, outletId });
}

export async function updateQuantity({ workspaceId, cartId, productId, quantity }) {
  if (quantity < 1) throw new AppError('VALIDATION', 'Quantity must be at least 1', 400);
  const cart = await cartsRepository.findById({ workspaceId, cartId });
  if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
  const item = cart.items.find((i) => String(i.productId) === String(productId));
  if (!item) throw new AppError('NOT_FOUND', 'Item not found in cart', 404);

  const effectivePrice = item.effectivePrice;
  const subtotal = effectivePrice * quantity;
  await cartsRepository.updateItem({ workspaceId, cartId, productId, updates: { quantity, subtotal } });

  const updated = await cartsRepository.findById({ workspaceId, cartId });
  const total = updated.items.reduce((sum, i) => sum + i.subtotal, 0);
  await cartsRepository.update({ workspaceId, cartId, updates: { total } });
  return cartsRepository.findById({ workspaceId, cartId });
}

export async function removeItem({ workspaceId, cartId, productId }) {
  const cart = await cartsRepository.findById({ workspaceId, cartId });
  if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
  const updated = await cartsRepository.removeItem({ workspaceId, cartId, productId });
  const total = updated.items.reduce((sum, i) => sum + i.subtotal, 0);
  await cartsRepository.update({ workspaceId, cartId, updates: { total } });
  return cartsRepository.findById({ workspaceId, cartId });
}

export async function clearCart({ workspaceId, cartId }) {
  const cart = await cartsRepository.findById({ workspaceId, cartId });
  if (!cart) throw new AppError('NOT_FOUND', 'Cart not found', 404);
  return cartsRepository.update({ workspaceId, cartId, updates: { items: [], total: 0 } });
}

export function getCartSummary(cart) {
  if (!cart) return null;
  return {
    id: cart.id,
    outletId: cart.outletId,
    items: cart.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.effectivePrice,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
    total: cart.total ?? cart.totalAmount ?? 0,
    currency: cart.currency,
    itemCount: cart.items.length,
  };
}
