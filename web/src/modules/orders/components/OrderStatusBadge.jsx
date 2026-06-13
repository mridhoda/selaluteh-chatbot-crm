import React from 'react';

export default function OrderStatusBadge({ status }) {
  const styles = {
    new: 'bg-amber-50 text-amber-600 border border-amber-200',
    preparing: 'bg-orange-50 text-orange-600 border border-orange-200',
    ready: 'bg-blue-50 text-blue-600 border border-blue-200',
    completed: 'bg-green-50 text-green-600 border border-green-200',
    cancelled: 'bg-red-50 text-red-600 border border-red-200',
  };

  const labels = {
    new: 'New',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const s = status ? status.toLowerCase() : 'new';
  const styleClass = styles[s] || styles.new;
  const label = labels[s] || status;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${styleClass}`}>
      <span className="text-[6px]">●</span> {label}
    </span>
  );
}
