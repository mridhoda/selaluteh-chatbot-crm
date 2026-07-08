import { useCallback, useEffect, useMemo, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { CART_QUANTITY, CART_VALIDATION_STATUS } from '../types/cart.types'
import {
  buildCartValidationPayload,
  createCartIntentContext,
  createCartIntentItem,
  createCartPreview,
  normalizeValidatedCart,
} from '../utils/cartIntentModel'

function getCartStorageKey(storefrontId) {
  return `public-store-cart:${storefrontId || 'default'}`
}

function sanitizeStoredIntentItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems
    .filter((item) => item?.productId)
    .map((item) =>
      createCartIntentItem({
        clientLineId: item.clientLineId || item.id,
        productId: item.productId,
        quantity: item.quantity,
        selectedModifierOptionIds: item.selectedModifierOptionIds,
      }),
    )
}

export function useGuestCart({ storefront, products, outlet, qrSessionToken, includeOutlet = true }) {
  const storageKey = getCartStorageKey(storefront?.id)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [validatedCart, setValidatedCart] = useState(null)
  const [validationStatus, setValidationStatus] = useState(CART_VALIDATION_STATUS.IDLE)

  useEffect(() => {
    if (!storefront?.id) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      setItems(raw ? sanitizeStoredIntentItems(JSON.parse(raw)) : [])
    } catch {
      setItems([])
    }
  }, [storageKey, storefront?.id])

  useEffect(() => {
    if (!storefront?.id) return
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey, storefront?.id])

  const addItem = useCallback(
    async ({ productId, quantity, selectedModifierOptionIds }) => {
      setError('')
      const product = products.find((item) => item.id === productId)
      if (!product || !product.isAvailable) {
        setError('Produk tidak tersedia.')
        return false
      }

      const safeQuantity = Math.min(CART_QUANTITY.MAX, Math.max(CART_QUANTITY.MIN, Number(quantity || 1)))
      const cartItem = createCartIntentItem({
        clientLineId: `cart_${productId}_${Date.now()}`,
        productId,
        quantity: safeQuantity,
        selectedModifierOptionIds,
      })
      setItems((current) => [...current, cartItem])
      setValidatedCart(null)
      setValidationStatus(CART_VALIDATION_STATUS.IDLE)
      return true
    },
    [products],
  )

  const updateQuantity = useCallback(async (cartItemId, nextQuantity) => {
    const safeQuantity = Math.max(0, Math.min(CART_QUANTITY.MAX, Number(nextQuantity || 0)))
    if (safeQuantity === 0) {
      setItems((current) => current.filter((item) => item.clientLineId !== cartItemId && item.id !== cartItemId))
      setValidatedCart(null)
      setValidationStatus(CART_VALIDATION_STATUS.IDLE)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.clientLineId === cartItemId || item.id === cartItemId
          ? { ...item, quantity: safeQuantity }
          : item,
      ),
    )
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
  }, [])

  const removeItem = useCallback(async (cartItemId) => {
    setItems((current) => current.filter((item) => item.clientLineId !== cartItemId && item.id !== cartItemId))
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
  }, [])

  const intentContext = useMemo(
    () => createCartIntentContext({ storefrontSlug: storefront?.slug, outletId: outlet?.id || storefront?.outlet?.id, qrSessionToken, includeOutlet }),
    [includeOutlet, outlet?.id, qrSessionToken, storefront?.outlet?.id, storefront?.slug],
  )
  const previewCart = useMemo(() => createCartPreview({ items, products, context: intentContext }), [intentContext, items, products])
  const validateCart = useCallback(async () => {
    if (!items.length) {
      setError('Keranjang masih kosong.')
      return null
    }
    setError('')
    setValidationStatus(CART_VALIDATION_STATUS.PENDING)
    try {
      const result = await phase5ApiClient.public.validateCart(buildCartValidationPayload({ context: intentContext, items }))
      const normalized = normalizeValidatedCart(result)
      setValidatedCart(normalized)
      setValidationStatus(normalized.valid ? CART_VALIDATION_STATUS.VALID : CART_VALIDATION_STATUS.INVALID)
      return normalized
    } catch {
      setValidationStatus(CART_VALIDATION_STATUS.ERROR)
      setError('Keranjang gagal divalidasi. Coba lagi.')
      return null
    }
  }, [intentContext, items])

  const totals = previewCart.totals
  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  return {
    cart: previewCart,
    intentContext,
    intentItems: items,
    items: previewCart.items,
    totals,
    cartCount,
    displayTotalMinor: totals.totalMinor,
    validatedCart,
    validationStatus,
    validateCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    error,
  }
}
