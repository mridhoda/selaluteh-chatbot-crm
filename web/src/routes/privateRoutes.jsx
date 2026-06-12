import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from '../modules/dashboard/pages/LandingPage'
import LoginPage from '../modules/auth/pages/LoginPage'
import RegisterPage from '../modules/auth/pages/RegisterPage'
import VerifyPage from '../modules/auth/pages/VerifyPage'
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage'
import DashboardLayout from '../layouts/DashboardLayout'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/verify' element={<VerifyPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
      <Route path='/app/*' element={<DashboardLayout />} />
      <Route path='*' element={<Navigate to='/' />} />
    </Routes>
  )
}
