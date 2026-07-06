import { useNavigate, useParams } from 'react-router-dom'
import OrderStatusTimeline from '../components/OrderStatusTimeline'
import OrderSummaryCard from '../components/OrderSummaryCard'
import PickupOutletCard from '../components/PickupOutletCard'
import PublicInvoiceActions from '../components/PublicInvoiceActions'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { usePublicOrderStatus } from '../hooks/usePublicOrderStatus'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { PUBLIC_ORDER_STATUS_LABELS } from '../types/orderStatus.types'

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

  return (
    <PublicStoreLayout theme={{ primaryColor: '#166534', primarySoftColor: '#dcfce7' }}>
      <header className="border-b border-gray-100 bg-white px-4 py-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Order {order.orderNumber}</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">{PUBLIC_ORDER_STATUS_LABELS[order.status]}</h1>
        {order.queueNumber && <p className="mt-2 text-sm font-bold text-[var(--store-primary)]">Nomor antrean: {order.queueNumber}</p>}
      </header>
      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Customer</p>
          <p className="mt-2 text-base font-black text-gray-900">{order.customer.name}</p>
          <p className="mt-1 text-sm text-gray-500">{order.customer.phoneMasked}</p>
        </section>
        <OrderStatusTimeline status={order.status} />
        <PickupOutletCard outlet={order.outlet} />
        <OrderSummaryCard items={order.items} totals={order.totals} />
        <PublicInvoiceActions invoice={order.invoice} onBackToMenu={() => navigate('/store/selaluteh-samarinda')} />
        <button type="button" className="h-12 w-full rounded-xl border border-gray-200 bg-white font-black text-gray-800" onClick={orderStatus.refresh}>
          Refresh Status
        </button>
      </div>
    </PublicStoreLayout>
  )
}
