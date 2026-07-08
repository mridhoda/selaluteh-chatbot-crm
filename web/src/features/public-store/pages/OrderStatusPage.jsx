import { useNavigate, useParams } from 'react-router-dom'
import OrderStatusTimeline from '../components/OrderStatusTimeline'
import OrderSummaryCard from '../components/OrderSummaryCard'
import PickupOutletCard from '../components/PickupOutletCard'
import PublicInvoiceActions from '../components/PublicInvoiceActions'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { usePublicOrderStatus } from '../hooks/usePublicOrderStatus'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { toTimelineStatus } from '../utils/cartIntentModel'

export default function OrderStatusPage() {
  const { publicOrderToken } = useParams()
  const navigate = useNavigate()
  const orderStatus = usePublicOrderStatus(publicOrderToken)
  const order = orderStatus.order

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

  const handleBackToMenu = () => navigate(`/store/selalu-kopi`)

  return (
    <PublicStoreLayout theme={{ primaryColor: 'var(--brand-500)', primarySoftColor: 'var(--brand-50)' }}>
      <header className="sticky top-0 z-45 bg-white border-b border-gray-100 shadow-sm h-14 shrink-0">
        <div className="flex items-center justify-between px-4 h-full max-w-md mx-auto">
          <div className="w-10" />
          <h1 className="text-lg font-black text-gray-900 flex-1 text-center truncate">Detail Pesanan</h1>
          <button
            type="button"
            onClick={handleBackToMenu}
            className="p-2 -mr-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors active:scale-95"
            aria-label="Tutup"
          >
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto pb-8">
        <div className="bg-white px-6 py-5 text-center border-b border-gray-100 flex flex-col items-center">
          <div className="w-14 h-14 bg-[var(--brand-50)] rounded-full flex items-center justify-center text-[var(--brand-600)] mb-3 shadow-sm">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900" style={{ lineHeight: 1.2, marginTop: 0 }}>Status Pesanan</h2>
          <p className="-mt-1.5 text-gray-500 text-sm leading-none mb-5">Halaman publik hanya menampilkan data aman dari backend.</p>

          <div className="flex items-center justify-center gap-4 w-full">
            <div className="bg-gray-50 rounded-xl p-3 flex-1 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Order ID</p>
              <p className="font-extrabold text-gray-900 text-sm">#{order.orderNumberPublic}</p>
            </div>
            {order.queueNumber && (
              <div className="bg-[var(--brand-50)] rounded-xl p-3 flex-1 border border-[var(--brand-100)]">
                <p className="text-[10px] text-[var(--brand-500)] font-bold uppercase tracking-wider mb-1">Queue No</p>
                <p className="font-black text-[var(--brand-600)] text-lg leading-none">#{order.queueNumber}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white mt-2 p-5 border-y border-gray-100">
          <OrderStatusTimeline status={toTimelineStatus(order.status)} />
        </div>

        <div className="bg-white mt-2 px-5 py-4 border-y border-gray-100 space-y-3">
          <div>
            <PickupOutletCard outlet={order.outlet} />
          </div>

          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-0.5">Data Customer</h3>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <p className="m-0 font-extrabold text-gray-900 leading-tight">{order.customer.name}</p>
              <p className="m-0 mt-0.5 text-gray-500 font-semibold leading-normal">{order.customer.phoneMasked}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-0.5">Status Aman</h3>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600">
              <p className="m-0">Payment: {order.paymentStatus}</p>
              <p className="m-0 mt-1">Fulfillment: {order.fulfillmentStatus}</p>
              {order.qrContext?.locationLabel && <p className="m-0 mt-1">QR: {order.qrContext.locationLabel}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white mt-2 p-5 border-y border-gray-100">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <OrderSummaryCard items={order.items} totals={order.totals} />
        </div>

        <div className="p-4 space-y-3 mt-2 bg-white border-t border-gray-100">
          {order.invoice && <PublicInvoiceActions invoice={order.invoice} onBackToMenu={handleBackToMenu} />}
          {!order.invoice && (
            <button
              type="button"
              className="w-full bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-full hover:bg-gray-50 transition-colors"
              onClick={handleBackToMenu}
            >
              Kembali ke Menu
            </button>
          )}
          <button
            type="button"
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-full hover:bg-gray-50 transition-colors"
            onClick={orderStatus.refresh}
          >
            Refresh Status
          </button>
        </div>
      </main>
    </PublicStoreLayout>
  )
}
