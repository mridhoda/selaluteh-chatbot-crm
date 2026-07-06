import { formatCurrency } from '../utils/formatCurrency'

export default function CartSummary({ totals }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(totals.subtotalMinor)}</span></div>
        <div className="flex justify-between text-gray-600"><span>Service fee preview</span><span>{formatCurrency(totals.serviceFeeMinor)}</span></div>
        <div className="flex justify-between text-gray-600"><span>Diskon</span><span>- {formatCurrency(totals.discountMinor)}</span></div>
        <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-black text-gray-900"><span>Total preview</span><span>{formatCurrency(totals.totalMinor)}</span></div>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-gray-500">Final harga, fee, diskon, dan pembayaran divalidasi backend.</p>
    </div>
  )
}
