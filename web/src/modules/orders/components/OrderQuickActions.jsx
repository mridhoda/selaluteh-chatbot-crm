import React from 'react';

export default function OrderQuickActions({
  order,
  onStatusChange,
  onCancelClick,
  onOpenChat,
  onResendPayment
}) {
  if (!order) return null;

  return (
    <div>
      <p className="text-[11px] font-bold text-slate-800 mb-3">Quick Actions</p>
      
      {/* Messaging Row */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={onOpenChat}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 bg-white transition duration-150 cursor-pointer"
        >
          <span>💬</span>
          <span>Open Chat</span>
        </button>
        <button
          onClick={onResendPayment}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 bg-white transition duration-150 cursor-pointer"
        >
          <span>↗️</span>
          <span>Resend Link</span>
        </button>
      </div>

      {/* Status Transitions Row */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onStatusChange('preparing')}
          className="flex-1 bg-orange-50 text-orange-600 py-2 rounded-lg text-xs font-semibold border border-orange-100 hover:bg-orange-100 transition duration-150 cursor-pointer"
        >
          Mark Preparing
        </button>
        <button
          onClick={() => onStatusChange('ready')}
          className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-semibold border border-blue-100 hover:bg-blue-100 transition duration-150 cursor-pointer"
        >
          Mark Ready
        </button>
        <button
          onClick={() => onStatusChange('completed')}
          className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-xs font-semibold border border-green-100 hover:bg-green-100 transition duration-150 cursor-pointer"
        >
          Complete
        </button>
      </div>

      {/* Cancel Action */}
      <button
        onClick={onCancelClick}
        className="w-full bg-white text-red-600 py-2 rounded-lg text-sm font-semibold border border-red-200 hover:bg-red-50 transition duration-150 cursor-pointer"
      >
        Cancel Order
      </button>
    </div>
  );
}
