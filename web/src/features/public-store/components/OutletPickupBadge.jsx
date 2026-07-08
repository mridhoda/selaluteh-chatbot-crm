import { useState } from 'react'

export default function OutletPickupBadge({ outlets = [], selectedOutletId, onSelectOutlet, locked = false, lockLabel = '', requireExplicitSelection = false }) {
  const [open, setOpen] = useState(false)
  const selectedOutlet = outlets.find((outlet) => outlet.id === selectedOutletId) || (requireExplicitSelection ? null : outlets[0])

  const chooseOutlet = (outletId) => {
    if (locked) return
    onSelectOutlet(outletId)
    setOpen(false)
  }

  return (
    <>
      <section className="sticky top-0 z-20 bg-gray-50 px-3 py-2.5">
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-12 min-w-0 flex-1 items-center justify-between rounded-xl border border-[var(--brand-200)] bg-white px-4 text-left transition focus:border-[var(--brand-400)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-100)]"
              onClick={() => !locked && setOpen(true)}
              aria-haspopup="dialog"
              aria-disabled={locked}
            >
              <span className="truncate text-base font-black text-gray-900">{selectedOutlet?.name || 'Pilih Outlet'}</span>
              <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <span className="shrink-0 rounded-full bg-[var(--brand-50)] px-4 py-2 text-sm font-black text-[var(--brand-600)]">{locked ? 'QR Lock' : 'Pickup'}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500">
            {selectedOutlet?.address && (
              <>
                <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.3" />
                </svg>
                <span className="min-w-0 truncate">{selectedOutlet.address}</span>
              </>
            )}
            {selectedOutlet?.distanceLabel && (
              <>
                <span className="h-4 w-px shrink-0 bg-gray-200" aria-hidden="true" />
                <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                </svg>
                <span className="shrink-0 text-gray-600">Outlet</span>
                <span className="shrink-0 font-black text-orange-500">{selectedOutlet.distanceLabel}</span>
              </>
            )}
          </div>
          {locked && lockLabel && <p className="mt-2 text-xs font-bold text-gray-500">{lockLabel}</p>}
        </div>
      </section>

      {open && !locked && (
        <div className="fixed inset-0 z-50 bg-black/20" role="dialog" aria-modal="true" aria-label="Pilih outlet pickup">
          <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="Tutup pilih outlet" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 rounded-t-[28px] bg-white shadow-2xl">
            <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 rounded-sm bg-white" aria-hidden="true" />
            <div className="relative flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-black text-gray-900">Pilih Outlet</h2>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)} aria-label="Tutup">
                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="max-h-[62vh] space-y-3 overflow-y-auto px-5 py-4">
              {outlets.map((outlet) => {
                const active = outlet.id === selectedOutlet?.id
                return (
                  <button
                    key={outlet.id}
                    type="button"
                    className={`w-full rounded-xl border bg-white px-4 py-1 text-left transition ${
                      active ? 'border-[var(--brand-500)] ring-1 ring-[var(--brand-500)]' : 'border-gray-100 hover:border-[var(--brand-200)]'
                    }`}
                    onClick={() => chooseOutlet(outlet.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="min-w-0 truncate text-base font-black leading-5 text-gray-950">{outlet.name}</p>
                        <span className="shrink-0 pt-0.5 text-xs font-black leading-none text-orange-500">{outlet.distanceLabel}</span>
                      </div>
                      <p className="-mt-2 truncate text-xs font-semibold leading-3 text-gray-500">{outlet.address}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl px-1 text-sm font-black text-[var(--brand-600)]">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.3" />
                </svg>
                Lihat di Peta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
