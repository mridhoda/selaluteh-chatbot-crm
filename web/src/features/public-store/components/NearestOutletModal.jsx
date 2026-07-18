export default function NearestOutletModal({ outlet, onConfirm, onDismiss }) {
  if (!outlet) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/35 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="nearest-outlet-title">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="Tutup rekomendasi outlet" onClick={onDismiss} />
      <div className="relative mx-auto mt-[15vh] max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]" aria-hidden="true">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.3" />
          </svg>
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-600)]">Rekomendasi pickup</p>
        <h2 id="nearest-outlet-title" className="mt-2 text-2xl font-black leading-tight text-gray-950">Outlet terdekat adalah</h2>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-lg font-black text-gray-950">{outlet.name}</p>
          {outlet.address && <p className="mt-1 text-sm font-semibold leading-5 text-gray-500">{outlet.address}</p>}
          <p className="mt-3 text-sm font-black text-orange-500">Sekitar {outlet.distanceLabel} dari lokasi Anda</p>
        </div>
        <p className="mt-4 text-sm font-medium leading-5 text-gray-500">Gunakan outlet ini untuk mengambil pesanan Anda?</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="h-12 rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-700 hover:bg-gray-50" onClick={onDismiss}>Pilih nanti</button>
          <button type="button" className="h-12 rounded-xl bg-[var(--brand-600)] px-4 text-sm font-black text-white shadow-lg shadow-[var(--brand-600)]/20 hover:opacity-90" onClick={onConfirm}>Gunakan outlet ini</button>
        </div>
      </div>
    </div>
  )
}
