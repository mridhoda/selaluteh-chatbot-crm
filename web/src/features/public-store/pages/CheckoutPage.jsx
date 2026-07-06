import { useNavigate, useParams } from 'react-router-dom'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { useCheckoutForm } from '../hooks/useCheckoutForm'
import { useGuestCart } from '../hooks/useGuestCart'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { formatCurrency } from '../utils/formatCurrency'

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
      {/* Header */}
      <header className="sticky top-0 z-45 bg-white border-b border-gray-100 shadow-sm h-14 shrink-0">
        <div className="flex items-center justify-between px-4 h-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => navigate(`/store/${store.storefront.slug}`)}
            className="p-2 -ml-2 text-gray-750 hover:bg-gray-50 rounded-full transition-colors active:scale-95"
            aria-label="Kembali"
          >
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-black text-gray-900 flex-1 text-center truncate pr-8">Checkout</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md w-full mx-auto pb-32">
        {/* Pickup Outlet Box */}
        <div className="bg-white mb-2 p-4 border-b border-gray-100">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Pickup Outlet</h3>
          {selectedOutlet && (
            <div className="flex items-start gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]" aria-hidden="true">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.3" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-black text-gray-900 text-sm">{selectedOutlet.name}</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{selectedOutlet.address}</p>
                {selectedOutlet.distanceLabel && (
                  <p className="text-[11px] font-black text-orange-500 mt-1">Jarak: {selectedOutlet.distanceLabel}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Customer Data */}
        <div className="bg-white mb-2 p-4 border-b border-gray-100">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Data Customer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nama Lengkap <span className="text-[var(--brand-500)]">*</span>
              </label>
              <input
                type="text"
                value={form.values.name}
                onChange={(e) => form.setField('name', e.target.value)}
                placeholder="Masukkan nama"
                className={`w-full border ${
                  form.errors.name ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--brand-500)] focus:ring-[var(--brand-50)]'
                } rounded-2xl p-3 text-sm font-semibold outline-none focus:ring-4 transition`}
              />
              {form.errors.name && <p className="text-red-500 text-xs font-bold mt-1.5">{form.errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nomor WhatsApp <span className="text-[var(--brand-500)]">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.values.phone}
                onChange={(e) => form.setField('phone', e.target.value)}
                placeholder="081234567890"
                className={`w-full border ${
                  form.errors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--brand-500)] focus:ring-[var(--brand-50)]'
                } rounded-2xl p-3 text-sm font-semibold outline-none focus:ring-4 transition`}
              />
              {form.errors.phone && <p className="text-red-500 text-xs font-bold mt-1.5">{form.errors.phone}</p>}
              <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m22 4-10 10.01-3-3" />
                </svg>
                Nomor digunakan untuk update pesanan
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Catatan Pesanan (opsional)</label>
              <textarea
                value={form.values.note}
                onChange={(e) => form.setField('note', e.target.value)}
                placeholder="Contoh: Titip di satpam ya, gula dipisah"
                rows={2}
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm font-semibold outline-none focus:border-[var(--brand-500)] focus:ring-[var(--brand-50)] focus:ring-4 resize-none transition"
              />
            </div>
          </div>
          {form.submitError && <p className="text-red-500 text-xs font-bold mt-3">{form.submitError}</p>}
        </div>

        {/* Order Items Summary */}
        <div className="bg-white p-4">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <div className="space-y-3 mb-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-700 leading-tight">
                  <span className="font-extrabold">{item.quantity}x</span> {item.productName}
                  {item.modifierSummary?.length > 0 && (
                    <span className="block text-xs text-gray-400 mt-0.5">{item.modifierSummary.join(', ')}</span>
                  )}
                </span>
                <span className="text-gray-900 font-extrabold shrink-0">{formatCurrency(item.lineTotalMinor)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800">{formatCurrency(cart.totals.subtotalMinor)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Biaya Layanan</span>
              <span className="font-semibold text-gray-800">{formatCurrency(cart.totals.serviceFeeMinor)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-dashed border-gray-150">
              <span>Total</span>
              <span className="text-[var(--brand-600)]">{formatCurrency(cart.totals.totalMinor)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Checkout Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={form.submit}
            disabled={form.submitting || !cart.items.length}
            className="w-full bg-[var(--brand-500)] text-white font-bold text-base py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-[var(--brand-600)] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <span>{form.submitting ? 'Membuat Pesanan...' : 'Lanjut Bayar'}</span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full mx-1" />
            <span>{formatCurrency(cart.totals.totalMinor)}</span>
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-2">Dengan lanjut bayar, pesanan akan dibuat untuk pickup.</p>
        </div>
      </div>
    </PublicStoreLayout>
  )
}