import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CartDrawer from '../components/CartDrawer'
import CategoryTabs from '../components/CategoryTabs'
import FloatingCartButton from '../components/FloatingCartButton'
import HeroBanner from '../components/HeroBanner'
import NearestOutletModal from '../components/NearestOutletModal'
import OutletPickupBadge from '../components/OutletPickupBadge'
import PaymentReturnCallout from '../components/PaymentReturnCallout'
import ProductGrid from '../components/ProductGrid'
import ProductModifierSheet from '../components/ProductModifierSheet'
import StoreErrorState from '../components/StoreErrorState'
import StoreHeader from '../components/StoreHeader'
import StoreSkeleton from '../components/StoreSkeleton'
import { useGuestCart } from '../hooks/useGuestCart'
import { useNearestOutletRecommendation } from '../hooks/useNearestOutletRecommendation'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { getEligibleOutlets } from '../utils/publicStoreModel'
import { recommendationProduct } from '../utils/recommendationModel'
import { phase5ApiClient } from '../api/phase5ApiClient'

export default function StorefrontPage() {
  const { storefrontSlug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [recommendationSessionId] = useState(() => {
    const key = `public-store-recommendation-session:${storefrontSlug || 'default'}`
    const existing = window.sessionStorage.getItem(key)
    const next = existing || (window.crypto?.randomUUID?.() || `session_${Date.now()}`)
    window.sessionStorage.setItem(key, next)
    return next
  })
  const store = usePublicStorefront(storefrontSlug, selectedOutletId)
  const outlets = useMemo(
    () =>
      getEligibleOutlets({
        outlets:
          store.storefront?.outlets ||
          (store.storefront?.outlet ? [store.storefront.outlet] : []),
      }),
    [store.storefront]
  )
  const selectedOutlet =
    outlets.find((outlet) => outlet.id === selectedOutletId) || outlets[0]
  const hasStoredOutlet = Boolean(
    window.localStorage.getItem(`public-store-outlet:${storefrontSlug}`)
  )
  const nearestOutlet = useNearestOutletRecommendation(
    outlets,
    !hasStoredOutlet,
    storefrontSlug
  )
  const cartCatalog = useMemo(
    () => [
      ...store.products,
      ...store.cartProducts.filter(
        (product) =>
          !store.products.some((current) => current.id === product.id)
      ),
    ],
    [store.cartProducts, store.products]
  )
  const cart = useGuestCart({
    storefront: store.storefront,
    products: cartCatalog,
    outlet: selectedOutlet,
    recommendationSessionId,
  })
  const paymentReturn = searchParams.get('paymentReturn')
  const orderToken = searchParams.get('orderToken')
  const isPaymentReturn =
    ['success', 'pending'].includes(paymentReturn) && Boolean(orderToken)
  const openOrder = useCallback(
    () => navigate(`/order/${orderToken}`, { replace: true }),
    [navigate, orderToken]
  )
  const selectRecommendation = (recommendation) => {
    const product =
      cartCatalog.find((item) => item.id === recommendation.productId) ||
      recommendationProduct(recommendation)
    setSelectedProduct({
      ...product,
      recommendationId: recommendation.recommendationId,
      recommendationActionType: recommendation.actionType,
      recommendationSourceProductId: recommendation.sourceProductId,
    })
    setCartOpen(false)
  }
  const addProduct = async (payload) => {
    const ok = selectedProduct?.recommendationActionType === 'replace_source'
      ? await cart.replaceFirstProduct({ ...payload, sourceProductId: selectedProduct.recommendationSourceProductId, product: selectedProduct })
      : await cart.addItem({ ...payload, product: selectedProduct })
    if (ok && selectedProduct?.recommendationId) {
      void phase5ApiClient.public
        .recordRecommendationEvent({
          storefront_slug: store.storefront?.slug,
          outlet_id: selectedOutlet?.id,
          event_type: 'accepted',
          placement: 'cart',
           recommendation_id: selectedProduct.recommendationId,
           target_product_id: selectedProduct.id,
           session_id: recommendationSessionId,
        })
        .catch(() => {})
    }
    return ok
  }

  useEffect(() => {
    if (!outlets.length) return
    const storedOutletId = window.localStorage.getItem(
      `public-store-outlet:${storefrontSlug}`
    )
    const nextOutletId = outlets.some((outlet) => outlet.id === storedOutletId)
      ? storedOutletId
      : outlets[0].id
    setSelectedOutletId(nextOutletId)
  }, [outlets, storefrontSlug])

  useEffect(() => {
    if (!isPaymentReturn || store.loading || !store.storefront) return undefined
    window.localStorage.setItem(
      `public-store-last-order:${storefrontSlug}`,
      orderToken
    )
    if (paymentReturn !== 'success') return undefined

    setSecondsLeft(3)
    const countdown = window.setInterval(
      () => setSecondsLeft((current) => Math.max(0, current - 1)),
      1000
    )
    const redirect = window.setTimeout(openOrder, 3000)
    return () => {
      window.clearInterval(countdown)
      window.clearTimeout(redirect)
    }
  }, [
    isPaymentReturn,
    openOrder,
    orderToken,
    paymentReturn,
    store.loading,
    store.storefront,
    storefrontSlug,
  ])

  const selectOutlet = (outletId) => {
    if (
      !outlets.some(
        (outlet) => outlet.id === outletId && outlet.isAvailable !== false
      )
    )
      return
    setSelectedOutletId(outletId)
    window.localStorage.setItem(
      `public-store-outlet:${storefrontSlug}`,
      outletId
    )
    cart.clearCart()
  }

  if (store.loading || (store.menuLoading && !store.products.length)) {
    return (
      <PublicStoreLayout>
        <StoreSkeleton />
      </PublicStoreLayout>
    )
  }

  if (store.error) {
    return (
      <PublicStoreLayout>
        <StoreErrorState title='Store gagal dimuat' description={store.error} />
      </PublicStoreLayout>
    )
  }

  if (!store.storefront) {
    return (
      <PublicStoreLayout>
        <StoreErrorState
          title='Store tidak ditemukan'
          description='QR atau link storefront tidak valid.'
        />
      </PublicStoreLayout>
    )
  }

  if (!store.storefront.isActive) {
    return (
      <PublicStoreLayout theme={store.storefront.theme}>
        <StoreErrorState
          title='Store belum aktif'
          description='Outlet belum menerima pesanan online saat ini.'
        />
      </PublicStoreLayout>
    )
  }

  if (!outlets.length) {
    return (
      <PublicStoreLayout theme={store.storefront.theme}>
        <StoreHeader
          brandName={store.storefront.brandName || store.storefront.name}
          subtitle={store.storefront.description || 'Online Store'}
          logoUrl={store.storefront.theme.logoUrl}
          cartCount={0}
          storefrontSlug={store.storefront.slug}
          onOpenCart={() => {}}
        />
        <StoreErrorState
          title='Outlet tidak tersedia'
          description='Belum ada outlet aktif untuk pemesanan online.'
        />
      </PublicStoreLayout>
    )
  }

  return (
    <PublicStoreLayout theme={store.storefront.theme}>
      <StoreHeader
        brandName={store.storefront.brandName || store.storefront.name}
        subtitle={store.storefront.description || 'Online Store'}
        logoUrl={store.storefront.theme.logoUrl}
        cartCount={cart.cartCount}
        storefrontSlug={store.storefront.slug}
        recommendationSessionId={recommendationSessionId}
        onOpenCart={() => setCartOpen(true)}
      />
      <OutletPickupBadge
        outlets={outlets}
        selectedOutletId={selectedOutlet?.id || ''}
        onSelectOutlet={selectOutlet}
      />
      {isPaymentReturn && (
        <PaymentReturnCallout
          status={paymentReturn}
          secondsLeft={secondsLeft}
          onOpenOrder={openOrder}
        />
      )}
      <NearestOutletModal
        outlet={nearestOutlet.recommendation}
        onDismiss={nearestOutlet.dismiss}
        onConfirm={() => {
          selectOutlet(nearestOutlet.recommendation.id)
          nearestOutlet.dismiss()
        }}
      />
      <HeroBanner banner={store.storefront.banner} />
      <CategoryTabs
        categories={store.categories}
        selectedCategoryId={store.selectedCategoryId}
        onSelect={store.setSelectedCategoryId}
        searchQuery={store.searchQuery}
        onSearchChange={store.setSearchQuery}
      />
      <ProductGrid
        products={store.products}
        cartItems={cart.items}
        onSelect={setSelectedProduct}
        hasMore={store.hasMore}
        loadingMore={store.loadingMore}
        onLoadMore={store.loadMoreProducts}
      />
      <FloatingCartButton
        count={cart.cartCount}
        totalMinor={cart.displayTotalMinor}
        onClick={() => setCartOpen(true)}
      />
      <ProductModifierSheet
        open={Boolean(selectedProduct)}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addProduct}
      />
      <CartDrawer
        open={cartOpen}
        outlet={selectedOutlet}
        cart={cart.cart}
        storefrontSlug={store.storefront.slug}
        recommendationSessionId={recommendationSessionId}
        onSelectRecommendation={selectRecommendation}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onCheckout={() => navigate(`/store/${store.storefront.slug}/checkout?recommendationSessionId=${encodeURIComponent(recommendationSessionId)}`)}
      />
    </PublicStoreLayout>
  )
}
