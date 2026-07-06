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
    <div>
      <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Status Pesanan</h3>
      
      {cancelled ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
          <p className="text-sm font-bold text-red-700">{PUBLIC_ORDER_STATUS_LABELS[status]}</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
          {FLOW.map((item, index) => {
            const isCompleted = index < activeIndex
            const isActive = index === activeIndex
            const isFuture = index > activeIndex

            return (
              <div key={item} className="relative">
                {/* Step Circle Pin */}
                <div className="absolute -left-[21px] top-0 w-10 h-10 bg-white flex items-center justify-center shrink-0">
                  {isCompleted && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                  {isActive && (
                    <div className="w-6 h-6 bg-[var(--brand-50)] rounded-full border-2 border-[var(--brand-500)] flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-2.5 bg-[var(--brand-500)] rounded-full animate-pulse" />
                    </div>
                  )}
                  {isFuture && (
                    <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  )}
                </div>

                {/* Step Content */}
                <div className={`pl-6 pt-0.5 ${isFuture ? 'opacity-40' : ''}`}>
                  <p className="font-bold text-gray-900 text-sm leading-tight">
                    {PUBLIC_ORDER_STATUS_LABELS[item]}
                  </p>
                  {isActive && (
                    <p className="text-xs text-gray-500 mt-1">Sedang diproses oleh sistem outlet</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}