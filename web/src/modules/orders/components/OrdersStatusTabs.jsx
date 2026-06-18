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
    { id: 'all', label: 'All Orders', count: allCount, icon: faLayerGroup, iconColor: 'text-[var(--brand-500)]' },
    { id: 'pending_payment', label: 'Pending Payment', count: pendingPaymentCount, icon: faCreditCard, iconColor: 'text-[var(--pending-500)]' },
    { id: 'preparing', label: 'Preparing', count: preparingCount, icon: faClock, iconColor: 'text-[var(--warning-500)]' },
    { id: 'ready', label: 'Ready to Process', count: readyCount, icon: faList, iconColor: 'text-[var(--ai-500)]' },
    { id: 'completed', label: 'Completed', count: completedCount, icon: faCheckCircle, iconColor: 'text-[var(--success-500)]' },
    { id: 'cancelled', label: 'Cancelled', count: cancelledCount, icon: faTimesCircle, iconColor: 'text-[var(--danger-500)]' }
  ];

  return (
    <div className="mb-3 shrink-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-5 py-2.5 shadow-[var(--orders-card-shadow)]">
      <div className="flex min-w-0 items-center gap-7 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-10 appearance-none items-center gap-2.5 rounded-xl border px-4 text-[11px] font-extrabold uppercase tracking-[0.06em] whitespace-nowrap outline-none transition-all duration-200 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] ${
                isActive
                  ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--text-inverse)] shadow-[0_6px_16px_rgba(244,63,112,0.16)] hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)]'
                  : 'border-transparent bg-transparent text-[var(--text-secondary)] shadow-none hover:bg-[var(--surface-hover)]'
              }`}
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className={`text-xs ${isActive ? 'text-[var(--text-inverse)]' : tab.iconColor}`}
              />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-normal ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--surface-tertiary)] text-[var(--text-muted)]'
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
