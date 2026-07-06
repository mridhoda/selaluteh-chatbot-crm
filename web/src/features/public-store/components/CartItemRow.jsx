import QuantityStepper from './QuantityStepper'
import { formatCurrency } from '../utils/formatCurrency'

export default function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50 font-black text-[var(--store-primary)]">
          {item.productName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-5 text-gray-900">{item.productName}</p>
          {item.modifierSummary?.length > 0 && <p className="mt-0.5 text-xs leading-4 text-gray-500">{item.modifierSummary.join(', ')}</p>}
          {item.note && <p className="mt-0.5 text-xs leading-4 text-gray-500">Catatan: {item.note}</p>}
          <div className="mt-2 flex items-center justify-between gap-3">
            <QuantityStepper value={item.quantity} onChange={(qty) => onUpdateQuantity(item.id, qty)} size="compact" />
            <div className="text-right">
              <p className="text-sm font-black text-gray-900">{formatCurrency(item.lineTotalMinor)}</p>
              <button type="button" className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:bg-red-50" onClick={() => onRemove(item.id)} aria-label="Hapus item">
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
