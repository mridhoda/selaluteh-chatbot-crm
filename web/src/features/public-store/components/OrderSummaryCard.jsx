import { formatCurrency } from '../utils/formatCurrency'
import OrderProductThumbnail from './OrderProductThumbnail'

export default function OrderSummaryCard({ items = [], totals, productImages = {}, customerNote = '' }) {
  return (
    <section>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 text-sm">
            <OrderProductThumbnail
              imageUrl={item.imageUrl || productImages[String(item.productId)]}
              name={item.productName}
            />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-start gap-3">
                <p className="m-0 truncate font-bold leading-tight text-gray-900">{item.quantity}x {item.productName}</p>
                <span className="shrink-0 font-bold text-gray-700 leading-tight">{formatCurrency(item.lineTotalMinor || 0)}</span>
              </div>
              {item.modifierSummary?.length > 0 && (
                <p className="m-0 mt-0.5 truncate text-xs leading-normal text-gray-500">{item.modifierSummary.join(', ')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {customerNote && (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="m-0 text-[10px] font-black uppercase tracking-wider text-amber-600">Catatan Pesanan</p>
          <p className="m-0 mt-1 font-medium leading-relaxed">{customerNote}</p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(totals.subtotalMinor)}</span></div>
          {totals.serviceFeeMinor > 0 && <div className="flex justify-between text-gray-600"><span>Biaya Layanan</span><span>{formatCurrency(totals.serviceFeeMinor)}</span></div>}
          {totals.discountMinor > 0 && <div className="flex justify-between text-gray-600"><span>Diskon</span><span>- {formatCurrency(totals.discountMinor)}</span></div>}
          <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-black text-gray-900"><span>Total Pesanan</span><span>{formatCurrency(totals.totalMinor)}</span></div>
        </div>
      </div>
    </section>
  )
}
