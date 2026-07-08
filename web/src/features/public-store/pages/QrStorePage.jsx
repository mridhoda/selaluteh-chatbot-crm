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
import { phase5ApiClient } from '../api/phase5ApiClient'
import { useGuestCart } from '../hooks/useGuestCart'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import {
  assertNoLockedQrOverride,
  canSelectOutletForQr,
  createStoreIntentContext,
  getEligibleOutlets,
  getSafePublicStoreError,
  normalizeQrResolveResponse,
  resolveSelectedOutlet,
} from '../utils/publicStoreModel'

function getScopeLabel(qrModel) {
  if (qrModel?.qrScope === 'LOCATION') return `Meja/Lokasi: ${qrModel.lockedLocation?.label || 'terkunci'}`
  if (qrModel?.qrScope === 'OUTLET') return 'Outlet dikunci oleh QR ini.'
  return 'Pilih outlet yang tersedia untuk QR ini.'
}

export default function QrStorePage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [qrModel, setQrModel] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    setQrModel(null)

    phase5ApiClient.public
      .resolveQr(qrToken)
      .then((response) => {
        if (!mounted) return
        const normalized = normalizeQrResolveResponse(response)
        setQrModel(normalized)
        setSelectedCategoryId(normalized.categories[0]?.id || '')
        const initialOutlet = normalized.lockedOutlet || (normalized.qrScope === 'UNIVERSAL' ? null : normalized.eligibleOutlets[0])
        setSelectedOutletId(initialOutlet?.id || '')
      })
      .catch((requestError) => mounted && setError(getSafePublicStoreError(requestError, 'QR tidak valid atau sudah tidak aktif.')))
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [qrToken])

  const outlets = useMemo(
    () => getEligibleOutlets({ outlets: qrModel?.eligibleOutlets, qrScope: qrModel?.qrScope, lockedOutlet: qrModel?.lockedOutlet }),
    [qrModel],
  )
  const selectedOutlet = resolveSelectedOutlet({ requestedOutletId: selectedOutletId, outlets, qrScope: qrModel?.qrScope, lockedOutlet: qrModel?.lockedOutlet })
  const canSelectOutlet = canSelectOutletForQr(qrModel)
  const cart = useGuestCart({ storefront: qrModel?.storefront, products: qrModel?.products || [], outlet: selectedOutlet, qrSessionToken: qrModel?.qrSessionToken, includeOutlet: canSelectOutlet })

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return (qrModel?.products || []).filter((product) => {
      const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId
      const matchesSearch = !query || `${product.name} ${product.description || ''}`.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [qrModel, searchQuery, selectedCategoryId])

  const selectOutlet = (outletId) => {
    if (!canSelectOutlet) return
    if (!outlets.some((outlet) => outlet.id === outletId && outlet.isAvailable !== false)) return
    setSelectedOutletId(outletId)
    cart.clearCart()
  }

  if (loading) {
    return (
      <PublicStoreLayout>
        <StoreSkeleton />
      </PublicStoreLayout>
    )
  }

  if (error || !qrModel?.storefront) {
    return (
      <PublicStoreLayout theme={qrModel?.storefront?.theme}>
        <StoreErrorState title="QR tidak dapat digunakan" description={error || 'QR tidak valid atau sudah kedaluwarsa.'} />
      </PublicStoreLayout>
    )
  }

  if (!outlets.length) {
    return (
      <PublicStoreLayout theme={qrModel.storefront.theme}>
        <StoreHeader brandName={qrModel.storefront.brandName || qrModel.storefront.name} logoUrl={qrModel.storefront.theme.logoUrl} cartCount={0} onOpenCart={() => {}} />
        <StoreErrorState title="Outlet QR tidak tersedia" description="Tidak ada outlet eligible dari backend untuk QR ini." />
      </PublicStoreLayout>
    )
  }

  const canOpenCart = Boolean(selectedOutlet)
  const lockLabel = getScopeLabel(qrModel)
  const intentContext = createStoreIntentContext({ storefrontSlug: qrModel.storefront.slug, selectedOutlet, qrModel })

  return (
    <PublicStoreLayout theme={qrModel.storefront.theme}>
      <StoreHeader
        brandName={qrModel.storefront.brandName || qrModel.storefront.name}
        logoUrl={qrModel.storefront.theme.logoUrl}
        cartCount={cart.cartCount}
        onOpenCart={() => canOpenCart && setCartOpen(true)}
      />
      <OutletPickupBadge
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelectOutlet={selectOutlet}
        locked={!canSelectOutlet}
        lockLabel={lockLabel}
        requireExplicitSelection={canSelectOutlet}
      />
      <section className="px-4 pt-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-3 text-xs font-bold text-gray-600 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">QR Session</p>
          <p>{lockLabel}</p>
          {!selectedOutlet && <p className="mt-1 text-orange-600">Pilih outlet sebelum lanjut validasi atau checkout.</p>}
        </div>
      </section>
      <HeroBanner banner={qrModel.storefront.banner} />
      <CategoryTabs
        categories={qrModel.categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ProductGrid products={filteredProducts} cartItems={cart.items} onSelect={canOpenCart ? setSelectedProduct : () => {}} />
      <FloatingCartButton count={cart.cartCount} totalMinor={cart.displayTotalMinor} onClick={() => canOpenCart && setCartOpen(true)} />
      <ProductModifierSheet
        open={Boolean(selectedProduct)}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={async (payload) => {
          assertNoLockedQrOverride({ qrModel, selectedOutletId: intentContext.outletId, selectedLocationId: intentContext.qrLocationId })
          return cart.addItem(payload)
        }}
      />
      <CartDrawer
        open={cartOpen}
        outlet={selectedOutlet}
        cart={{ ...cart.cart, outletId: intentContext.outletId, qrSessionToken: intentContext.qrSessionToken }}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onCheckout={() => {
          if (!selectedOutlet) return
          const params = new URLSearchParams()
          if (intentContext.outletId) params.set('outletId', intentContext.outletId)
          if (intentContext.qrSessionToken) params.set('qrSessionToken', intentContext.qrSessionToken)
          params.set('includeOutlet', String(canSelectOutlet))
          navigate(`/store/${qrModel.storefront.slug}/checkout?${params.toString()}`)
        }}
      />
    </PublicStoreLayout>
  )
}
