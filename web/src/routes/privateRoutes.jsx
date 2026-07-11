import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import api from '../shared/api/httpClient'
const LandingPage = lazy(() => import('../modules/dashboard/pages/LandingPage'))
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'))
const VerifyPage = lazy(() => import('../modules/auth/pages/VerifyPage'))
const ForgotPasswordPage = lazy(() => import('../modules/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../modules/auth/pages/ResetPasswordPage'))
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'))
const StorefrontPage = lazy(() => import('../features/public-store/pages/StorefrontPage'))
const QrStorePage = lazy(() => import('../features/public-store/pages/QrStorePage'))
const CheckoutPage = lazy(() => import('../features/public-store/pages/CheckoutPage'))
const PaymentPendingPage = lazy(() => import('../features/public-store/pages/PaymentPendingPage'))
const OrderStatusPage = lazy(() => import('../features/public-store/pages/OrderStatusPage'))
const CustomerAccountPage = lazy(() => import('../features/public-store/pages/CustomerAccountPage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/verify' element={<VerifyPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
      <Route path='/store/:storefrontSlug' element={<StorefrontPage />} />
      <Route path='/qr/:qrToken' element={<QrStorePage />} />
       <Route path='/store/:storefrontSlug/checkout' element={<CheckoutPage />} />
       <Route path='/store/:storefrontSlug/account' element={<CustomerAccountPage />} />
      <Route path='/store/payment/pending/:paymentId' element={<PaymentPendingPage />} />
      <Route path='/order/:publicOrderToken' element={<OrderStatusPage />} />
      <Route path='/store/order/:publicOrderToken' element={<OrderStatusPage />} />
      <Route path='/app/*' element={<AuthenticatedDashboard />} />
      <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </Suspense>
  )
}

function AuthenticatedDashboard() {
  const [status, setStatus] = useState(() => (
    sessionStorage.getItem('token') || localStorage.getItem('token') ? 'checking' : 'unauthenticated'
  ))

  useEffect(() => {
    if (status !== 'checking') return
    let cancelled = false

    api.get('/profile', { skipAuthRedirect: true })
      .then((response) => {
        if (cancelled) return
        let previous = {}
        try { previous = JSON.parse(sessionStorage.getItem('user') || '{}') } catch { /* ignore stale session data */ }
        sessionStorage.setItem('user', JSON.stringify({ ...previous, ...response.data }))
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        setStatus('unauthenticated')
      })

    return () => { cancelled = true }
  }, [status])

  if (status === 'unauthenticated') return <Navigate to='/login' replace />
  if (status === 'checking') return null
  return <DashboardLayout />
}
