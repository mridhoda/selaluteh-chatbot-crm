import { useCallback, useEffect, useMemo, useState } from 'react'
import { publicStoreApi } from '../api/publicStoreApi'
import { CART_QUANTITY } from '../types/cart.types'
import { calculateCartTotals, calculateItemPreviewTotal } from '../utils/calculateDisplayTotal'

function getCartStorageKey(storefrontId) {
  return `public-store-cart:${storefrontId || 'default'}`
}

function getModifierSummary(product, optionIds) {
  return product.modifierGroups
    .flatMap((group) => group.options)
    .filter((option) => optionIds.includes(option.id))
    .map((option) => option.name)
}

export function useGuestCart({ storefront, products, outlet }) {
  const storageKey = getCartStorageKey(storefront?.id)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!storefront?.id) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      setItems(raw ? JSON.parse(raw) : [])
    } catch {
      setItems([])
    }
  }, [storageKey, storefront?.id])

  useEffect(() => {
    if (!storefront?.id) return
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey, storefront?.id])

  const addItem = useCallback(
    async ({ productId, quantity, selectedModifierOptionIds, note }) => {
      setError('')
      const product = products.find((item) => item.id === productId)
      if (!product || !product.isAvailable) {
        setError('Produk tidak tersedia.')
        return false
      }

      const safeQuantity = Math.min(CART_QUANTITY.MAX, Math.max(CART_QUANTITY.MIN, Number(quantity || 1)))
      const optionIds = selectedModifierOptionIds || []
      const lineTotalMinor = calculateItemPreviewTotal(product, optionIds, safeQuantity)
      const unitPriceMinor = calculateItemPreviewTotal(product, optionIds, 1)
      const cartItem = {
        id: `cart_${productId}_${Date.now()}`,
        productId,
        productName: product.name,
        imageUrl: product.imageUrl,
        quantity: safeQuantity,
        selectedModifierOptionIds: optionIds,
        modifierSummary: getModifierSummary(product, optionIds),
        note: note?.trim() || '',
        unitPriceMinor,
        lineTotalMinor,
      }

      await publicStoreApi.addCartItem({
        productId,
        quantity: safeQuantity,
        selectedModifierOptionIds: optionIds,
        note: cartItem.note,
      })
      setItems((current) => [...current, cartItem])
      return true
    },
    [products],
  )

  const updateQuantity = useCallback(async (cartItemId, nextQuantity) => {
    const safeQuantity = Math.max(0, Math.min(CART_QUANTITY.MAX, Number(nextQuantity || 0)))
    if (safeQuantity === 0) {
      setItems((current) => current.filter((item) => item.id !== cartItemId))
      return
    }

    await publicStoreApi.updateCartItemQuantity(cartItemId, safeQuantity)
    setItems((current) =>
      current.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: safeQuantity, lineTotalMinor: item.unitPriceMinor * safeQuantity }
          : item,
      ),
    )
  }, [])

  const removeItem = useCallback(async (cartItemId) => {
    await publicStoreApi.removeCartItem(cartItemId)
    setItems((current) => current.filter((item) => item.id !== cartItemId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totals = useMemo(() => calculateCartTotals(items), [items])
  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  return {
    cart: {
      id: `guest-cart-${storefront?.id || 'mock'}`,
      storefrontId: storefront?.id,
      outletId: outlet?.id || storefront?.outlet?.id,
      items,
      totals,
    },
    items,
    totals,
    cartCount,
    displayTotalMinor: totals.totalMinor,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    error,
  }
}
