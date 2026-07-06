import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CartDrawer from '../components/CartDrawer'
import CategoryTabs from '../components/CategoryTabs'
import FloatingCartButton from '../components/FloatingCartButton'
import HeroBanner from '../components/HeroBanner'
import OutletPickupBadge from '../components/OutletPickupBadge'
import ProductGrid from '../components/ProductGrid'
import ProductModifierSheet from '../components/ProductModifierSheet'
import StoreErrorState from '../components/StoreErrorState'
import StoreHeader from '../components/StoreHeader'
import StoreSkeleton from '../components/StoreSkeleton'
import { useGuestCart } from '../hooks/useGuestCart'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'

export default function StorefrontPage() {
  const { storefrontSlug } = useParams()
  const navigate = useNavigate()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const store = usePublicStorefront(storefrontSlug)
  const outlets = useMemo(
    () => store.storefront?.outlets || (store.storefront?.outlet ? [store.storefront.outlet] : []),
    [store.storefront],
  )
  const selectedOutlet = outlets.find((outlet) => outlet.id === selectedOutletId) || outlets[0]
  const cart = useGuestCart({ storefront: store.storefront, products: store.products, outlet: selectedOutlet })

  useEffect(() => {
    if (!outlets.length) return
    const storedOutletId = window.localStorage.getItem(`public-store-outlet:${storefrontSlug}`)
    const nextOutletId = outlets.some((outlet) => outlet.id === storedOutletId) ? storedOutletId : outlets[0].id
    setSelectedOutletId(nextOutletId)
  }, [outlets, storefrontSlug])

  const selectOutlet = (outletId) => {
    setSelectedOutletId(outletId)
    window.localStorage.setItem(`public-store-outlet:${storefrontSlug}`, outletId)
  }

  if (store.loading) {
    return (
      <PublicStoreLayout>
        <StoreSkeleton />
      </PublicStoreLayout>
    )
  }

  if (store.error) {
    return (
      <PublicStoreLayout>
        <StoreErrorState title="Store gagal dimuat" description={store.error} />
      </PublicStoreLayout>
    )
  }

  if (!store.storefront) {
    return (
      <PublicStoreLayout>
        <StoreErrorState title="Store tidak ditemukan" description="QR atau link storefront tidak valid." />
      </PublicStoreLayout>
    )
  }

  if (!store.storefront.isActive) {
    return (
      <PublicStoreLayout theme={store.storefront.theme}>
        <StoreErrorState title="Store belum aktif" description="Outlet belum menerima pesanan online saat ini." />
      </PublicStoreLayout>
    )
  }

  return (
    <PublicStoreLayout theme={store.storefront.theme}>
      <StoreHeader
        brandName={store.storefront.brandName}
        logoUrl={store.storefront.theme.logoUrl}
        cartCount={cart.cartCount}
        onOpenCart={() => setCartOpen(true)}
      />
      <OutletPickupBadge
        outlets={outlets}
        selectedOutletId={selectedOutlet?.id || ''}
        onSelectOutlet={selectOutlet}
      />
      <HeroBanner banner={store.storefront.banner} />
      <CategoryTabs
        categories={store.categories}
        selectedCategoryId={store.selectedCategoryId}
        onSelect={store.setSelectedCategoryId}
        searchQuery={store.searchQuery}
        onSearchChange={store.setSearchQuery}
      />
      <ProductGrid products={store.filteredProducts} onSelect={setSelectedProduct} />
      <FloatingCartButton count={cart.cartCount} totalMinor={cart.displayTotalMinor} onClick={() => setCartOpen(true)} />
      <ProductModifierSheet
        open={Boolean(selectedProduct)}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={cart.addItem}
      />
      <CartDrawer
        open={cartOpen}
        outlet={selectedOutlet}
        cart={cart.cart}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onCheckout={() => navigate(`/store/${store.storefront.slug}/checkout`)}
      />
    </PublicStoreLayout>
  )
}
