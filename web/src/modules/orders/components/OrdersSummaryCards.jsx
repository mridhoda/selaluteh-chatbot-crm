import React from 'react'

export default function OrdersSummaryCards({ orders = [] }) {
  // Compute counts dynamically
  const totalCount = orders.length
  const pendingPaymentCount = orders.filter(
    (o) => o.paymentStatus === 'Unpaid' && o.status !== 'cancelled'
  ).length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length
  const completedCount = orders.filter((o) => o.status === 'completed').length
  const needsAttentionCount = orders.filter((o) => o.status === 'new').length

  const cards = [
    {
      title: 'Total Orders',
      value: totalCount,
      percentage: '18%',
      isPositive: true,
      icon: '🛍️',
      bgColor: 'bg-[#FFF1F2]',
      iconColor: 'text-[#DC3545]',
    },
    {
      title: 'Pending Payment',
      value: pendingPaymentCount,
      percentage: '12%',
      isPositive: true,
      icon: '⏱️',
      bgColor: 'bg-[#FFF7E8]',
      iconColor: 'text-[#EA7200]',
    },
    {
      title: 'Preparing',
      value: preparingCount,
      percentage: '5%',
      isPositive: false,
      icon: '🍲',
      bgColor: 'bg-[#FFF7E8]',
      iconColor: 'text-[#EA7200]',
    },
    {
      title: 'Ready to Process',
      value: readyCount,
      percentage: '8%',
      isPositive: true,
      icon: '🚚',
      bgColor: 'bg-[#F5F3FF]',
      iconColor: 'text-[#6956E8]',
    },
    {
      title: 'Completed',
      value: completedCount,
      percentage: '23%',
      isPositive: true,
      icon: '✅',
      bgColor: 'bg-[#ECFDF5]',
      iconColor: 'text-[#15803D]',
    },
    {
      title: 'Needs Attention',
      value: needsAttentionCount,
      percentage: '40%',
      isPositive: true,
      icon: '⚠️',
      bgColor: 'bg-[#FFF1F2]',
      iconColor: 'text-[#DC3545]',
    },
  ]

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3 shrink-0'>
      {cards.map((card, index) => (
        <div
          key={index}
          className='bg-white px-3 py-4.5 rounded-xl border border-[#E1E6EF] shadow-[0_2px_12px_rgba(17,24,46,0.03)] flex items-center gap-2.5'
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${card.bgColor} ${card.iconColor}`}
          >
            {card.icon}
          </div>
          <div className='flex flex-col min-w-0 flex-1'>
            <p className='m-0 text-[10px] font-bold text-[#667085] leading-tight truncate'>
              {card.title}
            </p>
            <p className='m-0 mt-0.5 text-base font-bold tracking-tight text-[#11182E] leading-none'>
              {card.value}
            </p>
            <div className='mt-1 flex items-center gap-1 whitespace-nowrap text-[9px] leading-none'>
              <span className={`font-bold flex items-center gap-0.5 ${card.isPositive ? 'text-[#16A34A]' : 'text-[#DC3545]'}`}>
                {card.isPositive ? '▲' : '▼'} {card.percentage}
              </span>
              <span className='text-[#98A2B3] font-semibold'>
                vs yesterday
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
