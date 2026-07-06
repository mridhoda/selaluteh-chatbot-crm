export default function PaymentPendingCard({ payment, status, loading, error, onPayNow, onRefresh, onOpenOrder }) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 text-2xl font-black text-yellow-700">Rp</div>
      <h1 className="mt-4 text-2xl font-black text-gray-900">Menunggu Pembayaran</h1>
      <p className="mt-2 text-sm leading-6 text-gray-500">Selesaikan pembayaran melalui payment gateway. Status ini masih mock untuk Phase 1.</p>
      {payment?.expiresAt && <p className="mt-3 text-xs font-bold text-gray-500">Batas bayar: {new Date(payment.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>}
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-6 space-y-3">
        <button type="button" className="h-12 w-full rounded-xl bg-[var(--store-primary)] font-black text-white" onClick={onPayNow} disabled={!payment?.paymentUrl}>
          Bayar Sekarang
        </button>
        <button type="button" className="h-12 w-full rounded-xl border border-gray-200 bg-white font-black text-gray-800" onClick={status === 'paid' ? onOpenOrder : onRefresh} disabled={loading}>
          {status === 'paid' ? 'Lihat Status Pesanan' : loading ? 'Mengecek...' : 'Cek Status Pembayaran'}
        </button>
      </div>
    </section>
  )
}
