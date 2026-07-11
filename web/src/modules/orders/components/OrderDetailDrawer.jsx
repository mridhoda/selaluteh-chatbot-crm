import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import OrderStatusBadge from './OrderStatusBadge'
import OrderItemsList from './OrderItemsList'
import OrderTimeline from './OrderTimeline'
import OrderQuickActions from './OrderQuickActions'
import OrderLifecycleActions from './OrderLifecycleActions'
import {
  getReceiptEligibility,
  isAndroidUserAgent,
  openReceiptPrintWindow,
  printWithBestAvailableTransport,
} from '../../printing/thermalPrint'

// ─── Channel icon resolver ────────────────────────────────────────────────────
function ChannelIcon({ channel }) {
  const ch = (channel || '').toLowerCase()
  if (ch === 'whatsapp' || ch === 'wa') {
    return (
      <svg
        viewBox='0 0 24 24'
        className='w-4 h-4 fill-[#25D366] shrink-0'
        aria-label='WhatsApp'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
      </svg>
    )
  }
  if (ch === 'telegram') {
    return (
      <svg
        viewBox='0 0 24 24'
        className='w-4 h-4 fill-[#2CA5E0] shrink-0'
        aria-label='Telegram'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' />
      </svg>
    )
  }
  if (ch === 'instagram') {
    return <span className='text-[#E1306C] text-sm shrink-0'>📷</span>
  }
  if (['qr_store', 'qr', 'location_qr', 'location-qr', 'table_qr', 'table-qr', 'website', 'web', 'online', 'online_store', 'public_store', 'storefront'].includes(ch)) {
    return (
      <svg
        viewBox='0 0 16 16'
        className='w-4 h-4 fill-[#635bff] shrink-0'
        aria-label='Online Store / QR Store'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d='M1 1h6v6H1V1Zm2 2v2h2V3H3Zm6-2h6v6H9V1Zm2 2v2h2V3h-2ZM1 9h6v6H1V9Zm2 2v2h2v-2H3Zm7-2h2v2h-2V9Zm3 0h2v2h-2V9Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Zm-1-2h2v2h-2v-2Z' />
      </svg>
    )
  }
  // generic fallback
  return <span className='text-[var(--info-500)] text-sm shrink-0'>💬</span>
}

// ─── Payment method label resolver ───────────────────────────────────────────
function formatPaymentMethod(raw) {
  if (!raw) return 'Xendit'
  const map = {
    LINK_PAYMENT: 'Xendit Link',
    link_payment: 'Xendit Link',
    BANK_TRANSFER: 'Bank Transfer',
    bank_transfer: 'Bank Transfer',
    'Bank Transfer': 'Bank Transfer',
    EWALLET: 'E-Wallet',
    ewallet: 'E-Wallet',
    OVO: 'OVO',
    GOPAY: 'GoPay',
    SHOPEEPAY: 'ShopeePay',
    DANA: 'DANA',
    QRIS: 'QRIS',
    CREDIT_CARD: 'Kartu Kredit',
    DEBIT_CARD: 'Kartu Debit',
    RETAIL_OUTLET: 'Minimarket',
    VA: 'Virtual Account',
    VIRTUAL_ACCOUNT: 'Virtual Account',
    COD: 'Cash on Delivery',
    CASH: 'Cash',
    manual: 'Manual',
    MANUAL: 'Manual',
    xendit: 'Xendit',
  }
  return map[raw] || raw
}

export default function OrderDetailDrawer({
  order,
  onClose,
  inFlightAction,
  onSubmitAction,
  onCancelClick,
  onOpenChat,
  onResendPayment,
  onHide,
}) {
  const [printing, setPrinting] = useState(false)

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
      <aside className='fixed inset-y-0 right-0 z-[80] w-full lg:w-[400px] h-[100dvh] bg-[var(--surface-primary)] border-l border-[var(--border-subtle)] overflow-hidden flex flex-col shrink-0 items-center justify-center text-center p-6 text-[var(--text-muted)] shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
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

  const customerPhone = order.contactId?.phone || order.customerPhoneSnapshot || null
  // Fallback identifier shown when phone is not available
  const customerUserId =
    (order.contactId && typeof order.contactId === 'object' ? order.contactId.id : null) ||
    (typeof order.contactId === 'string' ? order.contactId : null) ||
    order.contactId?._id ||
    null
  // Resolve the ordering platform/channel
  const resolvedChannel =
    (order.channel || '').toLowerCase() ||
    (order.channelSnapshot || '').toLowerCase() ||
    (order.source || '').toLowerCase() ||
    'whatsapp'
  const qrMetaParts = order.qrLabel
    ? String(order.qrLabel).split('·').map((part) => part.trim()).filter(Boolean)
    : []
  const headerMetaParts = [formattedDateTime, ...qrMetaParts]
  const receiptEligibility = getReceiptEligibility(order, 'CUSTOMER_RECEIPT')
  const isAndroidPrint = isAndroidUserAgent()

  const handlePreviewReceipt = () => {
    openReceiptPrintWindow(order, {
      documentType: 'CUSTOMER_RECEIPT',
      autoPrint: false,
    })
  }

  const handlePrintReceipt = async () => {
    if (!receiptEligibility.eligible) {
      alert(receiptEligibility.safeMessage)
      return
    }
    if (printing) return

    setPrinting(true)
    try {
      const printOptions = { documentType: 'CUSTOMER_RECEIPT' }
      const result = await printWithBestAvailableTransport(order, printOptions)

      if (result.errorCode) {
        alert(result.safeMessage || 'Print tidak bisa dibuka. Gunakan Preview/izinkan popup untuk mencetak.')
      } else if (result.transport === 'CLEANTER') {
        alert('Print job dikirim ke Cleanter. Konfirmasi manual diperlukan untuk menandai struk benar-benar tercetak.')
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <aside className='fixed inset-y-0 right-0 z-[80] w-full lg:w-[400px] h-[100dvh] bg-[var(--surface-primary)] border-l border-[var(--border-subtle)] overflow-hidden flex flex-col shrink-0 shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
      {/* Header Panel */}
      <header className='shrink-0 sticky top-0 z-10 px-5 pt-4 pb-3 border-b border-[var(--brand-100)] bg-[image:var(--orders-sidebar-header-bg)]'>
        <div className='flex justify-between items-start mb-2'>
          <div className='flex items-center gap-2'>
            <h2 className={`font-bold text-[var(--text-primary)] m-0 ${order.orderIdDisplay && order.orderIdDisplay.length > 15 ? 'text-sm break-all font-mono' : 'text-lg'}`}>
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
        <div className='text-[11px] text-[var(--text-muted)] mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1'>
          {headerMetaParts.map((part, index) => (
            <React.Fragment key={`${part}-${index}`}>
              {index > 0 && <span className='text-[var(--text-subtle)]'>•</span>}
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Outlet & channel */}
        <div className='flex justify-between items-center text-sm font-medium text-[var(--text-secondary)]'>
          <div className='flex items-center gap-2'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-xs'>🏪</span>
            <span>{order.outlet || 'Outlet'}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <ChannelIcon channel={resolvedChannel} />
            <span className='capitalize'>{resolvedChannel || 'WhatsApp'}</span>
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
          <div className='flex justify-between items-center gap-3'>
            <div className='min-w-0'>
              <div className='font-bold text-[var(--text-primary)] text-sm leading-tight truncate'>
                {order.contactId?.name || order.customerNameSnapshot || 'Unknown User'}
              </div>
              <div className='text-xs text-[var(--text-muted)] mt-1 leading-none'>
                {customerPhone ? <a href={`tel:${customerPhone}`} className='hover:text-[var(--brand-600)] hover:underline'>{customerPhone}</a> : <span className='italic'>No contact info</span>}
              </div>
            </div>
            <div className='flex gap-2 shrink-0'>
              {/* WhatsApp button — uses proper WA SVG icon */}
              <button
                onClick={handleWhatsAppClick}
                disabled={!customerPhone}
                className='w-8 h-8 border border-[var(--border-subtle)] rounded-full flex items-center justify-center hover:bg-[var(--surface-secondary)] cursor-pointer transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] disabled:opacity-40 disabled:cursor-not-allowed'
                title={customerPhone ? `Chat via WhatsApp — ${customerPhone}` : 'No phone number'}
                aria-label='Open WhatsApp chat'
              >
                <svg
                  viewBox='0 0 24 24'
                  className='w-4 h-4 fill-[#25D366]'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
                </svg>
              </button>
              {/* Open Chat in CRM button */}
              <button
                onClick={onOpenChat}
                className='w-8 h-8 border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--brand-600)] hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] cursor-pointer transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
                title='Open chat in CRM'
                aria-label='Open chat in CRM'
              >
                <svg
                  viewBox='0 0 24 24'
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                </svg>
              </button>
              {/* Phone call button */}
              <button
                onClick={handleCallClick}
                disabled={!customerPhone}
                className='w-8 h-8 border border-[var(--border-subtle)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] disabled:opacity-40 disabled:cursor-not-allowed'
                title={customerPhone ? `Telepon ${customerPhone}` : 'No phone number'}
                aria-label='Call customer'
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
              <span className='font-medium text-[var(--text-primary)] flex items-center gap-1.5'>
                {/* Show Xendit branding if method is via Xendit */}
                {(order.paymentMethod || '').toLowerCase().includes('xendit') ||
                (order.paymentMethod || '') === 'LINK_PAYMENT' ||
                (order.paymentMethod || '') === 'link_payment' ? (
                  <span className='inline-flex items-center gap-1'>
                    <span className='text-[10px] font-bold text-white bg-[#0050F0] px-1.5 py-0.5 rounded'>
                      xendit
                    </span>
                    {formatPaymentMethod(order.paymentMethod)}
                  </span>
                ) : (
                  formatPaymentMethod(order.paymentMethod)
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-[var(--text-muted)]'>Payment Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  order.paymentStatus === 'Paid' || order.paymentStatus === 'paid'
                    ? 'bg-[var(--success-50)] text-[var(--success-600)] border-[var(--success-100)]'
                    : order.paymentStatus === 'pending'
                      ? 'bg-[var(--warning-50)] text-[var(--warning-600)] border-[var(--warning-200)]'
                      : 'bg-[var(--danger-50)] text-[var(--danger-600)] border-[var(--danger-100)]'
                }`}
              >
                {order.paymentStatus === 'paid' ? 'Paid'
                  : order.paymentStatus === 'pending' ? 'Pending'
                  : order.paymentStatus || 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

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
            <div className={`rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm ${order.notes?.trim() ? 'text-[var(--text-secondary)]' : 'italic text-[var(--text-muted)]'}`}>
              {order.notes?.trim() || 'Tidak ada catatan order.'}
            </div>
          </div>
        </>

        <hr
          className='border-[var(--border-default)]'
          style={{ margin: '8px 0' }}
        />

        {/* Receipt Printing Block */}
        <div>
          <div className='text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3'>
            <span className='font-mono'>PR</span>
            <span>Receipt Printing</span>
          </div>
          <div className='rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 space-y-3'>
            <div className='grid grid-cols-2 gap-2 text-[11px]'>
              <div>
                <div className='text-[var(--text-muted)]'>Document</div>
                <div className='font-bold text-[var(--text-primary)]'>Customer Receipt</div>
              </div>
              <div>
                <div className='text-[var(--text-muted)]'>Transport</div>
                <div className='font-bold text-[var(--text-primary)]'>
                  {isAndroidPrint ? 'Cleanter Android' : 'Browser Print'}
                </div>
              </div>
              <div>
                <div className='text-[var(--text-muted)]'>Paper</div>
                <div className='font-bold text-[var(--text-primary)]'>58 mm</div>
              </div>
              <div>
                <div className='text-[var(--text-muted)]'>Evidence</div>
                <div className='font-bold text-[var(--text-primary)]'>DISPATCHED only</div>
              </div>
            </div>
            <div
              className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold ${
                receiptEligibility.eligible
                  ? 'border-[var(--success-100)] bg-[var(--success-50)] text-[var(--success-600)]'
                  : 'border-[var(--warning-200)] bg-[var(--warning-50)] text-[var(--warning-600)]'
              }`}
            >
              {receiptEligibility.safeMessage}
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={handlePreviewReceipt}
                className='flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] transition-colors duration-150'
              >
                Preview
              </button>
              <button
                type='button'
                onClick={handlePrintReceipt}
                disabled={!receiptEligibility.eligible || printing}
                className='flex-1 rounded-lg border border-[var(--brand-500)] bg-[var(--brand-500)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--brand-600)] disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-150'
              >
                {printing ? 'Dispatching...' : 'Print Receipt'}
              </button>
            </div>
            <div className='text-[10px] leading-relaxed text-[var(--text-muted)]'>
              {isAndroidPrint
                ? 'Android mengirim JSON receipt ke Cleanter. HTTP ACK hanya berarti DISPATCHED, bukan bukti cetak fisik selesai.'
                : 'Browser Print membuka dialog cetak. Sesuai spec, dialog terbuka tidak dianggap bukti cetak fisik selesai.'}
            </div>
          </div>
        </div>

        <hr
          className='border-[var(--border-default)]'
          style={{ margin: '8px 0' }}
        />

        {/* Timeline Block */}
        <OrderTimeline timeline={order.timeline || []} />
      </div>

      <footer className='shrink-0 sticky bottom-0 bg-[var(--surface-primary)] border-t border-[var(--border-subtle)] px-5 py-3 space-y-3'>
        {/* Order Lifecycle Actions */}
        <OrderLifecycleActions
          order={order}
          inFlightAction={inFlightAction}
          onSubmitAction={onSubmitAction}
          onCancelClick={onCancelClick}
        />

        {/* Quick Actions Block */}
        <OrderQuickActions
          order={order}
          onOpenChat={onOpenChat}
          onResendPayment={onResendPayment}
          onPrintReceipt={handlePrintReceipt}
          isPrintDisabled={!receiptEligibility.eligible || printing}
        />
      </footer>
    </aside>
  )
}
