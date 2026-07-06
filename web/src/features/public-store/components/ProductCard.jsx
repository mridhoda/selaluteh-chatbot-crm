import { formatCurrency } from '../utils/formatCurrency'

export default function ProductCard({ product, onSelect }) {
  const unavailable = !product.isAvailable

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
      <div className="flex gap-2.5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-amber-50 text-lg font-black text-[var(--store-primary)]">
          {product.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="line-clamp-1 text-sm font-black leading-4 text-gray-900">{product.name}</h3>
            {product.badges?.[0] && (
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-black text-green-700">{unavailable ? 'SOLD OUT' : product.badges[0]}</span>
            )}
          </div>
          <p className="-mt-1.5 text-[11px] leading-tight text-gray-500">{product.description || 'Menu SelaluTeh siap pickup.'}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-black text-gray-900">{formatCurrency(product.basePriceMinor)}</span>
            <button
              type="button"
              className="h-8 rounded-lg bg-[var(--store-primary)] px-3 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
              onClick={() => onSelect(product)}
              disabled={unavailable}
            >
              {unavailable ? product.availabilityLabel || 'Sold Out' : 'Tambah'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
