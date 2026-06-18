import { AppError } from '../utils/errors.js';

export function resolveEffectivePrice(product, availability) {
  if (!product) throw new AppError('NOT_FOUND', 'Product is required', 404);

  const effectivePrice = availability?.priceOverride ?? product.basePrice;
  const currency = product.currency || 'IDR';

  return {
    productId: product.id,
    productName: product.name,
    basePrice: product.basePrice,
    priceOverride: availability?.priceOverride || null,
    effectivePrice,
    currency,
    isOverride: availability?.priceOverride != null && availability.priceOverride !== product.basePrice,
    isAvailable: availability ? availability.isAvailable : false,
    status: availability?.status || 'unavailable',
    availableFrom: availability?.availableFrom || null,
    availableUntil: availability?.availableUntil || null,
  };
}

export function computeEffectivePrice(product, availability) {
  const price = availability?.priceOverride ?? product?.basePrice ?? 0;
  return Number(price);
}

export function validateCurrency(product) {
  const currency = product?.currency || 'IDR';
  const valid = ['IDR', 'USD'];
  if (!valid.includes(currency)) throw new AppError('VALIDATION', `Unsupported currency: ${currency}`, 400);
  return currency;
}
