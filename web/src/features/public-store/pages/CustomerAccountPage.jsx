import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { usePublicStorefront } from '../hooks/usePublicStorefront'
import PublicStoreLayout from '../layouts/PublicStoreLayout'

const sessionKey = (slug) => `public-store-customer-session:${slug}`
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount || 0))
const formatDate = (date) => date ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : ''
const statusLabel = (status) => ({ payment_pending: 'Menunggu pembayaran', order_received: 'Pesanan diterima', preparing: 'Sedang dibuat', ready: 'Siap diambil', completed: 'Selesai', cancelled: 'Dibatalkan' }[status] || status || 'Diproses')

export default function CustomerAccountPage() {
  const { storefrontSlug } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(sessionKey(storefrontSlug)) || 'null') } catch { return null }
  })
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [upgradeNotice, setUpgradeNotice] = useState(false)
  const store = usePublicStorefront(storefrontSlug)
  const productImages = Object.fromEntries(store.products.map((product) => [String(product.id), product.imageUrl]).filter(([, imageUrl]) => imageUrl))

  useEffect(() => {
    if (!session?.token) return
    phase5ApiClient.public.getCustomerOrders(session.token).then((data) => setOrders(data.orders || [])).catch(() => { setSession(null); localStorage.removeItem(sessionKey(storefrontSlug)) })
  }, [session?.token, storefrontSlug])

  const submit = async (event) => {
    event.preventDefault(); setError(''); setUpgradeNotice(false)
    try {
      const payload = { storefrontSlug, email: form.email, password: form.password, ...(mode === 'register' ? { name: form.name, phone: form.phone } : {}) }
      const result = mode === 'register' ? await phase5ApiClient.public.customerRegister(payload) : await phase5ApiClient.public.customerLogin(payload)
      const next = { ...result, customer: result.customer }
      localStorage.setItem(sessionKey(storefrontSlug), JSON.stringify(next))
      localStorage.setItem('public-store-customer', JSON.stringify(result.customer))
      setSession(next)
      setUpgradeNotice(Boolean(result.upgradedFromGuest))
    } catch (err) { setError(err.message) }
  }

  return <PublicStoreLayout><main className="mx-auto min-h-screen max-w-md bg-[#fffdf9] p-4">
    <button className="mb-5 text-sm font-bold text-gray-600" onClick={() => navigate(`/store/${storefrontSlug}`)}>← Kembali ke menu</button>
    {session ? <section className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between"><div><p className="text-xs text-gray-500">Halo,</p><h1 className="text-xl font-black">{session.customer.name}</h1><p className="mt-1 text-[10px] font-mono text-gray-400">Customer ID: {session.customerId || session.customer.id}</p></div><button className="text-xs font-bold text-red-500" onClick={() => { localStorage.removeItem(sessionKey(storefrontSlug)); localStorage.removeItem('public-store-customer'); setSession(null) }}>Keluar</button></div>
      {upgradeNotice && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">Akun member berhasil dibuat dari data guest sebelumnya. Riwayat pesanan lama sudah terhubung.</p>}
      <h2 className="mt-6 text-xs font-black uppercase tracking-wider text-gray-500">Riwayat Pesanan</h2>
       <div className="mt-3 space-y-3">{orders.length ? orders.map((order) => <button key={order.publicOrderToken} onClick={() => navigate(`/order/${order.publicOrderToken}`)} className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"><div className="flex items-start justify-between gap-3"><div><b className="text-sm text-gray-900">{order.orderNumber}</b><span className="mt-1 block text-[11px] text-gray-400">{formatDate(order.createdAt)}</span></div><span className="rounded-full bg-[var(--brand-50)] px-2.5 py-1 text-[10px] font-bold text-[var(--brand-600)]">{statusLabel(order.publicOrderStatus)}</span></div><div className="my-3 border-t border-gray-100" /><div className="space-y-2">{(order.items || []).slice(0, 3).map((item) => <div key={item.id} className="flex items-center gap-2.5"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--brand-50)] text-xs font-black text-[var(--brand-600)]">{item.imageUrl || productImages[String(item.productId)] ? <img src={item.imageUrl || productImages[String(item.productId)]} alt="" className="h-full w-full object-cover" /> : (item.productName || item.name || '?').slice(0, 1)}</div><p className="min-w-0 flex-1 truncate text-sm text-gray-700"><span className="font-bold">{item.quantity}x</span> {item.productName || item.name}</p></div>)}{(order.items || []).length > 3 && <p className="text-xs font-medium text-gray-400">+{order.items.length - 3} produk lainnya</p>}</div><div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3"><span className="text-xs font-bold text-gray-500">Total pesanan</span><span className="text-sm font-black text-gray-900">{formatCurrency(order.totals?.totalMinor)}</span></div></button>) : <p className="text-sm text-gray-500">Belum ada riwayat pesanan.</p>}</div>
    </section> : <section className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100"><h1 className="text-xl font-black">{mode === 'login' ? 'Masuk customer' : 'Daftar customer'}</h1><p className="mt-1 text-sm text-gray-500">Masuk untuk melihat riwayat dan mengisi data checkout otomatis.</p>
      <form className="mt-5 space-y-3" onSubmit={submit}>{mode === 'register' && <><input required placeholder="Nama" className="w-full rounded-xl border p-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/><input required placeholder="Nomor WhatsApp" className="w-full rounded-xl border p-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></>}<input required type="email" placeholder="Email" className="w-full rounded-xl border p-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/><input required minLength="6" type="password" placeholder="Password" className="w-full rounded-xl border p-3" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/>{error && <p className="text-sm text-red-500">{error}</p>}<button className="w-full rounded-xl bg-[var(--brand-500)] p-3 font-black text-white">{mode === 'login' ? 'Masuk' : 'Daftar'}</button></form>
      <button className="mt-4 text-sm font-bold text-[var(--brand-600)]" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button>
    </section>}
  </main></PublicStoreLayout>
}
