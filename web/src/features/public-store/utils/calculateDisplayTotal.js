export function calculateCartTotals(items = []) {
  const subtotalMinor = items.reduce((sum, item) => sum + Number(item.lineTotalMinor || 0), 0)
  const serviceFeeMinor = 0
  const discountMinor = 0
  const totalMinor = Math.max(0, subtotalMinor + serviceFeeMinor - discountMinor)

  return {
    subtotalMinor,
    serviceFeeMinor,
    discountMinor,
    totalMinor,
  }
}

export function calculateItemPreviewTotal(product, selectedModifierOptionIds = [], quantity = 1) {
  if (!product) return 0

  const modifierTotal = product.modifierGroups.reduce((sum, group) => {
    return (
      sum +
      group.options
        .filter((option) => selectedModifierOptionIds.includes(option.id))
        .reduce((optionSum, option) => optionSum + Number(option.priceDeltaMinor || 0), 0)
    )
  }, 0)

  return (Number(product.basePriceMinor || 0) + modifierTotal) * Number(quantity || 1)
}
