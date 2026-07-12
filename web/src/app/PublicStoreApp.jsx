import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import '../features/public-store/public-store.css'

const CustomerAccountPage = lazy(() => import('../features/public-store/pages/CustomerAccountPage'))
const CheckoutPage = lazy(() => import('../features/public-store/pages/CheckoutPage'))
const OrderStatusPage = lazy(() => import('../features/public-store/pages/OrderStatusPage'))
const PaymentPendingPage = lazy(() => import('../features/public-store/pages/PaymentPendingPage'))
const QrStorePage = lazy(() => import('../features/public-store/pages/QrStorePage'))
const StorefrontPage = lazy(() => import('../features/public-store/pages/StorefrontPage'))

export default function PublicStoreApp() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/store/:storefrontSlug" element={<StorefrontPage />} />
          <Route path="/qr/:qrToken" element={<QrStorePage />} />
          <Route path="/store/:storefrontSlug/checkout" element={<CheckoutPage />} />
          <Route path="/store/:storefrontSlug/account" element={<CustomerAccountPage />} />
          <Route path="/store/payment/pending/:paymentId" element={<PaymentPendingPage />} />
          <Route path="/order/:publicOrderToken" element={<OrderStatusPage />} />
          <Route path="/store/order/:publicOrderToken" element={<OrderStatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
