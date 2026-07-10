import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import StoreSkeleton from '../components/StoreSkeleton'
import StoreErrorState from '../components/StoreErrorState'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { formatCurrency } from '../utils/formatCurrency'
import OrderProductThumbnail from '../components/OrderProductThumbnail'

export default function UserProfilePage() {
  const { storefrontSlug } = useParams()
  const navigate = useNavigate()
  const store = usePublicStorefront(storefrontSlug)

  // Auth States
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(`customer-user:${storefrontSlug}`)
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [authForm, setAuthForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  // Orders State
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Save storefront slug for other pages to reference
  useEffect(() => {
    if (storefrontSlug) {
      window.localStorage.setItem('last-storefront-slug', storefrontSlug)
    }
  }, [storefrontSlug])

  // Load orders if logged in
  useEffect(() => {
    if (currentUser && currentUser.phone) {
      setLoadingOrders(true)
      phase5ApiClient.public.getCustomerOrders(currentUser.phone, currentUser.id)
        .then(res => {
          setOrders(res.orders || [])
        })
        .catch(err => {
          console.error('Gagal mengambil history pembelian:', err)
        })
        .finally(() => {
          setLoadingOrders(false)
        })
    }
  }, [currentUser])

  const handleAuthInputChange = (field, val) => {
    setAuthForm(prev => ({ ...prev, [field]: val }))
    setAuthError('')
    setAuthSuccess('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!authForm.email || !authForm.password) {
      setAuthError('Email dan Kata Sandi wajib diisi.')
      return
    }

    try {
      const response = await phase5ApiClient.public.loginCustomer({
        storefrontSlug,
        email: authForm.email,
        password: authForm.password,
      })
      const loggedInUser = response.customer
      setCurrentUser(loggedInUser)
      window.localStorage.setItem(`customer-user:${storefrontSlug}`, JSON.stringify(loggedInUser))
      setAuthError('')
      setAuthForm({ name: '', phone: '', email: '', password: '', confirmPassword: '' })
    } catch (error) {
      setAuthError(error.status === 404 ? 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' : 'Email atau kata sandi salah.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!authForm.name || !authForm.phone || !authForm.email || !authForm.password) {
      setAuthError('Semua kolom wajib diisi.')
      return
    }
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Konfirmasi Kata Sandi tidak cocok.')
      return
    }

    try {
      const response = await phase5ApiClient.public.registerCustomer({
        storefrontSlug,
        name: authForm.name,
        phone: authForm.phone,
        email: authForm.email,
        password: authForm.password,
      })
      const loggedInUser = response.customer
      setCurrentUser(loggedInUser)
      window.localStorage.setItem(`customer-user:${storefrontSlug}`, JSON.stringify(loggedInUser))
      setAuthError('')
      setAuthForm({ name: '', phone: '', email: '', password: '', confirmPassword: '' })
    } catch {
      setAuthError('Pendaftaran akun customer gagal. Coba lagi.')
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    window.localStorage.removeItem(`customer-user:${storefrontSlug}`)
    setOrders([])
  }

  if (store.loading) {
    return (
      <PublicStoreLayout>
        <StoreSkeleton />
      </PublicStoreLayout>
    )
  }

  if (!store.storefront) {
    return (
      <PublicStoreLayout>
        <StoreErrorState title="Store tidak ditemukan" description="Tidak bisa membuka profile." />
      </PublicStoreLayout>
    )
  }

  const productImages = Object.fromEntries((store.products || []).map((product) => [String(product.id), product.imageUrl]).filter(([, imageUrl]) => imageUrl))

  return (
    <PublicStoreLayout theme={store.storefront.theme}>
      <header className="sticky top-0 z-45 bg-white border-b border-gray-100 shadow-sm h-14 shrink-0">
        <div className="flex items-center justify-between px-4 h-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => navigate(`/store/${store.storefront.slug}`)}
            className="p-2 -ml-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors active:scale-95"
            aria-label="Kembali"
          >
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-black text-gray-900 flex-1 text-center truncate pr-8">Akun Saya</h1>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto pb-24 px-4 mt-4">
        {currentUser ? (
          /* USER PROFILE SECTION */
          <div className="space-y-4">
            {/* Info Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] flex items-center justify-center font-black text-lg shrink-0">
                    {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-gray-900 leading-tight truncate">{currentUser.name}</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-rose-500 hover:bg-rose-50 active:bg-rose-100 rounded-full transition-colors active:scale-95 shrink-0"
                  title="Keluar dari Akun"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                </button>
              </div>
              
              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <span className="shrink-0 text-gray-400 font-semibold">Nama Lengkap</span>
                  <span className="min-w-0 break-words text-right text-gray-800 font-bold">{currentUser.name}</span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <span className="shrink-0 text-gray-400 font-semibold">Nomor WhatsApp</span>
                  <span className="min-w-0 break-words text-right text-gray-800 font-bold">{currentUser.phone}</span>
                </div>
              </div>
            </div>

            {/* History Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 mb-4">Riwayat Pembelian</h3>
              {loadingOrders ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">Memuat riwayat pembelian...</div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">Belum ada transaksi.</div>
              ) : (
                <div className="space-y-3.5">
                  {orders.map((order, idx) => (
                    <div key={idx} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex min-w-0 justify-between items-center gap-3">
                        <p className="break-words text-xs font-black text-gray-900">Order #{order.orderNumberPublic}</p>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="mt-2 space-y-1">
                        {(order.items || []).map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2">
                            <OrderProductThumbnail
                              imageUrl={item.imageUrl || productImages[String(item.productId)]}
                              name={item.productName}
                              className="h-10 w-10"
                            />
                            <p className="min-w-0 break-words text-xs text-gray-600 leading-tight">
                              <span className="font-bold text-gray-900">{item.quantity}x</span> {item.productName}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex min-w-0 justify-between items-center gap-3 text-xs">
                        <span className="text-gray-400 font-semibold">Total</span>
                        <span className="font-extrabold text-[var(--brand-600)]">{formatCurrency(order.totals?.totalMinor || 0)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/order/${order.publicOrderToken}`)}
                        className="mt-2 text-[10px] text-[var(--brand-50)] font-black hover:underline"
                        style={{ color: 'var(--brand-500)' }}
                      >
                        Lihat Detail Pesanan &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AUTH SECTION (Original Mock UI Style) */
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <h2 className="text-xl font-black text-gray-900 text-center leading-tight">Masuk Akun</h2>
                <p className="-mt-3 text-xs text-gray-500 text-center mb-3 leading-tight">Masuk untuk melihat profil dan riwayat pembelian Anda.</p>

                {authError && <p className="text-xs font-bold text-red-500 text-center">{authError}</p>}

                <div className="space-y-3.5">
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => handleAuthInputChange('email', e.target.value)}
                    placeholder="Email"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => handleAuthInputChange('password', e.target.value)}
                    placeholder="Kata Sandi"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ff5500] hover:bg-[#e64d00] active:scale-[0.98] text-white font-black text-sm py-4 rounded-full transition shadow-lg shadow-orange-500/20 mt-4 uppercase tracking-wider"
                >
                  Masuk
                </button>

                <div className="text-center mt-2 text-xs font-bold text-gray-500">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register')
                      setAuthError('')
                    }}
                    className="text-[#ff5500] hover:underline"
                  >
                    Daftar
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <h2 className="text-xl font-black text-gray-900 text-center leading-tight">Daftar Akun Baru</h2>
                <p className="-mt-3 text-xs text-gray-500 text-center mb-3 leading-tight">Lengkapi formulir untuk pendaftaran instan.</p>

                {authError && <p className="text-xs font-bold text-red-500 text-center">{authError}</p>}

                <div className="space-y-3.5">
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={(e) => handleAuthInputChange('name', e.target.value)}
                    placeholder="Nama"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="tel"
                    required
                    value={authForm.phone}
                    onChange={(e) => handleAuthInputChange('phone', e.target.value)}
                    placeholder="No. Telepon"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => handleAuthInputChange('email', e.target.value)}
                    placeholder="Email"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => handleAuthInputChange('password', e.target.value)}
                    placeholder="Kata Sandi"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="password"
                    required
                    value={authForm.confirmPassword}
                    onChange={(e) => handleAuthInputChange('confirmPassword', e.target.value)}
                    placeholder="Konfirmasi Kata Sandi"
                    className="w-full bg-[#f1f3f5] text-gray-800 placeholder-gray-400/50 placeholder:text-gray-400/50 rounded-full px-5 py-3.5 text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ff5500] hover:bg-[#e64d00] active:scale-[0.98] text-white font-black text-sm py-4 rounded-full transition shadow-lg shadow-orange-500/20 mt-4 uppercase tracking-wider"
                >
                  Daftar
                </button>

                <div className="text-center mt-2 text-xs font-bold text-gray-500">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login')
                      setAuthError('')
                    }}
                    className="text-[#ff5500] hover:underline"
                  >
                    Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </PublicStoreLayout>
  )
}
