import { useNavigate, useParams } from 'react-router-dom'
import PaymentPendingCard from '../components/PaymentPendingCard'
import { usePaymentStatus } from '../hooks/usePaymentStatus'
import PublicStoreLayout from '../layouts/PublicStoreLayout'

export default function PaymentPendingPage() {
  const { checkoutToken } = useParams()
  const navigate = useNavigate()
  const payment = usePaymentStatus(checkoutToken)

  const openPayment = () => {
    if (payment.payment?.paymentUrl) window.open(payment.payment.paymentUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <PublicStoreLayout theme={{ primaryColor: '#166534', primarySoftColor: '#dcfce7' }}>
      <div className="flex min-h-screen items-center px-4 py-8">
        <PaymentPendingCard
          payment={payment.payment}
          status={payment.status}
          loading={payment.loading}
          error={payment.error}
          onPayNow={openPayment}
          onRefresh={payment.refresh}
          onOpenOrder={() => navigate(`/store/order/${payment.payment?.publicOrderToken || 'mock-public-order'}`)}
        />
      </div>
    </PublicStoreLayout>
  )
}
