export default function CustomerCheckoutForm({ form }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-gray-900">Data Customer</h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-gray-800">Nama</span>
          <input
            value={form.values.name}
            onChange={(event) => form.setField('name', event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-gray-100 px-4 text-sm outline-none focus:border-[var(--store-primary)] focus:ring-4 focus:ring-green-100"
            placeholder="Nama penerima pickup"
          />
          {form.errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{form.errors.name}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-bold text-gray-800">Nomor WhatsApp</span>
          <input
            value={form.values.phone}
            onChange={(event) => form.setField('phone', event.target.value)}
            inputMode="numeric"
            className="mt-2 h-12 w-full rounded-2xl border border-gray-100 px-4 text-sm outline-none focus:border-[var(--store-primary)] focus:ring-4 focus:ring-green-100"
            placeholder="08xxxxxxxxxx"
          />
          {form.errors.phone && <p className="mt-1 text-xs font-semibold text-red-600">{form.errors.phone}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-bold text-gray-800">Catatan opsional</span>
          <textarea
            value={form.values.note}
            onChange={(event) => form.setField('note', event.target.value)}
            className="mt-2 min-h-24 w-full rounded-2xl border border-gray-100 px-4 py-3 text-sm outline-none focus:border-[var(--store-primary)] focus:ring-4 focus:ring-green-100"
            placeholder="Contoh: saya pickup jam 15.00"
          />
        </label>
      </div>
      {form.submitError && <p className="mt-3 text-sm font-semibold text-red-600">{form.submitError}</p>}
    </section>
  )
}
