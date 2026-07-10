import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react'
import api from '../../../shared/api/httpClient'

const toArray = (response) => response?.data?.data || response?.data || []
const money = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
const dateValue = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - (days === 1 ? 0 : days))
  return date.toISOString().slice(0, 10)
}
const statusLabel = (value) =>
  ({
    paid: 'Paid',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
  })[String(value || '').toLowerCase()] ||
  value ||
  '-'

function Card({ icon: Icon, label, value, detail, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
      <div className='flex items-start justify-between'>
        <span className={`rounded-xl p-2.5 ${colors[color]}`}>
          <Icon size={19} />
        </span>
        <span className='text-[11px] font-semibold text-slate-400'>
          Periode aktif
        </span>
      </div>
      <p className='mt-4 text-xs font-bold text-slate-500'>{label}</p>
      <p className='mt-1 text-2xl font-black tracking-tight text-slate-900'>
        {value}
      </p>
      {detail && (
        <p className='mt-1 text-[11px] font-medium text-slate-400'>{detail}</p>
      )}
    </div>
  )
}

function Empty({ children = 'Belum ada data pada periode ini.' }) {
  return (
    <div className='flex min-h-36 items-center justify-center text-xs font-semibold text-slate-400'>
      {children}
    </div>
  )
}

function ProgressRows({ rows, labelFor, amountFor, maxValue, barClass }) {
  return (
    <div className='mt-5 space-y-4'>
      {rows.map((row) => (
        <div
          key={
            row.outletId || row.productId || row.productName || row.outletName
          }
        >
          <div className='mb-1.5 flex items-center justify-between text-xs'>
            <span className='font-bold text-slate-700'>{labelFor(row)}</span>
            <span className='font-black text-slate-900'>{amountFor(row)}</span>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{
                width: `${Math.max(3, (Number(row.grossSales ?? row.grossRevenue ?? 0) / maxValue) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardOverviewPage() {
  const [period, setPeriod] = useState(30)
  const [summary, setSummary] = useState({
    orderCount: 0,
    paidCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    grossSales: 0,
  })
  const [outletRows, setOutletRows] = useState([])
  const [productRows, setProductRows] = useState([])
  const [channelRows, setChannelRows] = useState([])
  const [outlets, setOutlets] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = {
      startDate: new Date(`${dateValue(period)}T00:00:00`).toISOString(),
      endDate: new Date().toISOString(),
    }
    try {
      const [
        summaryRes,
        outletRes,
        productRes,
        channelRes,
        outletsRes,
        ordersRes,
      ] = await Promise.all([
        api.get('/analytics/summary', { params }),
        api.get('/analytics/outlets', { params }),
        api.get('/analytics/products', { params }),
        api.get('/analytics/channels', { params }),
        api.get('/outlets'),
        api.get('/orders', {
          params: {
            limit: 8,
            startDate: params.startDate,
            endDate: params.endDate,
          },
        }),
      ])
      setSummary(summaryRes.data?.data || {})
      setOutletRows(toArray(outletRes))
      setProductRows(toArray(productRes))
      setChannelRows(toArray(channelRes))
      setOutlets(toArray(outletsRes))
      setOrders(toArray(ordersRes))
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Dashboard gagal memuat data. Silakan coba refresh.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const outletName = useMemo(
    () => new Map(outlets.map((outlet) => [outlet.id, outlet.name])),
    [outlets]
  )
  const maxOutletSales = Math.max(
    ...outletRows.map((row) => Number(row.grossSales || 0)),
    1
  )
  const maxProductSales = Math.max(
    ...productRows.slice(0, 5).map((row) => Number(row.grossRevenue || 0)),
    1
  )
  const paidRate = summary.orderCount
    ? Math.round(
        (Number(summary.paidCount || 0) / Number(summary.orderCount)) * 100
      )
    : 0
  const outletContent = loading ? (
    <Empty>Memuat performa outlet...</Empty>
  ) : outletRows.length ? (
    <ProgressRows
      rows={outletRows.slice(0, 6)}
      labelFor={(row) =>
        outletName.get(row.outletId) ||
        row.outletName ||
        'Outlet tidak diketahui'
      }
      amountFor={(row) => money(row.grossSales)}
      maxValue={maxOutletSales}
      barClass='bg-indigo-500'
    />
  ) : (
    <Empty />
  )
  const productContent = loading ? (
    <Empty>Memuat produk...</Empty>
  ) : productRows.length ? (
    <ProgressRows
      rows={productRows.slice(0, 5)}
      labelFor={(row) => row.productName || 'Produk tidak diketahui'}
      amountFor={(row) =>
        `${row.quantitySold || 0} item · ${money(row.grossRevenue)}`
      }
      maxValue={maxProductSales}
      barClass='bg-amber-400'
    />
  ) : (
    <Empty />
  )
  const orderContent = loading ? (
    <Empty>Memuat pesanan...</Empty>
  ) : orders.length ? (
    <div className='mt-4 divide-y divide-slate-100'>
      {orders.slice(0, 6).map((order) => (
        <div
          key={order.id || order._id || order.orderNumber}
          className='flex items-center justify-between gap-3 py-3'
        >
          <div className='min-w-0'>
            <p className='truncate text-xs font-black text-slate-800'>
              {order.orderNumber || order.order_number || order.id || '-'}
            </p>
            <p className='mt-1 truncate text-[11px] text-slate-400'>
              {order.customer?.name ||
                order.contact?.name ||
                order.customerName ||
                'Customer'}{' '}
              · {order.outlet?.name || order.outletName || '-'}
            </p>
          </div>
          <div className='shrink-0 text-right'>
            <p className='text-xs font-black text-slate-900'>
              {money(order.totalAmount ?? order.total_amount)}
            </p>
            <span className='text-[10px] font-bold text-slate-400'>
              {statusLabel(
                order.paymentStatus || order.payment_status || order.status
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty />
  )

  return (
    <div className='min-h-full space-y-5 bg-slate-50 p-5 text-left'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='rounded-xl bg-indigo-100 p-2 text-indigo-600'>
              <Activity size={20} />
            </span>
            <h1 className='text-xl font-black text-slate-900'>
              Ringkasan Bisnis
            </h1>
          </div>
          <p className='mt-1 text-xs font-medium text-slate-500'>
            Pantau penjualan, outlet, produk, dan pesanan terbaru dari data
            aktual workspace.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none'
          >
            <option value={1}>Hari ini</option>
            <option value={7}>7 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
          </select>
          <button
            type='button'
            onClick={loadDashboard}
            className='rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50'
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700'>
          {error}
        </div>
      )}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <Card
          icon={Wallet}
          label='Pendapatan paid'
          value={money(summary.grossSales)}
          detail={`${summary.paidCount || 0} transaksi berhasil`}
        />
        <Card
          icon={ShoppingBag}
          label='Total pesanan'
          value={Number(summary.orderCount || 0).toLocaleString('id-ID')}
          detail={`${paidRate}% pembayaran berhasil`}
          color='emerald'
        />
        <Card
          icon={Clock3}
          label='Menunggu pembayaran'
          value={Number(summary.pendingCount || 0).toLocaleString('id-ID')}
          detail='Perlu dipantau'
          color='amber'
        />
        <Card
          icon={XCircle}
          label='Dibatalkan'
          value={Number(summary.cancelledCount || 0).toLocaleString('id-ID')}
          detail='Dalam periode aktif'
          color='rose'
        />
      </div>

      <div className='grid gap-5 xl:grid-cols-[1.35fr_1fr]'>
        <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-black text-slate-900'>
                Performa outlet
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Pendapatan paid per outlet
              </p>
            </div>
            <Store size={18} className='text-indigo-500' />
          </div>
          {outletContent}
        </section>
        <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-black text-slate-900'>
                Penjualan per channel
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Distribusi order dan pendapatan
              </p>
            </div>
            <TrendingUp size={18} className='text-emerald-500' />
          </div>
          <p className='mt-5 text-xs text-slate-400'>
            {channelRows.length} channel aktif
          </p>
        </section>
      </div>

      <div className='grid gap-5 xl:grid-cols-[1.1fr_1fr]'>
        <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-black text-slate-900'>
                Produk terlaris
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Berdasarkan kuantitas dan pendapatan paid
              </p>
            </div>
            <Package size={18} className='text-amber-500' />
          </div>
          {productContent}
        </section>
        <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-black text-slate-900'>
                Pesanan terbaru
              </h2>
              <p className='mt-1 text-xs text-slate-400'>
                Aktivitas order pada periode aktif
              </p>
            </div>
            <CheckCircle2 size={18} className='text-indigo-500' />
          </div>
          {orderContent}
        </section>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
          <p className='text-[11px] font-bold text-slate-400'>Outlet aktif</p>
          <p className='mt-1 text-lg font-black text-slate-900'>
            {outlets.length}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
          <p className='text-[11px] font-bold text-slate-400'>Produk terjual</p>
          <p className='mt-1 text-lg font-black text-slate-900'>
            {productRows
              .reduce((total, row) => total + Number(row.quantitySold || 0), 0)
              .toLocaleString('id-ID')}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
          <p className='text-[11px] font-bold text-slate-400'>Channel aktif</p>
          <p className='mt-1 text-lg font-black text-slate-900'>
            {channelRows.length}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white px-4 py-3'>
          <p className='text-[11px] font-bold text-slate-400'>Order berhasil</p>
          <p className='mt-1 text-lg font-black text-emerald-600'>
            {summary.paidCount || 0}
          </p>
        </div>
      </div>
    </div>
  )
}
