function arrayFrom(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeRecommendation(recommendation = {}) {
  const productId =
    recommendation.targetProductId ||
    recommendation.target_product_id ||
    recommendation.productId ||
    recommendation.id
  const modifierGroups = arrayFrom(
    recommendation.modifierGroups || recommendation.modifiers
  ).map((group) => ({
    ...group,
    title: group.title || group.name || group.label || 'Options',
    type:
      String(group.type || 'SINGLE').toUpperCase() === 'MULTI'
        ? 'MULTIPLE'
        : String(group.type || 'SINGLE').toUpperCase(),
    isRequired: group.isRequired ?? group.required ?? false,
    minSelect:
      group.minSelect ?? group.minSelections ?? group.min_selections ?? 0,
    maxSelect:
      group.maxSelect ?? group.maxSelections ?? group.max_selections ?? null,
    options: arrayFrom(group.options).map((option) => ({
      ...option,
      isAvailable: option.isAvailable !== false && option.is_active !== false,
      priceDeltaMinor:
        option.priceDeltaMinor ??
        option.priceDelta ??
        option.price_delta ??
        option.price ??
        0,
    })),
  }))
  return {
    ...recommendation,
    productId,
    targetProductId: productId,
    recommendationId:
      recommendation.recommendationId ||
      recommendation.recommendation_id ||
      null,
    name: recommendation.name || 'Menu rekomendasi',
    description: recommendation.description || '',
    headline: recommendation.headline || null,
    imageUrl:
      recommendation.imageUrl ||
      recommendation.image_url ||
      recommendation.thumbnailUrl ||
      recommendation.thumbnail_url ||
      null,
    unitPriceMinor:
      recommendation.unitPriceMinor ??
      recommendation.unit_price ??
      recommendation.priceMinor ??
      0,
    modifierGroups,
  }
}

export function filterRecommendations(
  recommendations = [],
  cartProductIds = [],
  limit = 3
) {
  const cartIds = new Set(arrayFrom(cartProductIds).map(String))
  const seen = new Set()
  return arrayFrom(recommendations)
    .map(normalizeRecommendation)
    .filter((recommendation) => {
      const productId = String(recommendation.productId || '')
      if (
        !productId ||
        recommendation.isAvailable === false ||
        cartIds.has(productId) ||
        seen.has(productId)
      )
        return false
      seen.add(productId)
      return true
    })
    .slice(0, Math.max(0, Math.min(3, Number(limit) || 3)))
}

export function recommendationProduct(recommendation = {}) {
  const normalized = normalizeRecommendation(recommendation)
  return {
    ...normalized,
    id: normalized.productId,
    basePriceMinor: normalized.unitPriceMinor,
    isAvailable: true,
  }
}
