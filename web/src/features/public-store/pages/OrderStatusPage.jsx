import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import OrderStatusTimeline from '../components/OrderStatusTimeline'
import OrderSummaryCard from '../components/OrderSummaryCard'
import PublicInvoiceActions from '../components/PublicInvoiceActions'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { usePublicOrderStatus } from '../hooks/usePublicOrderStatus'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { toTimelineStatus } from '../utils/cartIntentModel'
import { Store, UserRound } from 'lucide-react'

export default function OrderStatusPage() {
  const { publicOrderToken } = useParams()
  const navigate = useNavigate()
  const orderStatus = usePublicOrderStatus(publicOrderToken)
  const order = orderStatus.order

  const storefrontSlug = window.localStorage.getItem('last-storefront-slug') || 'selalu-kopi'
  const store = usePublicStorefront(storefrontSlug)

  useEffect(() => {
    if (order?.publicOrderToken) window.localStorage.setItem(`public-store-last-order:${storefrontSlug}`, order.publicOrderToken)
  }, [order?.publicOrderToken, storefrontSlug])

  if (orderStatus.loading) {
    return (
      <PublicStoreLayout>
        <StoreSkeleton />
      </PublicStoreLayout>
    )
  }

  if (orderStatus.error || !order) {
    return (
      <PublicStoreLayout>
        <StoreErrorState title="Pesanan tidak ditemukan" description={orderStatus.error} />
      </PublicStoreLayout>
    )
  }

  const handleBackToMenu = () => navigate(`/store/${storefrontSlug}`)
  
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate(`/store/${storefrontSlug}`)
    }
  }

  const theme = store.storefront?.theme || { primaryColor: 'var(--brand-500)', primarySoftColor: 'var(--brand-50)' }
  const productImages = Object.fromEntries((store.products || []).map((product) => [String(product.id), product.imageUrl]).filter(([, imageUrl]) => imageUrl))

  return (
    <PublicStoreLayout theme={theme}>
      <header className="sticky top-0 z-45 bg-white border-b border-gray-100 shadow-sm h-14 shrink-0">
        <div className="flex items-center justify-between px-4 h-full max-w-md mx-auto">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors active:scale-95"
            aria-label="Kembali"
          >
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-black text-gray-900 flex-1 text-center truncate pr-8">Detail Pesanan</h1>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto pb-24 px-4 mt-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 bg-[var(--brand-50)] rounded-full flex items-center justify-center text-[var(--brand-600)] mb-3 shadow-sm">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900" style={{ lineHeight: 1.2, marginTop: 0 }}>Status Pesanan</h2>
          <p className="-mt-1.5 text-gray-500 text-sm leading-none mb-5">Pantau progres pesanan kamu.</p>

          {order.queueNumber && (
            <div className="w-full bg-[var(--brand-500)] rounded-xl p-4 border border-[var(--brand-500)]">
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mb-1">Queue</p>
              <p className="font-black text-white text-2xl leading-none">{order.queueNumber}</p>
            </div>
          )}
        </div>

        {/* Timeline Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <OrderStatusTimeline status={toTimelineStatus(order.status)} />
        </div>

        {/* Customer & Outlet Card */}
        <div className="rounded-[14px] border border-[#eee9e2] bg-white px-4 shadow-[0_2px_8px_rgba(28,25,23,0.06)]">
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3ec] text-[#ff7043]">
              <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 7h14M5 12h14M5 17h9" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8b8b8b]">Order ID</div>
              <div className="mt-0.5 truncate text-[13px] font-bold leading-tight text-[#282828]">#{order.orderNumberPublic}</div>
            </div>
          </div>
          <div className="border-t border-[#f0ede9]" />
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3ec] text-[#ff7043]">
              <Store size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8b8b8b]">Lokasi Outlet</div>
              <div className="mt-0.5 truncate text-[13px] font-bold leading-tight text-[#282828]">{order.outlet?.name || 'Outlet'}</div>
            </div>
          </div>
          <div className="border-t border-[#f0ede9]" />
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3ec] text-[#ff7043]">
              <UserRound size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8b8b8b]">Nama Customer</div>
              <div className="mt-0.5 truncate text-[13px] font-bold leading-tight text-[#282828]">{order.customer.name}</div>
              <div className="mt-1 text-[11px] leading-none text-[#ff4f7b]">{order.customer.phoneMasked}</div>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <OrderSummaryCard items={order.items} totals={order.totals} productImages={productImages} customerNote={order.customerNote} />
        </div>

        {/* Actions Card */}
        <div className="p-5 space-y-3 bg-white border border-gray-100 rounded-3xl shadow-sm">
          {order.invoice && <PublicInvoiceActions invoice={order.invoice} onBackToMenu={handleBackToMenu} />}
          {!order.invoice && (
            <button
              type="button"
              className="w-full bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors active:scale-95"
              onClick={handleBackToMenu}
            >
              Kembali ke Menu
            </button>
          )}
        </div>
      </main>
    </PublicStoreLayout>
  )
}
