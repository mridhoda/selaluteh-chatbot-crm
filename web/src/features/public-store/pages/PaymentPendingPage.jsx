import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { usePaymentStatus } from '../hooks/usePaymentStatus'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { formatCurrency } from '../utils/formatCurrency'

export default function PaymentPendingPage() {
  const { paymentId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paymentStatus = usePaymentStatus(paymentId, searchParams.get('publicOrderToken') || '')
  const isPaid = String(paymentStatus.status || '').toLowerCase() === 'paid'

  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59)

  useEffect(() => {
    if (isPaid) return undefined
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isPaid])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const openPayment = () => {
    if (paymentStatus.payment?.paymentUrl) {
      window.open(paymentStatus.payment.paymentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleOpenOrder = () => {
    if (paymentStatus.payment?.publicOrderToken) navigate(`/order/${paymentStatus.payment.publicOrderToken}`)
  }

  const orderId = `#PAY-${paymentId?.slice(0, 6).toUpperCase() || 'PENDING'}`
  const totalTagihan = paymentStatus.payment?.totals?.totalMinor ? formatCurrency(paymentStatus.payment.totals.totalMinor) : '-'

  return (
    <PublicStoreLayout theme={{ primaryColor: 'var(--brand-500)', primarySoftColor: 'var(--brand-50)' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 45,
          height: '48px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f3f4f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#111827' }}>
          {isPaid ? 'Pembayaran Terkonfirmasi' : 'Pembayaran'}
        </h1>
      </div>

      {/* Main content */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 'calc(100vh - 48px)',
        }}
      >
        {/* Payment status icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: isPaid ? '#ecfdf5' : '#fff7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            flexShrink: 0,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isPaid ? '#16a34a' : '#f97316'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isPaid ? <path d="m5 12 4 4L19 6" /> : <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
          </svg>
          {!isPaid && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#f97316',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 900, color: '#111827', textAlign: 'center' }}>
          {isPaid ? 'Pembayaran Terkonfirmasi' : 'Menunggu Pembayaran'}
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          {isPaid ? 'Pembayaran kamu sudah berhasil diterima.' : 'Silakan selesaikan pembayaran di halaman pembayaran.'}
        </p>

        {/* Timer */}
        {!isPaid && (
          <div
            style={{
              margin: '20px 0',
              fontSize: '36px',
              fontWeight: 900,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.18em',
              color: '#111827',
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        )}

        {/* Order info card */}
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: '#f9fafb',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          {/* Order ID row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Order ID</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#111827',
                textAlign: 'right',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                maxWidth: '70%',
              }}
            >
              {orderId}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '10px 0' }} />

          {/* Total row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Total Tagihan</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: 'var(--brand-600)',
                flexShrink: 0,
                textAlign: 'right',
              }}
            >
              {totalTagihan}
            </span>
          </div>
        </div>

        {/* Error */}
        {paymentStatus.error && (
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#ef4444', textAlign: 'center' }}>
            {paymentStatus.error}
          </p>
        )}

        <div style={{ marginBottom: 12, borderRadius: 12, background: isPaid ? '#dcfce7' : '#f8fafc', border: `1px solid ${isPaid ? '#86efac' : '#e5e7eb'}`, padding: '10px 12px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: isPaid ? '#15803d' : '#6b7280', fontWeight: 800 }}>Status Pembayaran</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: isPaid ? '#16a34a' : '#111827', fontWeight: 900 }}>{isPaid ? 'Paid' : paymentStatus.status}</p>
        </div>

        {/* Info text */}
        {!isPaid && (
          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 280 }}>
            Silakan selesaikan pembayaran di gateway sebelum waktu habis agar pesanan diproses.
          </p>
        )}

        {/* Buttons */}
        <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          {!isPaid && <button
            type="button"
            onClick={openPayment}
            disabled={!paymentStatus.payment?.paymentUrl}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 999,
              border: 'none',
              backgroundColor: paymentStatus.payment?.paymentUrl ? 'var(--brand-500)' : '#e5e7eb',
              color: paymentStatus.payment?.paymentUrl ? '#fff' : '#9ca3af',
              fontSize: 14,
              fontWeight: 900,
              cursor: paymentStatus.payment?.paymentUrl ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box',
              transition: 'background-color 0.15s',
            }}
          >
            <span>Bayar Sekarang (Simulasi)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>}

          <button
            type="button"
             onClick={isPaid ? handleOpenOrder : paymentStatus.payment?.publicOrderToken ? handleOpenOrder : paymentStatus.refresh}
            disabled={paymentStatus.loading}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 999,
              border: '2px solid var(--brand-500)',
              backgroundColor: '#fff',
              color: 'var(--brand-600)',
              fontSize: 14,
              fontWeight: 900,
              cursor: paymentStatus.loading ? 'not-allowed' : 'pointer',
              opacity: paymentStatus.loading ? 0.6 : 1,
              boxSizing: 'border-box',
              transition: 'background-color 0.15s',
            }}
          >
             {paymentStatus.payment?.publicOrderToken
               ? 'Lihat Status Pesanan'
               : paymentStatus.loading
              ? 'Mengecek...'
              : 'Cek Status Pembayaran'}
          </button>

          {!isPaid && <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingTop: 12,
              fontSize: 12,
              fontWeight: 700,
              color: '#6b7280',
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Butuh bantuan? Hubungi WhatsApp
          </a>}
        </div>
      </div>
    </PublicStoreLayout>
  )
}
