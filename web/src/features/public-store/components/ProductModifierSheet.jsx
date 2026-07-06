import { useEffect, useMemo, useState } from 'react'
import ModifierGroup from './ModifierGroup'
import QuantityStepper from './QuantityStepper'
import { calculateItemPreviewTotal } from '../utils/calculateDisplayTotal'
import { formatCurrency } from '../utils/formatCurrency'

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
    const nextErrors = {}
    product.modifierGroups.forEach((group) => {
      const selectedCount = selectedOptionIds.filter((id) => group.options.some((option) => option.id === id)).length
      if (group.isRequired && selectedCount < (group.minSelect || 1)) {
        nextErrors[group.id] = `Pilih minimal ${group.minSelect || 1} opsi.`
      }
    })
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
    <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true" aria-label="Detail produk">
      <button type="button" aria-label="Tutup detail produk" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} />
      <div className="absolute bottom-0 left-1/2 max-h-[92vh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-[32px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="text-sm font-black text-gray-900">Detail Menu</h2>
          <button type="button" className="h-11 w-11 rounded-full bg-gray-100 text-lg font-bold" onClick={onClose} aria-label="Tutup">
            x
          </button>
        </div>
        <div className="p-4">
          <div className="flex h-40 items-center justify-center rounded-[28px] bg-gradient-to-br from-green-50 to-amber-50 text-5xl font-black text-[var(--store-primary)]">
            {product.name.slice(0, 1)}
          </div>
          <h3 className="mt-4 text-xl font-black text-gray-900">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">{product.description}</p>
          <p className="mt-3 text-base font-black text-gray-900">{formatCurrency(product.basePriceMinor)}</p>

          <div className="mt-5 space-y-4">
            {product.modifierGroups.map((group) => (
              <ModifierGroup
                key={group.id}
                group={group}
                selectedOptionIds={selectedOptionIds}
                onToggle={toggleOption}
                error={errors[group.id]}
              />
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-black text-gray-900">Catatan item</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--store-primary)] focus:ring-4 focus:ring-green-100"
              placeholder="Contoh: less ice, pisah topping"
            />
          </label>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">Jumlah</span>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-gray-100 bg-white p-4">
          <button type="button" className="h-12 w-full rounded-xl bg-[var(--store-primary)] font-black text-white" onClick={submit}>
            Tambah ke Keranjang - {formatCurrency(previewTotal)}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-500">Total ini hanya preview. Harga final dari backend saat checkout.</p>
        </div>
      </div>
    </div>
  )
}
