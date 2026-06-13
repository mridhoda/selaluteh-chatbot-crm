import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import OrderStatusBadge from './OrderStatusBadge';
import OrderItemsList from './OrderItemsList';
import OrderTimeline from './OrderTimeline';
import OrderQuickActions from './OrderQuickActions';

export default function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
  onCancelClick,
  onOpenChat,
  onResendPayment,
  onHide
}) {
  useEffect(() => {
    if (!order) return undefined;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    if (!mediaQuery.matches) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [order]);

  if (!order) {
    return (
      <aside className="fixed inset-y-0 right-0 z-[80] w-full md:w-[400px] h-[100dvh] bg-white border-l border-slate-200 overflow-hidden flex flex-col shrink-0 items-center justify-center text-center p-6 text-slate-400 shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2 border border-dashed border-slate-200 text-lg">
            👤
          </div>
          <div className="text-sm font-semibold text-slate-500">No Order Selected</div>
          <div className="text-xs text-slate-400 max-w-[240px]">
            Click on any order in the table to view its full details here.
          </div>
        </div>
      </aside>
    );
  }

  const createdDate = new Date(order.createdAt);
  
  // Format to: 16 May 2025 • 10:21 AM
  const day = createdDate.getDate();
  const month = createdDate.toLocaleString('en-US', { month: 'short' });
  const year = createdDate.getFullYear();
  const time = createdDate.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const formattedDateTime = `${day} ${month} ${year} • ${time}`;

  const handleWhatsAppClick = () => {
    if (order.contactId?.phone) {
      window.open(`https://wa.me/${order.contactId.phone.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  const handleCallClick = () => {
    if (order.contactId?.phone) {
      window.open(`tel:${order.contactId.phone}`, '_self');
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-[80] w-full md:w-[400px] h-[100dvh] bg-white border-l border-slate-200 overflow-hidden flex flex-col shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
      {/* Header Panel */}
      <header className="shrink-0 sticky top-0 z-10 bg-white px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 m-0">Order #{order.orderIdDisplay}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <button
            type="button"
            onClick={onHide || onClose}
            className="order-detail-collapse-button flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-400 transition duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            title="Hide order details"
            aria-label="Hide order details"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <div className="text-[11px] text-slate-500 mb-3">{formattedDateTime}</div>

        <div className="flex justify-between items-center text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.outlet || 'Samarinda')}&background=e2e8f0&color=475569`} 
              className="w-6 h-6 rounded-full" 
              alt={order.outlet}
            />
            <span>{order.outlet || 'Samarinda'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">💬</span>
            <span className="capitalize">{order.channel || 'WhatsApp'}</span>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
        
        {/* Customer Block */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <span>👤</span>
            <span>Customer</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">{order.contactId?.name || 'Unknown User'}</div>
              <div className="text-xs text-slate-500 mt-1 leading-none">{order.contactId?.phone || '-'}</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleWhatsAppClick}
                className="w-8 h-8 border border-slate-200 rounded-full flex items-center justify-center text-green-600 hover:bg-slate-50 cursor-pointer transition duration-150"
              >
                💬
              </button>
              <button 
                onClick={handleCallClick}
                className="w-8 h-8 border border-slate-200 rounded-full flex items-center justify-center text-green-600 hover:bg-slate-50 cursor-pointer transition duration-150"
              >
                📞
              </button>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" style={{ margin: '8px 0' }} />

        {/* Order Items List Block */}
        <OrderItemsList
          items={order.itemsList || []}
          subtotal={order.total}
          deliveryFee={0}
          total={order.total}
        />

        <hr className="border-slate-200" style={{ margin: '8px 0' }} />

        {/* Payment Block */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
            <span>💳</span>
            <span>Payment</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-medium text-slate-800">{order.paymentMethod || 'Bank Transfer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                order.paymentStatus === 'Paid'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {order.paymentStatus || 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {order.notes && (
          <>
            <hr className="border-slate-200" style={{ margin: '8px 0' }} />
            {/* Notes Block */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <span>📝</span>
                <span>Order Notes</span>
              </div>
              <div className="text-sm text-slate-600 pl-1">{order.notes}</div>
            </div>
          </>
        )}

        <hr className="border-slate-200" style={{ margin: '8px 0' }} />

        {/* Timeline Block */}
        <OrderTimeline timeline={order.timeline || []} />

      </div>

      <footer className="shrink-0 sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4">
        {/* Quick Actions Block */}
        <OrderQuickActions
          order={order}
          onStatusChange={onStatusChange}
          onCancelClick={onCancelClick}
          onOpenChat={onOpenChat}
          onResendPayment={onResendPayment}
        />
      </footer>
    </aside>
  );
}
