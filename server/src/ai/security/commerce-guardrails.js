export const DEFAULT_MAX_ITEM_QUANTITY = 99;

export function searchCustomerVisibleProducts({ query = '', products = [], availability = [], outletId = null } = {}) {
  const normalized = String(query || '').toLowerCase().trim();
  return products
    .filter((product) => product?.isActive !== false)
    .filter((product) => product?.customerVisible !== false)
    .filter((product) => !normalized || String(product.name || '').toLowerCase().includes(normalized))
    .map((product) => {
      const outletAvailability = availability.find((item) => item.productId === product.id && (!outletId || item.outletId === outletId));
      if (outletId && (!outletAvailability || outletAvailability.isAvailable === false)) return null;
      return {
        ...product,
        effectivePrice: outletAvailability?.priceOverride ?? product.basePrice ?? product.price ?? 0,
        outletId: outletId || null,
      };
    })
    .filter(Boolean);
}

export function assertOutletOrderable(outlet = {}) {
  if (!outlet || outlet.status === 'inactive' || outlet.status === 'archived' || outlet.operationalStatus === 'closed') {
    throw new Error('OUTLET_NOT_ORDERABLE');
  }
  if (outlet.pickupEnabled === false) throw new Error('OUTLET_PICKUP_DISABLED');
  if (outlet.channelAssigned === false) throw new Error('OUTLET_CHANNEL_NOT_ASSIGNED');
}

export function addCanonicalCartItem({ cart = {}, outletId, product, quantity = 1, availability = {}, maxQuantity = DEFAULT_MAX_ITEM_QUANTITY } = {}) {
  if (!outletId) throw new Error('OUTLET_REQUIRED');
  if (cart.outletId && cart.outletId !== outletId) throw new Error('CART_OUTLET_MISMATCH');
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('INVALID_QUANTITY');
  if (quantity > maxQuantity) throw new Error('QUANTITY_LIMIT_EXCEEDED');
  if (!product || product.isActive === false) throw new Error('PRODUCT_UNAVAILABLE');
  if (availability && availability.isAvailable === false) throw new Error('PRODUCT_UNAVAILABLE');

  const effectivePrice = availability?.priceOverride ?? product.basePrice ?? product.price ?? 0;
  const items = [...(cart.items || [])];
  const existing = items.find((item) => item.productId === product.id);
  if (existing) {
    const newQuantity = existing.quantity + quantity;
    if (newQuantity > maxQuantity) throw new Error('QUANTITY_LIMIT_EXCEEDED');
    existing.quantity = newQuantity;
    existing.effectivePrice = effectivePrice;
    existing.subtotal = effectivePrice * newQuantity;
  } else {
    items.push({ productId: product.id, name: product.name, effectivePrice, quantity, subtotal: effectivePrice * quantity });
  }
  return Object.freeze({ ...cart, outletId, items, total: items.reduce((sum, item) => sum + item.subtotal, 0), version: (cart.version || 0) + 1 });
}

export function buildCartVersionIdempotencyKey({ cartId, cartVersion }) {
  return `checkout:${cartId}:v${cartVersion}`;
}

export function assertPickupCheckout({ fulfillmentSnapshot = {}, selectedOutletId }) {
  if (!selectedOutletId) throw new Error('OUTLET_REQUIRED');
  if ((fulfillmentSnapshot.method || 'pickup') !== 'pickup') throw new Error('PICKUP_ONLY');
}
