import { CART_QUANTITY } from '../types/cart.types'

export default function QuantityStepper({ value, onChange, min = CART_QUANTITY.MIN, max = CART_QUANTITY.MAX, size = 'default' }) {
  const decrease = () => onChange(Math.max(min, Number(value || min) - 1))
  const increase = () => onChange(Math.min(max, Number(value || min) + 1))
  const compact = size === 'compact'

  return (
    <div className={`inline-flex items-center rounded-full bg-gray-50 p-1 shadow-sm ${compact ? 'min-h-9 p-0.5' : 'min-h-11 p-1'}`}>
      <button
        type="button"
        aria-label="Kurangi jumlah"
        className={`${compact ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-lg'} rounded-full font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none`}
        onClick={decrease}
        disabled={value <= min}
      >
        -
      </button>
      <span className={`${compact ? 'min-w-7 text-xs' : 'min-w-8 text-sm'} text-center font-bold text-gray-900`}>{value}</span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        className={`${compact ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-lg'} rounded-full font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none`}
        onClick={increase}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}
