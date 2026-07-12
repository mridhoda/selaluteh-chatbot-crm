import ProductCard from './ProductCard'
import StoreEmptyState from './StoreEmptyState'
import { useEffect, useRef } from 'react'

export default function ProductGrid({ products, cartItems = [], onSelect, hasMore = false, loadingMore = false, onLoadMore }) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!hasMore || loadingMore || typeof onLoadMore !== 'function' || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore()
    }, { rootMargin: '400px' })
    const sentinel = sentinelRef.current
    if (sentinel) observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  if (!products.length) {
    return <StoreEmptyState title="Menu tidak ditemukan" description="Coba kata kunci lain atau pilih kategori berbeda." />
  }

  const getProductCartQuantity = (productId) => {
    return cartItems
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }

  return (
    <section className="mt-4 space-y-3 px-4 pb-28" aria-label="Daftar produk">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          imagePriority={index < 4}
          cartQuantity={getProductCartQuantity(product.id)}
          onSelect={onSelect}
        />
      ))}
      {hasMore && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}
      {loadingMore && <p className="py-2 text-center text-sm font-semibold text-gray-500" role="status">Memuat menu berikutnya...</p>}
    </section>
  )
}
