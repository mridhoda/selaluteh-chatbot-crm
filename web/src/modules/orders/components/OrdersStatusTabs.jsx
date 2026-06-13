import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faClock,
  faCreditCard,
  faLayerGroup,
  faList,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

export default function OrdersStatusTabs({ activeTab = 'all', setActiveTab, orders = [] }) {
  // Compute counts dynamically
  const allCount = orders.length;
  const pendingPaymentCount = orders.filter(o => o.paymentStatus === 'Unpaid' && o.status !== 'cancelled').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  const tabs = [
    { id: 'all', label: 'All Orders', count: allCount, icon: faLayerGroup },
    { id: 'pending_payment', label: 'Pending Payment', count: pendingPaymentCount, icon: faCreditCard },
    { id: 'preparing', label: 'Preparing', count: preparingCount, icon: faClock },
    { id: 'ready', label: 'Ready to Process', count: readyCount, icon: faList },
    { id: 'completed', label: 'Completed', count: completedCount, icon: faCheckCircle },
    { id: 'cancelled', label: 'Cancelled', count: cancelledCount, icon: faTimesCircle }
  ];

  return (
    <div className="mb-3 shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-7 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-10 appearance-none items-center gap-2.5 rounded-xl border-0 px-4 text-[11px] font-extrabold uppercase tracking-[0.06em] whitespace-nowrap shadow-none outline-none transition-all duration-200 focus:outline-none ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)]'
                  : 'bg-transparent text-slate-800 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className={`text-xs ${isActive ? 'text-white' : 'text-slate-500'}`}
              />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-normal ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
