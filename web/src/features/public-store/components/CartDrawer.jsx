import CartItemRow from './CartItemRow'
import CartSummary from './CartSummary'

export default function CartDrawer({ open, outlet, cart, onClose, onUpdateQuantity, onRemove, onCheckout }) {
  if (!open) return null
  const hasItems = cart.items.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true" aria-label="Keranjang">
      <button type="button" aria-label="Tutup keranjang" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} />
      <aside className="absolute bottom-0 left-1/2 flex max-h-[92vh] w-full max-w-md -translate-x-1/2 flex-col rounded-t-[32px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-base font-black text-gray-900">Keranjang Pickup</h2>
            <p className="text-xs text-gray-500">{outlet?.name}</p>
          </div>
          <button type="button" className="h-11 w-11 rounded-full bg-gray-100 font-bold" onClick={onClose} aria-label="Tutup">
            x
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {!hasItems && (
            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-base font-black text-gray-900">Keranjang kosong</p>
              <p className="mt-2 text-sm text-gray-500">Tambahkan menu favoritmu terlebih dahulu.</p>
            </div>
          )}
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />
          ))}
          {hasItems && <CartSummary totals={cart.totals} />}
        </div>
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            className="h-12 w-full rounded-xl bg-[var(--store-primary)] font-black text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            disabled={!hasItems}
            onClick={onCheckout}
          >
            Lanjut Checkout
          </button>
        </div>
      </aside>
    </div>
  )
}
