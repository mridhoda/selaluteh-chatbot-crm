import CartSummary from './CartSummary'

export default function OrderSummaryCard({ items = [], totals }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-gray-900">Ringkasan Pesanan</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <div>
              <p className="font-bold text-gray-900">{item.quantity}x {item.productName}</p>
              {item.modifierSummary?.length > 0 && <p className="mt-1 text-xs text-gray-500">{item.modifierSummary.join(', ')}</p>}
            </div>
            <span className="font-bold text-gray-700">Rp {Number(item.lineTotalMinor || 0).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <CartSummary totals={totals} />
      </div>
    </section>
  )
}
