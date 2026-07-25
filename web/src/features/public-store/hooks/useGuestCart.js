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
        modifiers: item.modifiers,
      })
    )
}

function buildSelectedModifiers({
  product,
  selectedModifierOptionIds = [],
} = {}) {
  const optionIds = new Set(
    (Array.isArray(selectedModifierOptionIds)
      ? selectedModifierOptionIds
      : []
    ).map(String)
  )
  return (product?.modifierGroups || []).flatMap((group) => {
    return (group.options || [])
      .filter((option) => optionIds.has(String(option.id)))
      .map((option) => ({ modifier_group_id: group.id, option_id: option.id }))
  })
}

export function useGuestCart({
  storefront,
  products,
  outlet,
  qrSessionToken,
  recommendationSessionId,
  includeOutlet = true,
}) {
  const storageKey = getCartStorageKey(storefront?.id)
  const [items, setItems] = useState([])
  const [supplementalProducts, setSupplementalProducts] = useState([])
  const [error, setError] = useState('')
  const [validatedCart, setValidatedCart] = useState(null)
  const [validationStatus, setValidationStatus] = useState(
    CART_VALIDATION_STATUS.IDLE
  )

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
    async ({
      productId,
      quantity,
      selectedModifierOptionIds,
      product: providedProduct,
    }) => {
      setError('')
      const product =
        products.find((item) => item.id === productId) ||
        supplementalProducts.find((item) => item.id === productId) ||
        providedProduct
      if (!product || !product.isAvailable) {
        setError('Produk tidak tersedia.')
        return false
      }

      const safeQuantity = Math.min(
        CART_QUANTITY.MAX,
        Math.max(CART_QUANTITY.MIN, Number(quantity || 1))
      )
      const cartItem = createCartIntentItem({
        clientLineId: `cart_${productId}_${Date.now()}`,
        productId,
        quantity: safeQuantity,
        selectedModifierOptionIds,
        modifiers: buildSelectedModifiers({
          product,
          selectedModifierOptionIds,
        }),
      })
      if (
        providedProduct &&
        !products.some((item) => item.id === productId) &&
        !supplementalProducts.some((item) => item.id === productId)
      ) {
        setSupplementalProducts((current) => [...current, providedProduct])
      }
      setItems((current) => [...current, cartItem])
      setValidatedCart(null)
      setValidationStatus(CART_VALIDATION_STATUS.IDLE)
      return true
    },
    [products, supplementalProducts]
  )

  const updateQuantity = useCallback(async (cartItemId, nextQuantity) => {
    const safeQuantity = Math.max(
      0,
      Math.min(CART_QUANTITY.MAX, Number(nextQuantity || 0))
    )
    if (safeQuantity === 0) {
      setItems((current) =>
        current.filter(
          (item) => item.clientLineId !== cartItemId && item.id !== cartItemId
        )
      )
      setValidatedCart(null)
      setValidationStatus(CART_VALIDATION_STATUS.IDLE)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.clientLineId === cartItemId || item.id === cartItemId
          ? { ...item, quantity: safeQuantity }
          : item
      )
    )
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
  }, [])

  const removeItem = useCallback(async (cartItemId) => {
    setItems((current) =>
      current.filter(
        (item) => item.clientLineId !== cartItemId && item.id !== cartItemId
      )
    )
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
  }, [])

  const replaceFirstProduct = useCallback(async ({ sourceProductId, productId, selectedModifierOptionIds, product: providedProduct }) => {
    const product = products.find((item) => item.id === productId) || supplementalProducts.find((item) => item.id === productId) || providedProduct
    if (!product || !product.isAvailable) {
      setError('Produk upgrade tidak tersedia.')
      return false
    }
    const sourceItem = items.find((item) => String(item.productId) === String(sourceProductId))
    if (!sourceItem) {
      setError('Item asal untuk upgrade sudah tidak ada di keranjang.')
      return false
    }
    setItems((current) => current.map((item) => {
      if (item.clientLineId !== sourceItem.clientLineId) return item
      return createCartIntentItem({
        clientLineId: `cart_${productId}_${Date.now()}`,
        productId,
        quantity: item.quantity,
        selectedModifierOptionIds,
        modifiers: buildSelectedModifiers({ product, selectedModifierOptionIds }),
      })
    }))
    if (!products.some((item) => item.id === productId) && !supplementalProducts.some((item) => item.id === productId)) setSupplementalProducts((current) => [...current, providedProduct])
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
    return true
  }, [items, products, supplementalProducts])

  const clearCart = useCallback(() => {
    setItems([])
    setValidatedCart(null)
    setValidationStatus(CART_VALIDATION_STATUS.IDLE)
  }, [])

  const intentContext = useMemo(
    () =>
      createCartIntentContext({
        storefrontSlug: storefront?.slug,
        outletId: outlet?.id || storefront?.outlet?.id,
        qrSessionToken,
        recommendationSessionId,
        includeOutlet,
      }),
    [
      includeOutlet,
      outlet?.id,
      qrSessionToken,
      recommendationSessionId,
      storefront?.outlet?.id,
      storefront?.slug,
    ]
  )
  const catalog = useMemo(
    () => [
      ...products,
      ...supplementalProducts.filter(
        (product) => !products.some((item) => item.id === product.id)
      ),
    ],
    [products, supplementalProducts]
  )
  const previewCart = useMemo(
    () =>
      createCartPreview({ items, products: catalog, context: intentContext }),
    [catalog, intentContext, items]
  )
  const validateCart = useCallback(async () => {
    if (!items.length) {
      setError('Keranjang masih kosong.')
      return null
    }
    setError('')
    setValidationStatus(CART_VALIDATION_STATUS.PENDING)
    try {
      const result = await phase5ApiClient.public.validateCart(
        buildCartValidationPayload({
          context: intentContext,
          items,
          products: catalog,
        })
      )
      const normalized = normalizeValidatedCart(result)
      setValidatedCart(normalized)
      setValidationStatus(
        normalized.valid
          ? CART_VALIDATION_STATUS.VALID
          : CART_VALIDATION_STATUS.INVALID
      )
      return normalized
    } catch {
      setValidationStatus(CART_VALIDATION_STATUS.ERROR)
      setError('Keranjang gagal divalidasi. Coba lagi.')
      return null
    }
  }, [catalog, intentContext, items])

  const totals = previewCart.totals
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

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
    replaceFirstProduct,
    updateQuantity,
    removeItem,
    clearCart,
    error,
  }
}
