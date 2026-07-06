import { PUBLIC_ORDER_STATUS, PUBLIC_ORDER_STATUS_LABELS } from '../types/orderStatus.types'

const FLOW = [
  PUBLIC_ORDER_STATUS.PAYMENT_PENDING,
  PUBLIC_ORDER_STATUS.PAID,
  PUBLIC_ORDER_STATUS.AWAITING_OUTLET_APPROVAL,
  PUBLIC_ORDER_STATUS.PREPARING,
  PUBLIC_ORDER_STATUS.READY_FOR_PICKUP,
  PUBLIC_ORDER_STATUS.COMPLETED,
]

export default function OrderStatusTimeline({ status }) {
  const activeIndex = FLOW.indexOf(status)
  const cancelled = status === PUBLIC_ORDER_STATUS.CANCELLED || status === PUBLIC_ORDER_STATUS.PAYMENT_EXPIRED

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-gray-900">Status Pesanan</h2>
      {cancelled ? (
        <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{PUBLIC_ORDER_STATUS_LABELS[status]}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {FLOW.map((item, index) => {
            const done = index <= activeIndex
            return (
              <li key={item} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${done ? 'bg-[var(--store-primary)] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {index + 1}
                </span>
                <span className={`text-sm font-bold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{PUBLIC_ORDER_STATUS_LABELS[item]}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
