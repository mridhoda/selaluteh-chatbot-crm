import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../../shared/api/httpClient'
import { registerOrderPushNotifications, requestWebPushPermission } from '../../../shared/services/webPush'
import {
  getDemoToken,
  getDemoUser,
  setDemoMode,
} from '../../../mocks/demoState'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import headofficeBg from '../../../assets/headoffice.webp'
import foodinesiaLogo from '../../../assets/foodinesia-logo.png'

export default function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('rememberedEmail')) || true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loginDemo = () => {
    requestWebPushPermission().catch(() => {})
    setDemoMode(true)
    const token = getDemoToken()
    const user = getDemoUser()
    sessionStorage.setItem('token', token)
    localStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    navigate('/app')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Permission requests must happen during the login click's user activation.
      await requestWebPushPermission()
      const normalizedEmail = email.trim().toLowerCase()
      const r = await api.post('/auth/login', { email: normalizedEmail, password })
      sessionStorage.setItem('token', r.data.token)
      localStorage.removeItem('token')
      if (remember) {
        localStorage.setItem('rememberedEmail', normalizedEmail)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      sessionStorage.setItem('user', JSON.stringify(r.data.user))
      await registerOrderPushNotifications().catch(() => {})
      navigate('/app')
    } catch (e) {
      if (!e.response) {
        setError('Tidak bisa tersambung ke server API. Pastikan HP dan laptop satu Wi-Fi, lalu buka lewat IP laptop.')
      } else {
        setError(e.response?.data?.error || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-white text-charcoal flex flex-col lg:flex-row antialiased overflow-x-hidden">
      {/* Left Column: Visual Brand Intro (Awwwards Style) */}
      <div className="relative w-full lg:w-[45%] text-warm-white p-8 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div aria-hidden className="absolute inset-0 bg-charcoal pointer-events-none z-0">
          <img
            src={headofficeBg}
            alt="Foodinesia Head Office"
            className="w-full h-full object-cover opacity-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(36,76,58,0.5),transparent_60%)]" />
        </div>

        {/* Back Link & Brand Logo */}
         <div className="flex items-center justify-between relative z-10">
           <Link
             to="/"
             className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sage/75 hover:text-warm-white transition-colors"
           >
             <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
             Kembali
           </Link>
            <div className="flex items-center gap-2">
              <img src={foodinesiaLogo} alt="Foodinesia One" className="h-16 object-contain" />
            </div>
         </div>

        {/* Mid Intro Section */}
        <div className="my-auto pt-16 pb-12 lg:py-0 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-accent font-semibold mb-6">
            <Sparkles className="h-3 w-3" /> Portal Internal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] max-w-md">
            Hubungkan Seluruh Operasional{" "}
            <span className="italic font-normal text-sage">Foodinesia</span>
          </h1>
          <p className="mt-5 text-sm text-sage/75 leading-relaxed max-w-sm">
            Masuk untuk mengakses Dashboard AI Commerce, CRM, Kitchen View, Multi-Brand Analytics, dan Manajemen Outlet Terpusat.
          </p>
        </div>

        {/* Brand Copyright */}
        <div className="border-t border-white/10 pt-6 text-[11px] text-sage/60 flex flex-wrap gap-4 justify-between items-center relative z-10">
          <span>PT Foodiholic Group Indonesia</span>
          <span>© 2026</span>
        </div>
      </div>

      {/* Right Column: Minimalist Modern Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-warm-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-sm text-muted-ink mt-1.5">
              Silakan masukkan kredensial Anda untuk masuk ke platform.
            </p>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-error/10 border border-error/20 p-4 text-xs font-medium text-error flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-error" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-ink">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@foodinesia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-hairline bg-cream/30 text-sm font-medium text-charcoal placeholder-muted-ink/50 outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-ink">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-forest hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-hairline bg-cream/30 text-sm font-medium text-charcoal placeholder-muted-ink/50 outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-ink hover:text-charcoal transition-colors border-0 outline-none p-0 bg-transparent focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-hairline text-forest focus:ring-forest/30"
                />
                <span className="text-xs font-medium text-muted-ink">Tetap masuk di perangkat ini</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group inline-flex items-center justify-center gap-2 rounded-xl bg-charcoal px-5 py-3 text-sm font-semibold text-warm-white hover:bg-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Masuk...' : 'Masuk ke Platform'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>

            {/* Demo Access Button */}
            <button
              type="button"
              onClick={loginDemo}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-accent/30 bg-cream/70 px-5 py-3 text-sm font-semibold text-amber-accent hover:bg-cream hover:border-amber-accent transition-colors"
            >
              <Sparkles className="h-4 w-4 text-amber-accent" />
              Masuk Demo UI
            </button>
          </form>

          {/* Footer Account switch */}
          <div className="mt-8 text-center text-xs text-muted-ink">
            Belum memiliki akun?{' '}
            <Link to="/register" className="font-semibold text-forest hover:underline">
              Hubungi Administrator
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
