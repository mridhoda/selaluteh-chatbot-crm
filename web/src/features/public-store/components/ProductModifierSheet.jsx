import { useEffect, useMemo, useState } from 'react'
import ModifierGroup from './ModifierGroup'
import QuantityStepper from './QuantityStepper'
import { calculateItemPreviewTotal } from '../utils/calculateDisplayTotal'
import { formatCurrency } from '../utils/formatCurrency'
import { validateModifierSelection } from '../utils/publicStoreModel'

export default function ProductModifierSheet({ product, open, onClose, onAdd }) {
  const [selectedOptionIds, setSelectedOptionIds] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})

  const previewTotal = useMemo(
    () => calculateItemPreviewTotal(product, selectedOptionIds, quantity),
    [product, selectedOptionIds, quantity],
  )

  useEffect(() => {
    if (!open) return
    setSelectedOptionIds([])
    setQuantity(1)
    setNote('')
    setErrors({})
  }, [open, product?.id])

  if (!open || !product) return null

  const toggleOption = (group, option) => {
    if (!option.isAvailable) return
    setErrors((current) => ({ ...current, [group.id]: '' }))
    setSelectedOptionIds((current) => {
      if (group.type === 'SINGLE') {
        const groupOptionIds = group.options.map((item) => item.id)
        return [...current.filter((id) => !groupOptionIds.includes(id)), option.id]
      }

      if (current.includes(option.id)) return current.filter((id) => id !== option.id)
      const selectedInGroup = current.filter((id) => group.options.some((item) => item.id === id))
      if (group.maxSelect && selectedInGroup.length >= group.maxSelect) return current
      return [...current, option.id]
    })
  }

  const submit = async () => {
    const nextErrors = validateModifierSelection(product, selectedOptionIds)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const ok = await onAdd({
      productId: product.id,
      quantity,
      selectedModifierOptionIds: selectedOptionIds,
      note,
    })
    if (ok) onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[90vh] max-w-md flex-col rounded-t-3xl bg-white shadow-2xl">
        <button
          type="button"
          className="mx-4 mt-3 mb-2 flex items-center gap-2 rounded-xl border border-[var(--brand-100)] bg-[var(--brand-50)] px-3 py-1.5 text-left transition-colors hover:bg-[var(--brand-100)] active:scale-[0.99] shrink-0"
          onClick={onClose}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--brand-600)] shadow-sm">
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </span>
          <span>
            <span className="block text-xs font-black text-[var(--brand-700)]">Kembali ke daftar menu</span>
          </span>
        </button>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 pb-4">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full rounded-2xl bg-gray-100 object-cover" />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-50)] to-amber-50 text-5xl font-black text-[var(--brand-500)]">
                {product.name.slice(0, 1)}
              </div>
            )}

            <div className="mt-4">
              <h2 className="text-xl font-black text-gray-900">{product.name}</h2>
              <p className="mt-1 text-lg font-black text-[var(--brand-600)]">{formatCurrency(product.basePriceMinor)}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{product.description}</p>
            </div>
          </div>

          <div className="h-2 w-full bg-gray-50" />

          {product.modifierGroups.map((group) => (
            <div key={group.id} className="border-b border-gray-100 p-4 last:border-0">
              <ModifierGroup
                group={group}
                selectedOptionIds={selectedOptionIds}
                onToggle={toggleOption}
                error={errors[group.id]}
              />
            </div>
          ))}

          <div className="h-2 w-full bg-gray-50" />

          <div className="p-4">
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-gray-900">Catatan Opsional</h3>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
              placeholder="Contoh: jangan terlalu manis, es dipisah"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Jumlah</h3>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={submit}
            className="flex w-full items-center justify-between rounded-full bg-[var(--brand-500)] px-6 py-3.5 text-base font-black text-white transition-all hover:bg-[var(--brand-600)] active:scale-[0.98]"
          >
            <span>Tambah ke Keranjang</span>
            <span>{formatCurrency(previewTotal)}</span>
          </button>
          <p className="mt-2 text-center text-[10px] text-gray-400">Harga akan dihitung otomatis saat checkout.</p>
        </div>
      </div>
    </>
  )
}
