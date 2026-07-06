import { useEffect, useMemo, useState } from 'react'
import { publicStoreApi } from '../api/publicStoreApi'

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

    publicStoreApi
      .getStorefront(storefrontSlug)
      .then((result) => {
        if (!mounted) return
        setStorefront(result.storefront)
        setCategories(result.categories)
        setProducts(result.products)
        setSelectedCategoryId(result.categories[0]?.id || '')
      })
      .catch(() => mounted && setError('Gagal memuat storefront.'))
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
