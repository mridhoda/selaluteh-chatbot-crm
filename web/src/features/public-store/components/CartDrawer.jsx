import CartItemRow from './CartItemRow'
import { formatCurrency } from '../utils/formatCurrency'

export default function CartDrawer({ open, outlet, cart, onClose, onUpdateQuantity, onRemove, onCheckout }) {
  if (!open) return null
  const hasItems = cart.items.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/60 transition-opacity" role="dialog" aria-modal="true" aria-label="Keranjang">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-transparent" onClick={onClose} aria-label="Tutup" />
      <aside className="absolute bottom-0 left-1/2 flex max-h-[90vh] w-full max-w-md -translate-x-1/2 flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300">
        {/* Pull bar */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Keranjang Pickup</h2>
          </div>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" onClick={onClose} aria-label="Tutup">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pickup Alert Bar */}
        {hasItems && outlet && (
          <div className="bg-[var(--brand-50)] px-4 py-3 border-b border-[var(--brand-100)] shrink-0">
            <div className="flex items-center gap-2.5 text-[var(--brand-600)]">
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div className="text-xs font-semibold">
                <span className="opacity-90">Pickup di: </span>
                <span className="font-extrabold">{outlet.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Keranjang masih kosong</h3>
              <p className="mt-2 text-sm text-gray-500">Yuk pilih menu favoritmu dulu 🍵</p>
              <button type="button" className="mt-6 rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 transition-transform" onClick={onClose}>
                Mulai Pilih Menu
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="divide-y divide-gray-100 px-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-4">
                    <CartItemRow item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />
                  </div>
                ))}
              </div>

              <div className="h-2 w-full bg-gray-50 border-y border-gray-100" />

              {/* Payment Summary */}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Ringkasan Pembayaran</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(cart.totals.subtotalMinor)}</span>
                </div>
                {cart.totals.serviceFeeMinor > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Biaya Layanan</span>
                    <span className="font-medium text-gray-900">{formatCurrency(cart.totals.serviceFeeMinor)}</span>
                  </div>
                )}
                {cart.totals.discountMinor > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Diskon</span>
                    <span className="font-medium">- {formatCurrency(cart.totals.discountMinor)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-base text-gray-900">
                  <span>Total</span>
                  <span className="text-[var(--brand-600)]">{formatCurrency(cart.totals.totalMinor)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Action Footer */}
        {hasItems && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              className="w-full bg-[var(--brand-500)] text-white font-bold text-base py-3.5 rounded-full flex items-center justify-between px-6 hover:bg-[var(--brand-600)] active:scale-[0.98] transition-all"
              onClick={onCheckout}
            >
              <span>Checkout</span>
              <span>{formatCurrency(cart.totals.totalMinor)}</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
