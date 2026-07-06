import { formatCurrency } from '../utils/formatCurrency'

export default function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  const handleDecrement = () => {
    if (item.quantity <= 1) {
      onRemove(item.id)
    } else {
      onUpdateQuantity(item.id, item.quantity - 1)
    }
  }

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }

  return (
    <div className="flex items-start gap-3 bg-transparent">
      {/* Product Image / Icon — top-aligned, no internal vertical centering */}
      <div className="shrink-0 h-14 w-14 rounded-xl overflow-hidden bg-[var(--brand-50)] border border-[var(--brand-100)]/40">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg font-black text-[var(--store-primary)]">
            {item.productName.slice(0, 1)}
          </div>
        )}
      </div>

      {/* Product Info — starts from same y=0 as image */}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-gray-900 truncate" style={{ lineHeight: 1.2, marginTop: 0 }}>
          {item.productName}
        </h4>

        {item.modifierSummary?.length > 0 && (
          <p className="mt-0.5 text-xs text-gray-500 truncate">
            {item.modifierSummary.join(', ')}
          </p>
        )}

        {item.note && (
          <p className="mt-0.5 text-xs italic text-gray-400 truncate">
            Note: {item.note}
          </p>
        )}

        {/* Price & Stepper Row */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(item.lineTotalMinor)}
          </span>

          {/* Compact Unified Stepper */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1 py-0.5 shadow-sm shrink-0">
            <button
              type="button"
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 hover:bg-gray-100 transition-colors shadow-sm focus:outline-none"
              aria-label={item.quantity === 1 ? 'Hapus item' : 'Kurangi jumlah'}
            >
              {item.quantity === 1 ? (
                <svg aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand-500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              ) : (
                <span className="text-base font-bold leading-none">-</span>
              )}
            </button>

            <span className="min-w-4 text-center text-xs font-black text-gray-950">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--brand-600)] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none"
              aria-label="Tambah jumlah"
            >
              <span className="text-base font-bold leading-none">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
