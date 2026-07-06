export default function PublicInvoiceActions({ invoice, onBackToMenu }) {
  const shareInvoice = async () => {
    if (navigator.share && invoice?.shareUrl) {
      await navigator.share({ title: 'Invoice SelaluTeh', url: invoice.shareUrl })
      return
    }
    if (invoice?.shareUrl) await navigator.clipboard?.writeText(invoice.shareUrl)
  }

  return (
    <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <a href={invoice?.downloadUrl || '#'} className="flex h-12 items-center justify-center rounded-xl bg-[var(--store-primary)] font-black text-white">
        Download Invoice PDF
      </a>
      <button type="button" className="h-12 w-full rounded-xl border border-gray-200 bg-white font-black text-gray-800" onClick={shareInvoice}>
        Bagikan Invoice
      </button>
      <button type="button" className="h-12 w-full rounded-xl border border-gray-200 bg-white font-black text-gray-800" onClick={onBackToMenu}>
        Kembali ke Menu
      </button>
    </section>
  )
}
