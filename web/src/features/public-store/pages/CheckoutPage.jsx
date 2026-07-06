import { useNavigate, useParams } from 'react-router-dom'
import CustomerCheckoutForm from '../components/CustomerCheckoutForm'
import OrderSummaryCard from '../components/OrderSummaryCard'
import PickupOutletCard from '../components/PickupOutletCard'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { useCheckoutForm } from '../hooks/useCheckoutForm'
import { useGuestCart } from '../hooks/useGuestCart'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'

export default function CheckoutPage() {
  const { storefrontSlug } = useParams()
  const navigate = useNavigate()
  const store = usePublicStorefront(storefrontSlug)
  const selectedOutletId = typeof window !== 'undefined' ? window.localStorage.getItem(`public-store-outlet:${storefrontSlug}`) : ''
  const outlets = store.storefront?.outlets || (store.storefront?.outlet ? [store.storefront.outlet] : [])
  const selectedOutlet = outlets.find((outlet) => outlet.id === selectedOutletId) || outlets[0]
  const cart = useGuestCart({ storefront: store.storefront, products: store.products, outlet: selectedOutlet })
  const form = useCheckoutForm({
    cart: cart.cart,
    onSuccess: (checkout) => navigate(`/store/payment/pending/${checkout.checkoutToken}`),
  })

  if (store.loading) {
    return (
      <PublicStoreLayout>
        <StoreSkeleton />
      </PublicStoreLayout>
    )
  }

  if (!store.storefront) {
    return (
      <PublicStoreLayout>
        <StoreErrorState title="Store tidak ditemukan" description="Tidak bisa membuka checkout." />
      </PublicStoreLayout>
    )
  }

  return (
    <PublicStoreLayout theme={store.storefront.theme}>
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button type="button" className="h-11 rounded-xl border border-gray-100 px-3 text-sm font-bold text-gray-700" onClick={() => navigate(`/store/${store.storefront.slug}`)}>
            Back
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900">Checkout Pickup</h1>
            <p className="text-xs text-gray-500">Isi data customer tanpa login.</p>
          </div>
        </div>
      </header>
      <div className="space-y-4 p-4 pb-28">
        <PickupOutletCard outlet={selectedOutlet} />
        <CustomerCheckoutForm form={form} />
        <OrderSummaryCard items={cart.items} totals={cart.totals} />
      </div>
      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white p-4">
        <button type="button" className="h-12 w-full rounded-xl bg-[var(--store-primary)] font-black text-white disabled:cursor-not-allowed disabled:bg-gray-200" onClick={form.submit} disabled={form.submitting}>
          {form.submitting ? 'Membuat Checkout...' : 'Bayar Sekarang'}
        </button>
      </div>
    </PublicStoreLayout>
  )
}
