import { formatCurrency } from '../utils/formatCurrency'

export default function ModifierGroup({ group, selectedOptionIds, onToggle, error }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 flex w-full items-center justify-between p-0 text-sm font-black uppercase tracking-wide text-gray-900">
        <span>{group.title}</span>
        {group.isRequired ? (
          <span className="rounded-sm bg-[var(--brand-100)] px-2 py-0.5 text-[10px] font-black text-[var(--brand-700)]">WAJIB</span>
        ) : (
          <span className="text-xs font-bold normal-case tracking-normal text-gray-400">Opsional</span>
        )}
      </legend>
      <div className="space-y-3">
        {group.options.map((option) => {
          const checked = selectedOptionIds.includes(option.id)
          return (
            <label key={option.id} className="group flex cursor-pointer items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-[var(--brand-600)]' : 'border-gray-300'}`}>
                  {checked && <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-600)]" />}
                </span>
                <span className="truncate text-sm font-semibold text-gray-700">{option.name}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-gray-500">
                {option.priceDeltaMinor ? `+ ${formatCurrency(option.priceDeltaMinor)}` : 'Free'}
              </span>
              <input
                type={group.type === 'SINGLE' ? 'radio' : 'checkbox'}
                name={group.id}
                checked={checked}
                disabled={!option.isAvailable}
                onChange={() => onToggle(group, option)}
                className="sr-only"
              />
            </label>
          )
        })}
      </div>
      {error && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[var(--brand-600)]">{error}</p>}
    </fieldset>
  )
}
