export default function StoreErrorState({ title = 'Gagal memuat', description, actionLabel, onAction }) {
  return (
    <section className="mx-4 mt-4 rounded-3xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="text-base font-black text-red-900">{title}</p>
      {description && <p className="mt-2 text-sm leading-6 text-red-700">{description}</p>}
      {actionLabel && (
        <button type="button" className="mt-4 h-11 rounded-xl bg-red-600 px-4 font-bold text-white" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  )
}
