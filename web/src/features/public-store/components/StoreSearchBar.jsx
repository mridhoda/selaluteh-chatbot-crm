export default function StoreSearchBar({ value, onChange, inputRef }) {
  return (
    <label className="mx-4 mt-4 block">
      <span className="sr-only">Cari menu</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-gray-100 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-[var(--store-primary)] focus:ring-4 focus:ring-green-100"
        placeholder="Cari menu SelaluTeh"
      />
    </label>
  )
}
