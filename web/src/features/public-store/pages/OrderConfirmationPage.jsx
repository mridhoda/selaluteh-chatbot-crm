import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { sanitizePublicOrder } from '../utils/cartIntentModel'
import PublicStoreLayout from '../layouts/PublicStoreLayout'

export default function OrderConfirmationPage() {
  const { publicOrderToken } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [, setNow] = useState(Date.now())
  const creatingPayment = useRef(false)
  const storefrontSlug = searchParams.get('storefrontSlug') || 'store'

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const next = sanitizePublicOrder(await phase5ApiClient.public.getPublicOrder(publicOrderToken))
        if (!active) return
        setOrder(next)
        if (next.confirmationExpired || next.status === 'cancelled') {
          navigate(`/store/${storefrontSlug}?orderConfirmationExpired=1`, { replace: true })
          return
        }
        if (next.fulfillmentStatus === 'accepted' && !creatingPayment.current) {
          creatingPayment.current = true
          const checkout = await phase5ApiClient.public.createPaymentSession(publicOrderToken)
          const payment = checkout.payment || {}
          navigate(`/store/payment/pending/${payment.id}?publicOrderToken=${encodeURIComponent(publicOrderToken)}&storefrontSlug=${encodeURIComponent(storefrontSlug)}&returnTo=${encodeURIComponent(`/store/${storefrontSlug}`)}`, { replace: true })
        }
      } catch {
        if (active) setError('Tidak dapat memeriksa konfirmasi outlet.')
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 2000)
    return () => { active = false; window.clearInterval(timer) }
  }, [navigate, publicOrderToken, storefrontSlug])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const secondsLeft = order?.confirmationExpiresAt ? Math.max(0, Math.ceil((new Date(order.confirmationExpiresAt).getTime() - Date.now()) / 1000)) : 30
  return (
    <PublicStoreLayout>
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="w-full rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">...</div>
          <h1 className="text-xl font-black text-gray-900">Menunggu Konfirmasi Pesanan</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">Outlet sedang memastikan semua menu yang kamu pesan tersedia.</p>
          <p className="mt-5 font-mono text-4xl font-black text-gray-900">00:{String(secondsLeft).padStart(2, '0')}</p>
          <p className="mt-3 text-xs text-gray-400">Setelah diterima, halaman pembayaran akan dibuka otomatis.</p>
          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
        </div>
      </main>
    </PublicStoreLayout>
  )
}
