import { useEffect, useRef, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { getSafePublicStoreError, normalizeStorefrontResponse } from '../utils/publicStoreModel'

export function usePublicStorefront(storefrontSlug, outletId) {
  const [storefront, setStorefront] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [cartProducts, setCartProducts] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('cat_minuman')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuLoading, setMenuLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [error, setError] = useState('')
  const requestRef = useRef(0)
  const catalogKeyRef = useRef('')
  const menuCacheRef = useRef(new Map())

  useEffect(() => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError('')
    setProducts([])
    setCartProducts([])
    setCategories([])
    setSelectedCategoryId('cat_minuman')
    menuCacheRef.current.clear()

    phase5ApiClient.public
      .getStorefrontBootstrap(storefrontSlug)
      .then((result) => {
        if (requestId !== requestRef.current) return
        const normalized = normalizeStorefrontResponse(result)
        setStorefront(normalized.storefront)
        setCategories(normalized.categories)
        setProducts(normalized.products)
        const defaultOutletId = normalized.storefront?.outlet?.id
        if (defaultOutletId) menuCacheRef.current.set(`${storefrontSlug}:${defaultOutletId}:cat_minuman:`, normalized)
        setCartProducts(normalized.products)
        setHasMore(normalized.pagination.hasNext)
        setNextPage(normalized.pagination.page + 1)
      })
      .catch((error) => requestId === requestRef.current && setError(getSafePublicStoreError(error, 'Storefront tidak ditemukan.')))
      .finally(() => requestId === requestRef.current && setLoading(false))
  }, [storefrontSlug])

  useEffect(() => {
    if (!outletId) return undefined
    const requestId = ++requestRef.current
    setError('')
    const cacheKey = `${storefrontSlug}:${outletId}:${selectedCategoryId}:${searchQuery.trim()}`
    const cached = menuCacheRef.current.get(cacheKey)

    if (cached) {
      setMenuLoading(false)
      setCategories(cached.categories)
      setProducts(cached.products)
      setHasMore(cached.pagination.hasNext)
      setNextPage(cached.pagination.page + 1)
      return undefined
    }

    setMenuLoading(true)

    phase5ApiClient.public
      .getStoreMenu(storefrontSlug, { page: 0, limit: 24, outlet_id: outletId, category: selectedCategoryId || undefined, search: searchQuery.trim() || undefined })
      .then((result) => {
        if (requestId !== requestRef.current) return
        const normalized = normalizeStorefrontResponse({ menu: result })
        menuCacheRef.current.set(cacheKey, normalized)
        setCategories(normalized.categories)
        setProducts(normalized.products)
        const catalogKey = `${storefrontSlug}:${outletId}`
        setCartProducts((current) => {
          const previous = catalogKeyRef.current === catalogKey ? current : []
          catalogKeyRef.current = catalogKey
          return [...previous, ...normalized.products.filter((product) => !previous.some((item) => item.id === product.id))]
        })
        setHasMore(normalized.pagination.hasNext)
        setNextPage(normalized.pagination.page + 1)
      })
      .catch((error) => requestId === requestRef.current && setError(getSafePublicStoreError(error, 'Menu tidak dapat dimuat.')))
      .finally(() => requestId === requestRef.current && setMenuLoading(false))
    return () => { requestRef.current += 1 }
  }, [storefrontSlug, outletId, selectedCategoryId, searchQuery])

  const selectCategory = (categoryId) => {
    if (categoryId === selectedCategoryId) return
    setProducts([])
    setHasMore(false)
    setNextPage(1)
    setSelectedCategoryId(categoryId)
  }

  const loadMoreProducts = () => {
    if (loading || loadingMore || !hasMore) return
    const requestId = requestRef.current
    setLoadingMore(true)
    phase5ApiClient.public
      .getStoreMenu(storefrontSlug, {
        page: nextPage,
        limit: 24,
        outlet_id: outletId || undefined,
        category: selectedCategoryId || undefined,
        search: searchQuery.trim() || undefined,
      })
      .then((result) => {
        if (requestId !== requestRef.current) return
        const normalized = normalizeStorefrontResponse(result)
        setProducts((current) => [...current, ...normalized.products.filter((product) => !current.some((item) => item.id === product.id))])
        setCartProducts((current) => [...current, ...normalized.products.filter((product) => !current.some((item) => item.id === product.id))])
        setHasMore(normalized.pagination.hasNext)
        setNextPage(normalized.pagination.page + 1)
      })
      .catch(() => {})
      .finally(() => requestId === requestRef.current && setLoadingMore(false))
  }

  return {
    storefront,
    categories,
    products,
    cartProducts,
    selectedCategoryId,
    setSelectedCategoryId: selectCategory,
    searchQuery,
    setSearchQuery,
    loading,
    menuLoading,
    loadingMore,
    hasMore,
    loadMoreProducts,
    error,
  }
}
