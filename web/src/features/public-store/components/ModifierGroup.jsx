import { formatCurrency } from '../utils/formatCurrency'

export default function ModifierGroup({ group, selectedOptionIds, onToggle, error }) {
  return (
    <fieldset className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <legend className="mb-3 flex w-full items-center justify-between text-sm font-black text-gray-900">
        <span>{group.title}</span>
        {group.isRequired && <span className="text-[11px] font-bold text-red-500">Wajib</span>}
      </legend>
      <div className="space-y-2">
        {group.options.map((option) => {
          const checked = selectedOptionIds.includes(option.id)
          return (
            <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
              <input
                type={group.type === 'SINGLE' ? 'radio' : 'checkbox'}
                name={group.id}
                checked={checked}
                disabled={!option.isAvailable}
                onChange={() => onToggle(group, option)}
                className="h-4 w-4 accent-[var(--store-primary)]"
              />
              <span className="flex-1 font-semibold text-gray-800">{option.name}</span>
              <span className="text-xs font-bold text-gray-500">{option.priceDeltaMinor ? `+${formatCurrency(option.priceDeltaMinor)}` : 'Free'}</span>
            </label>
          )
        })}
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </fieldset>
  )
}
