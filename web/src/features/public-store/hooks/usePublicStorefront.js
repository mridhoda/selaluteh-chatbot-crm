import { useEffect, useMemo, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { getSafePublicStoreError, normalizeStorefrontResponse } from '../utils/publicStoreModel'

export function usePublicStorefront(storefrontSlug) {
  const [storefront, setStorefront] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    phase5ApiClient.public
      .getStorefront(storefrontSlug)
      .then((result) => {
        if (!mounted) return
        const normalized = normalizeStorefrontResponse(result)
        setStorefront(normalized.storefront)
        setCategories(normalized.categories)
        setProducts(normalized.products)
        setSelectedCategoryId(normalized.categories[0]?.id || '')
      })
      .catch((error) => mounted && setError(getSafePublicStoreError(error, 'Storefront tidak ditemukan.')))
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [storefrontSlug])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId
      const matchesSearch = !query || `${product.name} ${product.description || ''}`.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, searchQuery, selectedCategoryId])

  return {
    storefront,
    categories,
    products,
    filteredProducts,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    loading,
    error,
  }
}
