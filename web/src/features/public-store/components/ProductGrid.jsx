import ProductCard from './ProductCard'
import StoreEmptyState from './StoreEmptyState'

export default function ProductGrid({ products, onSelect }) {
  if (!products.length) {
    return <StoreEmptyState title="Menu tidak ditemukan" description="Coba kata kunci lain atau pilih kategori berbeda." />
  }

  return (
    <section className="mt-4 space-y-3 px-4 pb-28" aria-label="Daftar produk">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelect} />
      ))}
    </section>
  )
}
