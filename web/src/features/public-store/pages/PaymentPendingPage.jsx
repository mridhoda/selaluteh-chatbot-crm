import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { usePaymentStatus } from '../hooks/usePaymentStatus'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { formatCurrency } from '../utils/formatCurrency'

export default function PaymentPendingPage() {
  const { checkoutToken } = useParams()
  const navigate = useNavigate()
  const paymentStatus = usePaymentStatus(checkoutToken)

  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59) // 15 mins mock

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const openPayment = () => {
    if (paymentStatus.payment?.paymentUrl) {
      window.open(paymentStatus.payment.paymentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleOpenOrder = () => {
    navigate(`/store/order/${paymentStatus.payment?.publicOrderToken || 'mock-public-order'}`)
  }

  return (
    <PublicStoreLayout theme={{ primaryColor: 'var(--brand-500)', primarySoftColor: 'var(--brand-50)' }}>
      {/* Header */}
      <header className="sticky top-0 z-45 bg-white border-b border-gray-100 shadow-sm h-14 shrink-0">
        <div className="flex items-center justify-between px-4 h-full max-w-md mx-auto">
          <div className="w-10" />
          <h1 className="text-lg font-black text-gray-900 flex-1 text-center truncate">Pembayaran</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto flex flex-col items-center justify-center p-6 text-center pb-24">
        {/* Animated Clock Circle */}
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6 relative shadow-sm">
          <svg className="h-10 w-10 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div className="absolute top-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 bg-orange-500 rounded-full animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Menunggu Pembayaran</h2>
        <p className="text-gray-500 text-sm mb-6">Selesaikan pembayaran dalam waktu:</p>

        {/* Countdown Timer */}
        <div className="text-4xl font-black text-gray-900 font-mono tracking-widest mb-8">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Invoice Summary */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 text-left border border-gray-100">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-extrabold text-gray-900">#ST-{checkoutToken?.slice(0, 6).toUpperCase() || 'MOCK'}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-250 border-dashed">
            <span className="text-gray-500">Total Tagihan</span>
            <span className="font-black text-[var(--brand-600)] text-base">
              {formatCurrency(paymentStatus.payment?.totals?.totalMinor || 28000)}
            </span>
          </div>
        </div>

        {paymentStatus.error && (
          <p className="text-red-500 text-xs font-bold mb-4">{paymentStatus.error}</p>
        )}

        <p className="text-xs text-gray-400 mb-8 max-w-[260px] leading-relaxed">
          Silakan selesaikan pembayaran di gateway sebelum waktu habis agar pesanan diproses.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3 mt-auto max-w-sm">
          <button
            type="button"
            onClick={openPayment}
            disabled={!paymentStatus.payment?.paymentUrl}
            className="w-full bg-[var(--brand-500)] text-white font-black text-base py-3.5 rounded-full hover:bg-[var(--brand-600)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Bayar Sekarang (Simulasi)</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={paymentStatus.status === 'paid' ? handleOpenOrder : paymentStatus.refresh}
            disabled={paymentStatus.loading}
            className="w-full bg-white border border-[var(--brand-500)] text-[var(--brand-600)] font-black text-base py-3.5 rounded-full hover:bg-[var(--brand-50)] active:scale-[0.98] transition-all"
          >
            {paymentStatus.status === 'paid'
              ? 'Lihat Status Pesanan'
              : paymentStatus.loading
              ? 'Mengecek...'
              : 'Cek Status Pembayaran'}
          </button>
        </div>

        {/* Help Link */}
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-500 text-sm mt-8 hover:text-emerald-600 transition-colors font-bold"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Butuh bantuan? Hubungi WhatsApp
        </a>
      </main>
    </PublicStoreLayout>
  )
}