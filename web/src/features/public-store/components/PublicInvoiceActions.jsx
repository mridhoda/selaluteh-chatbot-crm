export default function PublicInvoiceActions({ invoice, onBackToMenu }) {
  const shareInvoice = async () => {
    if (navigator.share && invoice?.shareUrl) {
      await navigator.share({ title: 'Invoice Selkop', url: invoice.shareUrl })
      return
    }
    if (invoice?.shareUrl) await navigator.clipboard?.writeText(invoice.shareUrl)
  }

  return (
    <div className="space-y-3">
      <a
        href={invoice?.downloadUrl || '#'}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-50)] font-black text-[var(--brand-600)] hover:bg-[var(--brand-100)] transition-colors text-sm shadow-sm"
      >
        <svg aria-hidden="true" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download Invoice (PDF)
      </a>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white font-black text-gray-700 hover:bg-gray-50 transition-colors text-sm"
        onClick={shareInvoice}
      >
        <svg aria-hidden="true" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
        Bagikan Status
      </button>

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white font-black text-gray-700 hover:bg-gray-50 transition-colors text-sm"
        onClick={onBackToMenu}
      >
        Kembali ke Menu
      </button>
    </div>
  )
}