import { formatCurrency } from '../utils/formatCurrency'

export default function ProductCard({ product, cartQuantity = 0, onSelect }) {
  const unavailable = !product.isAvailable
  const hasCartQuantity = cartQuantity > 0

  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-0">
        {/* Image block — full height, no padding offset */}
        <div className="w-24 shrink-0 self-stretch overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className={`h-full min-h-24 w-full object-cover ${unavailable ? 'grayscale opacity-60' : ''}`}
            />
          ) : (
            <div className="flex h-full min-h-24 w-full items-center justify-center bg-gradient-to-br from-[var(--brand-50)] to-amber-50 text-2xl font-black text-[var(--store-primary)]">
              {product.name.slice(0, 1)}
            </div>
          )}
        </div>

        {/* Text block — compact top padding to give a tiny bit of distance from top */}
        <div className="min-w-0 flex-1 flex flex-col justify-between px-3 pt-5 pb-2.5">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <h3 className="line-clamp-2 text-sm font-black text-gray-900 m-0 p-0" style={{ lineHeight: '1.15' }}>
                {product.name}
              </h3>
              {product.badges?.[0] && (
                <span className="shrink-0 rounded-full bg-[var(--brand-50)] px-1.5 py-0.5 text-[9px] font-black text-[var(--brand-600)]">
                  {unavailable ? 'SOLD OUT' : product.badges[0]}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] leading-tight text-gray-500 line-clamp-2">
              {product.description || ''}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex flex-col leading-none">
              {product.originalPriceMinor && (
                <span className="text-[9px] font-bold text-gray-400 line-through">{formatCurrency(product.originalPriceMinor)}</span>
              )}
              <span className="text-xs font-black text-gray-900">{formatCurrency(product.basePriceMinor)}</span>
            </span>
            <button
              type="button"
              className={`h-8 min-w-8 rounded-xl px-3 text-[11px] font-black focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 ${
                hasCartQuantity
                  ? 'bg-[var(--brand-50)] text-[var(--brand-600)] ring-1 ring-[var(--brand-100)]'
                  : 'bg-[var(--store-primary)] text-white'
              }`}
              onClick={() => onSelect(product)}
              disabled={unavailable}
              aria-label={hasCartQuantity ? `${cartQuantity} item di keranjang` : `Tambah ${product.name}`}
            >
              {unavailable ? product.availabilityLabel || 'Sold Out' : hasCartQuantity ? cartQuantity : 'Tambah'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
