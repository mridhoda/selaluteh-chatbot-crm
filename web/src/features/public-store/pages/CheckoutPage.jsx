import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StoreErrorState from '../components/StoreErrorState'
import StoreSkeleton from '../components/StoreSkeleton'
import { useCheckoutForm } from '../hooks/useCheckoutForm'
import { useGuestCart } from '../hooks/useGuestCart'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'
import { formatCurrency } from '../utils/formatCurrency'

export default function CheckoutPage() {
  const { storefrontSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const store = usePublicStorefront(storefrontSlug)
  const queryOutletId = searchParams.get('outletId') || ''
  const qrSessionToken = searchParams.get('qrSessionToken') || ''
  const includeOutlet = searchParams.get('includeOutlet') !== 'false'
  const selectedOutletId = queryOutletId || (typeof window !== 'undefined' ? window.localStorage.getItem(`public-store-outlet:${storefrontSlug}`) : '')
  const outlets = store.storefront?.outlets || (store.storefront?.outlet ? [store.storefront.outlet] : [])
  const selectedOutlet = outlets.find((outlet) => outlet.id === selectedOutletId) || outlets[0]
  const cart = useGuestCart({ storefront: store.storefront, products: store.products, outlet: selectedOutlet, qrSessionToken, includeOutlet })
  
  const form = useCheckoutForm({
    intentItems: cart.intentItems,
    intentContext: cart.intentContext,
    validatedCart: cart.validatedCart,
    validateCart: cart.validateCart,
    onSuccess: (checkout) => navigate(`/store/payment/pending/${checkout.paymentId || checkout.checkoutToken}`),
  })
  const { setField } = form

  // Auth States
  const [currentUser, setCurrentUser] = useState(null)
  
  const [showAuthSuggestion, setShowAuthSuggestion] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login') // 'login' | 'register'
  
  const [authForm, setAuthForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [authError, setAuthError] = useState('')

  // Prefill checkout form if user is logged in
  useEffect(() => {
    if (currentUser) {
      setField('name', currentUser.name)
      setField('phone', currentUser.phone)
    }
  }, [currentUser, setField])

  const handleNameFocus = () => {
    if (!currentUser) {
      setShowAuthSuggestion(true)
    }
  }

  const handleAuthInputChange = (field, val) => {
    setAuthForm(prev => ({ ...prev, [field]: val }))
    setAuthError('')
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!authForm.email || !authForm.password) {
      setAuthError('Email dan Kata Sandi wajib diisi.')
      return
    }

    // Mock successful login
    const user = {
      name: authForm.name || 'Tamu Selkop',
      phone: authForm.phone || '081234567890',
      email: authForm.email
    }

    setCurrentUser(user)
    setAuthModalOpen(false)
    setAuthError('')
    // Clear password fields
    setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
  }

  const handleRegister = (e) => {
    e.preventDefault()
    if (!authForm.name || !authForm.phone || !authForm.email || !authForm.password) {
      setAuthError('Semua kolom wajib diisi.')
      return
    }
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Konfirmasi Kata Sandi tidak cocok.')
      return
    }

    // Mock successful registration
    const user = {
      name: authForm.name,
      phone: authForm.phone,
      email: authForm.email
    }

    setCurrentUser(user)
    setAuthModalOpen(false)
    setAuthError('')
    // Clear password fields
    setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    form.setField('name', '')
    form.setField('phone', '')
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
        <StoreErrorState title="Store tidak ditemukan" description="Tidak bisa membuka checkout." />
      </PublicStoreLayout>
    )
  }

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
          <h1 className="text-lg font-black text-gray-900 flex-1 text-center truncate pr-8">Checkout</h1>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto pb-32">
        {/* Logged in indicator */}
        {currentUser && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m22 4-10 10.01-3-3" />
              </svg>
              <span>Akun aktif: {currentUser.name}</span>
            </div>
            <button 
              type="button"
              onClick={handleLogout}
              className="text-gray-400 hover:text-rose-600 font-extrabold transition-colors px-2 py-1"
            >
              Keluar
            </button>
          </div>
        )}

        <div className="bg-white mb-2 px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Pickup Outlet</h3>
          {selectedOutlet && (
            <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="shrink-0 h-14 w-14 rounded-xl overflow-hidden bg-[var(--brand-50)] border border-[var(--brand-100)]/40 flex items-center justify-center text-[var(--brand-500)]" aria-hidden="true">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-900 truncate" style={{ lineHeight: 1.2, marginTop: 0 }}>
                  {selectedOutlet.name}
                </h4>
                <p className="-mt-1.5 text-xs leading-none text-gray-500 truncate">
                  {selectedOutlet.address}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white mb-2 p-4 border-b border-gray-100">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Data Customer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nama Lengkap <span className="text-[var(--brand-500)]">*</span>
              </label>
              <input
                type="text"
                value={form.values.name}
                onFocus={handleNameFocus}
                onChange={(e) => form.setField('name', e.target.value)}
                placeholder="Masukkan nama"
                className={`w-full border ${
                  form.errors.name ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--brand-500)] focus:ring-[var(--brand-50)]'
                } rounded-2xl p-3 text-sm font-semibold outline-none focus:ring-4 transition placeholder-gray-400/50 placeholder:text-gray-400/50`}
              />
              {form.errors.name && <p className="text-red-500 text-xs font-bold mt-1.5">{form.errors.name}</p>}

              {/* Auth Suggestion Pop-up */}
              {showAuthSuggestion && !currentUser && (
                <div className="mt-3 p-4 bg-white border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-3xl flex items-center gap-3 relative animate-fade-in z-30">
                  {/* Cart with Star Icon */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <svg width="42" height="32" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 3h3l2 8h10l1.8-6H6.5" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 11h10l-1.2-4H7v4Z" fill="#dc2626" />
                      <circle cx="9" cy="15" r="1.5" fill="#475569" />
                      <circle cx="15" cy="15" r="1.5" fill="#475569" />
                    </svg>
                    <div className="absolute -top-1.5 -right-1 text-yellow-400 animate-bounce text-lg" style={{ animationDuration: '2.5s' }}>⭐</div>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className="m-0 font-extrabold text-gray-900 text-xs">Sudah punya akun?</p>
                    <p className="m-0 mt-0.5 text-[11px] text-gray-500 leading-tight">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('login')
                          setAuthModalOpen(true)
                          setShowAuthSuggestion(false)
                        }}
                        className="text-orange-500 font-extrabold underline hover:text-orange-600 mr-1"
                      >
                        Login
                      </button>
                      untuk mendapatkan promosi dan poin.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowAuthSuggestion(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nomor WhatsApp <span className="text-[var(--brand-500)]">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.values.phone}
                onChange={(e) => form.setField('phone', e.target.value)}
                placeholder="081234567890"
                className={`w-full border ${
                  form.errors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--brand-500)] focus:ring-[var(--brand-50)]'
                } rounded-2xl p-3 text-sm font-semibold outline-none focus:ring-4 transition placeholder-gray-400/50 placeholder:text-gray-400/50`}
              />
              {form.errors.phone && <p className="text-red-500 text-xs font-bold mt-1.5">{form.errors.phone}</p>}
              <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-[var(--brand-500)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m22 4-10 10.01-3-3" />
                </svg>
                Nomor digunakan untuk update pesanan
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Catatan Pesanan (opsional)</label>
              <textarea
                value={form.values.note}
                onChange={(e) => form.setField('note', e.target.value)}
                placeholder="Contoh: Titip di satpam ya, gula dipisah"
                rows={2}
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm font-semibold outline-none focus:border-[var(--brand-500)] focus:ring-[var(--brand-50)] focus:ring-4 resize-none transition placeholder-gray-400/50 placeholder:text-gray-400/50"
              />
            </div>
          </div>
          {form.submitError && <p className="text-red-500 text-xs font-bold mt-3">{form.submitError}</p>}
        </div>

        <div className="bg-white p-4">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <p className="mb-3 rounded-xl bg-orange-50 px-3 py-2 text-[11px] font-bold leading-5 text-orange-700">
            Total di layar ini hanya estimasi. Total final selalu memakai hasil validasi backend sebelum checkout.
          </p>
          <div className="space-y-3 mb-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-700 leading-tight">
                  <span className="font-extrabold">{item.quantity}x</span> {item.productName}
                  {item.modifierSummary?.length > 0 && (
                    <span className="block text-xs text-gray-400 mt-0.5">{item.modifierSummary.join(', ')}</span>
                  )}
                </span>
                <span className="text-gray-900 font-extrabold shrink-0">{formatCurrency(item.lineTotalMinor)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-800">{formatCurrency(cart.totals.subtotalMinor)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Biaya Layanan</span>
              <span className="font-semibold text-gray-800">{formatCurrency(cart.totals.serviceFeeMinor)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2">
              <span>Total estimasi</span>
              <span className="text-[var(--brand-600)]">{formatCurrency(cart.totals.totalMinor)}</span>
            </div>
            {cart.validatedCart?.valid && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                Backend tervalidasi: {formatCurrency(cart.validatedCart.totals.totalMinor || 0)}
              </div>
            )}
            {cart.validationStatus === 'invalid' && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                Keranjang tidak valid. Periksa menu dan modifier yang dipilih.
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={() => form.submit()}
            disabled={form.submitting || !cart.items.length}
            className="w-full bg-[var(--brand-500)] text-white font-bold text-base py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-[var(--brand-600)] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <span>{form.submitting ? 'Membuat Pesanan...' : 'Lanjut Bayar'}</span>
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full mx-1" />
            <span>{formatCurrency(cart.totals.totalMinor)}</span>
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cart.validateCart}
              disabled={cart.validationStatus === 'pending' || !cart.items.length}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] font-black text-gray-600 disabled:text-gray-300"
            >
              {cart.validationStatus === 'pending' ? 'Validasi...' : 'Validasi Backend'}
            </button>
            <button
              type="button"
              onClick={form.newAttempt}
              disabled={form.submitting}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] font-black text-gray-600 disabled:text-gray-300"
            >
              Percobaan Baru
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">Dengan lanjut bayar, pesanan akan dibuat untuk pickup. Redirect pembayaran tidak dianggap lunas.</p>
        </div>
      </div>

      {/* Auth Modal (Login / Register) */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setAuthModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto z-10 transform transition-transform duration-300">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {authModalMode === 'login' ? (
              /* LOGIN VIEW */
              <form onSubmit={handleLogin} className="flex flex-col gap-4 pt-4">
                <h2 className="text-xl font-black text-gray-900 text-center leading-tight">Masuk Akun</h2>
                <p className="-mt-3 text-xs text-gray-500 text-center mb-3 leading-tight">Login untuk melanjutkan pesanan dengan mudah.</p>

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
                      setAuthModalMode('register')
                      setAuthError('')
                    }}
                    className="text-[#ff5500] hover:underline"
                  >
                    Daftar
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER VIEW (Matches image 1 style) */
              <form onSubmit={handleRegister} className="flex flex-col gap-4 pt-4">
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
                      setAuthModalMode('login')
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
        </div>
      )}
    </PublicStoreLayout>
  )
}
