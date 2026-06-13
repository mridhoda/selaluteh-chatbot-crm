import React from 'react';

export default function OrdersSummaryCards({ orders = [] }) {
  // Compute counts dynamically
  const totalCount = orders.length;
  const pendingPaymentCount = orders.filter(o => o.paymentStatus === 'Unpaid' && o.status !== 'cancelled').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const needsAttentionCount = orders.filter(o => o.status === 'new').length;

  const cards = [
    {
      title: 'Total Orders',
      value: totalCount,
      percentage: '18%',
      isPositive: true,
      icon: '🛍️',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Pending Payment',
      value: pendingPaymentCount,
      percentage: '12%',
      isPositive: true,
      icon: '⏱️',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Preparing',
      value: preparingCount,
      percentage: '5%',
      isPositive: false,
      icon: '🍲',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Ready to Process',
      value: readyCount,
      percentage: '8%',
      isPositive: true,
      icon: '🚚',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Completed',
      value: completedCount,
      percentage: '23%',
      isPositive: true,
      icon: '✅',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Needs Attention',
      value: needsAttentionCount,
      percentage: '40%',
      isPositive: true,
      icon: '⚠️',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3 shrink-0">
      {cards.map((card, index) => (
        <div key={index} className="bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${card.bgColor} ${card.iconColor}`}>
            {card.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-slate-500 text-[10px] font-semibold truncate leading-none">{card.title}</div>
            <h3 className="text-base font-bold text-slate-800 leading-tight mt-0.5">{card.value}</h3>
            <div className={`text-[9px] font-bold mt-0.5 flex items-center gap-1 whitespace-nowrap ${card.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{card.isPositive ? '▲' : '▼'} {card.percentage}</span>
              <span className="text-slate-400 font-normal">vs yesterday</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
