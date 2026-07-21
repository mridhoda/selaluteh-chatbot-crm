export default function PaymentReturnCallout({ status, secondsLeft, onOpenOrder }) {
  const paid = status === 'success'

  return (
    <section className={`mx-4 mt-4 rounded-3xl border p-5 shadow-sm ${paid ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${paid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`} aria-hidden="true">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {paid ? <path d="m5 12 4 4L19 6" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-gray-950">{paid ? 'Pembayaran berhasil' : 'Pembayaran sedang diverifikasi'}</h2>
          <p className="mt-1 text-sm font-medium leading-5 text-gray-600">
            {paid ? `Detail pesanan akan dibuka dalam ${secondsLeft} detik.` : 'Status pesanan akan diperbarui setelah pembayaran terverifikasi.'}
          </p>
        </div>
      </div>
      <button type="button" className={`mt-4 h-11 w-full rounded-xl text-sm font-black text-white shadow-sm ${paid ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`} onClick={onOpenOrder}>
        Lihat Status Pesanan
      </button>
    </section>
  )
}
