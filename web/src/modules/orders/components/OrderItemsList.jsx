import React from 'react'

export default function OrderItemsList({
  items = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  paymentStatus = 'Unpaid',
}) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    })
      .format(number)
      .replace(/(,00)/g, '')
  }

  const getItemEmojiAndBg = (name = '') => {
    const lower = name.toLowerCase()
    if (lower.includes('caramel') || lower.includes('sally')) {
      return {
        emoji: '🧋',
        bg: 'bg-[var(--brand-50)] border-[var(--brand-100)] text-[var(--brand-500)]',
      }
    }
    if (
      lower.includes('kopi') ||
      lower.includes('aren') ||
      lower.includes('coffee')
    ) {
      return {
        emoji: '🥤',
        bg: 'bg-[var(--pending-50)] border-[var(--pending-100)] text-[var(--pending-500)]',
      }
    }
    if (
      lower.includes('teh') ||
      lower.includes('tea') ||
      lower.includes('lemon')
    ) {
      return {
        emoji: '🥤',
        bg: 'bg-[var(--warning-50)] border-[var(--warning-100)] text-[var(--warning-500)]',
      }
    }
    return {
      emoji: '🥤',
      bg: 'bg-[var(--brand-50)] border-[var(--brand-100)] text-[var(--brand-500)]',
    }
  }

  return (
    <div>
      <div className='text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3'>
        <span>📋</span>
        <span>
          Order Items ({items.reduce((acc, item) => acc + (item.qty || 1), 0)})
        </span>
      </div>

      <div className='space-y-3 mb-3'>
        {items.map((item, index) => {
          const { emoji, bg } = getItemEmojiAndBg(item.name)
          return (
            <div key={index} className='flex justify-between items-start'>
              <div className='flex gap-3'>
                <div className={`w-10 h-10 rounded overflow-hidden flex items-center justify-center text-lg border shrink-0 ${bg}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className='h-full w-full object-cover' />
                  ) : emoji}
                </div>
                <div>
                  <div className='font-bold text-[var(--text-primary)] text-sm leading-tight'>
                    {item.qty || 1}x {item.name}
                  </div>
                  <div className='text-[11px] text-[var(--text-muted)] mt-1 leading-none'>
                    {item.variant || 'Standard'}
                  </div>
                </div>
              </div>
              <div className='font-bold text-[var(--text-primary)] text-sm shrink-0'>
                {formatRupiah(item.price * (item.qty || 1))}
              </div>
            </div>
          )
        })}
      </div>

      <div className='space-y-1.5 text-sm pt-2 border-t border-[var(--border-subtle)]'>
        <div className='flex justify-between text-[var(--text-muted)]'>
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className='flex justify-between text-[var(--text-muted)]'>
          <span>Delivery Fee</span>
          <span>{formatRupiah(deliveryFee)}</span>
        </div>
        <div className='flex justify-between font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border-subtle)]'>
          <span>Total Amount</span>
          <span
            className={`font-extrabold ${paymentStatus === 'Paid' ? 'text-[var(--success-600)]' : 'text-[var(--text-primary)]'}`}
          >
            {formatRupiah(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
