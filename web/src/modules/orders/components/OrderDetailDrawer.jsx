import React, { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import OrderStatusBadge from './OrderStatusBadge'
import OrderItemsList from './OrderItemsList'
import OrderTimeline from './OrderTimeline'
import OrderQuickActions from './OrderQuickActions'

export default function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
  onCancelClick,
  onOpenChat,
  onResendPayment,
  onHide,
}) {
  useEffect(() => {
    if (!order) return undefined

    const mediaQuery = window.matchMedia('(max-width: 767px)')
    if (!mediaQuery.matches) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [order])

  if (!order) {
    return (
      <aside className='fixed inset-y-0 right-0 z-[80] w-full md:w-[400px] h-[100dvh] bg-[var(--surface-primary)] border-l border-[var(--border-subtle)] overflow-hidden flex flex-col shrink-0 items-center justify-center text-center p-6 text-[var(--text-muted)] shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
        <div className='absolute top-4 right-4'>
          <button
            type='button'
            onClick={onHide || onClose}
            className='order-detail-collapse-button flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] text-sm font-medium text-[var(--text-secondary)] shadow-none transition duration-150 hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
            title='Hide order details'
            aria-label='Hide order details'
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        <div className='flex flex-col items-center gap-2'>
          <div className='w-12 h-12 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-subtle)] mb-2 border border-dashed border-[var(--border-subtle)] text-lg'>
            👤
          </div>
          <div className='text-sm font-semibold text-[var(--text-muted)]'>
            No Order Selected
          </div>
          <div className='text-xs text-[var(--text-muted)] max-w-[240px]'>
            Click on any order in the table to view its full details here.
          </div>
        </div>
      </aside>
    )
  }

  const createdDate = new Date(order.createdAt)

  // Format to: 16 May 2025 • 10:21 AM
  const day = createdDate.getDate()
  const month = createdDate.toLocaleString('en-US', { month: 'short' })
  const year = createdDate.getFullYear()
  const time = createdDate.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const formattedDateTime = `${day} ${month} ${year} • ${time}`

  const handleWhatsAppClick = () => {
    if (order.contactId?.phone) {
      window.open(
        `https://wa.me/${order.contactId.phone.replace(/[^0-9]/g, '')}`,
        '_blank'
      )
    }
  }

  const handleCallClick = () => {
    if (order.contactId?.phone) {
      window.open(`tel:${order.contactId.phone}`, '_self')
    }
  }

  return (
    <aside className='fixed inset-y-0 right-0 z-[80] w-full md:w-[400px] h-[100dvh] bg-[var(--surface-primary)] border-l border-[var(--border-subtle)] overflow-hidden flex flex-col shrink-0 shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
      {/* Header Panel */}
      <header className='shrink-0 sticky top-0 z-10 px-5 pt-4 pb-3 border-b border-[var(--brand-100)] bg-[image:var(--orders-sidebar-header-bg)]'>
        <div className='flex justify-between items-start mb-2'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-bold text-[var(--text-primary)] m-0'>
              Order #{order.orderIdDisplay}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <button
            type='button'
            onClick={onHide || onClose}
            className='order-detail-collapse-button flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] text-sm font-medium text-[var(--text-secondary)] shadow-none transition duration-150 hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
            title='Hide order details'
            aria-label='Hide order details'
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <div className='text-[11px] text-[var(--text-muted)] mb-3'>
          {formattedDateTime}
        </div>

        <div className='flex justify-between items-center text-sm font-medium text-[var(--text-secondary)]'>
          <div className='flex items-center gap-2'>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.outlet || 'Samarinda')}&background=e1e6ef&color=26314d`}
              className='w-6 h-6 rounded-full'
              alt={order.outlet}
            />
            <span>{order.outlet || 'Samarinda'}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-[var(--info-500)]'>💬</span>
            <span className='capitalize'>{order.channel || 'WhatsApp'}</span>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4'>
        {/* Customer Block */}
        <div>
          <div className='text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3'>
            <span>👤</span>
            <span>Customer</span>
          </div>
          <div className='flex justify-between items-center'>
            <div>
              <div className='font-bold text-[var(--text-primary)] text-sm leading-tight'>
                {order.contactId?.name || 'Unknown User'}
              </div>
              <div className='text-xs text-[var(--text-muted)] mt-1 leading-none'>
                {order.contactId?.phone || '-'}
              </div>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={handleWhatsAppClick}
                className='w-8 h-8 border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--success-600)] hover:bg-[var(--surface-secondary)] cursor-pointer transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                💬
              </button>
              <button
                onClick={handleCallClick}
                className='w-8 h-8 border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                📞
              </button>
            </div>
          </div>
        </div>

        <hr
          className='border-[var(--border-default)]'
          style={{ margin: '8px 0' }}
        />

        {/* Order Items List Block */}
        <OrderItemsList
          items={order.itemsList || []}
          subtotal={order.total}
          deliveryFee={0}
          total={order.total}
          paymentStatus={order.paymentStatus}
        />

        <hr
          className='border-[var(--border-default)]'
          style={{ margin: '8px 0' }}
        />

        {/* Payment Block */}
        <div>
          <div className='text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3'>
            <span>💳</span>
            <span>Payment</span>
          </div>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-[var(--text-muted)]'>Payment Method</span>
              <span className='font-medium text-[var(--text-primary)]'>
                {order.paymentMethod || 'Bank Transfer'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-[var(--text-muted)]'>Payment Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-[var(--success-50)] text-[var(--success-600)] border-[var(--success-100)]'
                    : 'bg-[var(--danger-50)] text-[var(--danger-600)] border-[var(--danger-100)]'
                }`}
              >
                {order.paymentStatus || 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {order.notes && (
          <>
            <hr
              className='border-[var(--border-default)]'
              style={{ margin: '8px 0' }}
            />
            {/* Notes Block */}
            <div>
              <div className='text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3'>
                <span>📝</span>
                <span>Order Notes</span>
              </div>
              <div className='text-sm text-[var(--text-secondary)] pl-1'>
                {order.notes}
              </div>
            </div>
          </>
        )}

        <hr
          className='border-[var(--border-default)]'
          style={{ margin: '8px 0' }}
        />

        {/* Timeline Block */}
        <OrderTimeline timeline={order.timeline || []} />
      </div>

      <footer className='shrink-0 sticky bottom-0 bg-[var(--surface-primary)] border-t border-[var(--border-subtle)] px-5 py-4'>
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
  )
}
