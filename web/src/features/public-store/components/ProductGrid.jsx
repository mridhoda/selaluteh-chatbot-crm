import ProductCard from './ProductCard'
import StoreEmptyState from './StoreEmptyState'

export default function ProductGrid({ products, cartItems = [], onSelect }) {
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
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          cartQuantity={getProductCartQuantity(product.id)}
          onSelect={onSelect}
        />
      ))}
    </section>
  )
}
