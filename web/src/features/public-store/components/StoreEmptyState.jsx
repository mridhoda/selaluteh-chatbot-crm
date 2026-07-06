export default function StoreEmptyState({ title = 'Belum ada data', description = 'Silakan coba lagi nanti.' }) {
  return (
    <section className="mx-4 mt-4 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <p className="text-base font-black text-gray-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </section>
  )
}
