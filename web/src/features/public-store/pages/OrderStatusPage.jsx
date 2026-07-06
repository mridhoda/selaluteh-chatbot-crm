import { useNavigate, useParams } from 'react-router-dom'
import OrderStatusTimeline from '../components/OrderStatusTimeline'
import OrderSummaryCard from '../components/OrderSummaryCard'
import PickupOutletCard from '../components/PickupOutletCard'
import PublicInvoiceActions from '../components/PublicInvoiceActions'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { usePublicOrderStatus } from '../hooks/usePublicOrderStatus'
import PublicStoreLayout from '../layouts/PublicStoreLayout'

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

  const handleBackToMenu = () => {
    navigate(`/store/selaluteh-samarinda`)
  }

  return (
    <PublicStoreLayout theme={{ primaryColor: 'var(--brand-500)', primarySoftColor: 'var(--brand-50)' }}>
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-md w-full mx-auto pb-8">
        {/* Success Header Card */}
        <div className="bg-white p-6 text-center border-b border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">Pembayaran Berhasil!</h2>
          <p className="text-gray-500 text-sm mb-6">Terima kasih, pesanan kamu sudah kami terima.</p>

          <div className="flex items-center justify-center gap-4 w-full">
            <div className="bg-gray-50 rounded-xl p-3 flex-1 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Order ID</p>
              <p className="font-extrabold text-gray-900 text-sm">#{order.orderNumber}</p>
            </div>
            {order.queueNumber && (
              <div className="bg-[var(--brand-50)] rounded-xl p-3 flex-1 border border-[var(--brand-100)]">
                <p className="text-[10px] text-[var(--brand-500)] font-bold uppercase tracking-wider mb-1">Queue No</p>
                <p className="font-black text-[var(--brand-600)] text-lg leading-none">#{order.queueNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Status */}
        <div className="bg-white mt-2 p-5 border-y border-gray-100">
          <OrderStatusTimeline status={order.status} />
        </div>

        {/* Info Cards */}
        <div className="bg-white mt-2 p-5 border-y border-gray-100 space-y-5">
          {/* Pickup Outlet Box */}
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Pickup Outlet</h3>
            <PickupOutletCard outlet={order.outlet} />
          </div>

          {/* Customer Data */}
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Data Customer</h3>
            <div className="flex flex-col gap-1 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="font-extrabold text-gray-900">{order.customer.name}</p>
              <p className="text-gray-500 font-semibold">{order.customer.phoneMasked}</p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white mt-2 p-5 border-y border-gray-100">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <OrderSummaryCard items={order.items} totals={order.totals} />
        </div>

        {/* Actions Invoice */}
        <div className="p-4 space-y-3 mt-2 bg-white border-t border-gray-100">
          <PublicInvoiceActions invoice={order.invoice} onBackToMenu={handleBackToMenu} />
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