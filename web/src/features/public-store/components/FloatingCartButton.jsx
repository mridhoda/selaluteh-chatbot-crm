import { formatCurrency } from '../utils/formatCurrency'

export default function FloatingCartButton({ count, totalMinor, onClick }) {
  if (!count) return null
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-10">
      <button type="button" className="flex h-12 w-full max-w-[340px] items-center justify-between rounded-2xl bg-[var(--store-primary)] px-5 font-black text-white shadow-xl" onClick={onClick}>
        <span>{count} item</span>
        <span>{formatCurrency(totalMinor)}</span>
      </button>
    </div>
  )
}
