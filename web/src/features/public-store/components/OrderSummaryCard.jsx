import { formatCurrency } from '../utils/formatCurrency'

export default function OrderSummaryCard({ items = [], totals }) {
  return (
    <section>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="text-sm">
            <div className="flex justify-between items-start gap-3">
              <p className="m-0 truncate font-bold leading-tight text-gray-900">{item.quantity}x {item.productName}</p>
              <span className="shrink-0 font-bold text-gray-700 leading-tight">{formatCurrency(item.lineTotalMinor || 0)}</span>
            </div>
            {item.modifierSummary?.length > 0 && (
              <p className="m-0 mt-0.5 truncate text-xs leading-normal text-gray-500">{item.modifierSummary.join(', ')}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(totals.subtotalMinor)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Service fee preview</span><span>{formatCurrency(totals.serviceFeeMinor)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Diskon</span><span>- {formatCurrency(totals.discountMinor)}</span></div>
          <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-black text-gray-900"><span>Total preview</span><span>{formatCurrency(totals.totalMinor)}</span></div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-gray-500">Final harga, fee, diskon, dan pembayaran divalidasi backend.</p>
      </div>
    </section>
  )
}
