import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../shared/api/apiError.js'
import { adminOrdersApi } from '../api/adminOrdersApi.js'
import {
  getActionMethod,
  getRenderableAdminActions,
  mapAdminOrderError,
  normalizeAdminOrderDetail,
  normalizeAdminOrderList,
  validateAdminAction,
} from '../models/adminOrderModel.js'

function formatRupiah(value, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const CHANNEL_OPTIONS = [
  { value: '', label: 'All Channels' },
  { value: 'online_store', label: 'Online Store' },
  { value: 'qr_store', label: 'QR Store' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
]

export default function Phase5AdminOrdersPage() {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [outletFilter, setOutletFilter] = useState(searchParams.get('outlet') || '')
  const [inFlightAction, setInFlightAction] = useState('')
  const [cancelAction, setCancelAction] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  async function loadOrders() {
    setLoadingList(true)
    setError('')
    try {
      const payload = await adminOrdersApi.listOrders({
        ...(outletFilter ? { outletId: outletFilter } : {}),
        limit: 50,
      })
      const normalized = normalizeAdminOrderList(payload)
      setOrders(normalized.orders)
      setPagination(normalized.pagination)
      const nextSelectedId = selectedOrderId || normalized.orders[0]?.id || ''
      setSelectedOrderId(nextSelectedId)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load admin orders.'))
      setOrders([])
      setPagination(null)
    } finally {
      setLoadingList(false)
    }
  }

  async function loadOrderDetail(orderId) {
    if (!orderId) {
      setSelectedOrder(null)
      return
    }
    setLoadingDetail(true)
    setActionError('')
    try {
      const payload = await adminOrdersApi.getOrder(orderId)
      setSelectedOrder(normalizeAdminOrderDetail(payload))
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to load order detail.'))
      setSelectedOrder(orders.find((order) => order.id === orderId) || null)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [outletFilter])

  useEffect(() => {
    loadOrderDetail(selectedOrderId)
  }, [selectedOrderId])

  const visibleOrders = useMemo(() => {
    if (!channelFilter) return orders
    return orders.filter((order) => order.channel === channelFilter)
  }, [orders, channelFilter])

  async function submitAction(action, reason = '') {
    const validation = validateAdminAction({ action, reason, inFlightAction })
    if (!validation.ok) {
      setActionError(validation.message)
      return
    }

    const methodName = getActionMethod(action)
    setInFlightAction(action)
    setActionError('')
    try {
      const body = action === 'cancel_order' ? { reason: String(reason).trim() } : undefined
      const payload = await adminOrdersApi[methodName](selectedOrder.id, body)
      const updatedOrder = normalizeAdminOrderDetail(payload)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
        setOrders((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
      }
      await loadOrderDetail(selectedOrder.id)
      setCancelAction(null)
      setCancelReason('')
    } catch (err) {
      setActionError(mapAdminOrderError(err))
    } finally {
      setInFlightAction('')
    }
  }

  const actions = getRenderableAdminActions(selectedOrder)

  return (
    <div className='flex min-h-[calc(100vh-90px)] flex-col gap-4 bg-[var(--app-background)] p-1 text-[var(--text-primary)]'>
      <header className='rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-sm'>
        <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-start'>
          <div>
            <h1 className='m-0 text-2xl font-black tracking-tight'>Admin Orders</h1>
            <p className='mt-1 max-w-3xl text-sm text-[var(--text-muted)]'>
              Phase 5 lifecycle console. Actions are rendered only from backend allowed_actions and use explicit lifecycle endpoints.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <select
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
              className='h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 text-sm font-semibold'
              aria-label='Filter orders by channel'
            >
              {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input
              value={outletFilter}
              onChange={(event) => setOutletFilter(event.target.value)}
              placeholder='Outlet ID filter'
              className='h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 text-sm font-semibold'
              aria-label='Filter orders by outlet ID'
            />
            <button
              type='button'
              onClick={loadOrders}
              disabled={loadingList}
              className='h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 text-sm font-bold text-[var(--text-secondary)] disabled:opacity-60'
            >
              {loadingList ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {error && <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700'>{error}</div>}

      <div className='grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_430px]'>
        <section className='min-h-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] shadow-sm'>
          <div className='flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 text-xs font-bold text-[var(--text-muted)]'>
            <span>{visibleOrders.length} visible orders</span>
            <span>{pagination?.total ? `${pagination.total} total from backend` : 'Backend pagination'}</span>
          </div>
          <div className='overflow-auto'>
            <table className='w-full min-w-[980px] border-collapse text-left text-sm'>
              <thead className='sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500'>
                <tr>
                  <th className='px-4 py-3'>Order</th>
                  <th className='px-4 py-3'>Customer</th>
                  <th className='px-4 py-3'>Channel</th>
                  <th className='px-4 py-3'>Outlet</th>
                  <th className='px-4 py-3'>QR Context</th>
                  <th className='px-4 py-3'>Payment</th>
                  <th className='px-4 py-3'>Fulfillment</th>
                  <th className='px-4 py-3 text-right'>Total</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[var(--border-subtle)]'>
                {visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`cursor-pointer hover:bg-[var(--surface-secondary)] ${selectedOrderId === order.id ? 'bg-[var(--brand-50)]' : ''}`}
                  >
                    <td className='px-4 py-3 font-mono text-xs font-bold'>{order.orderNumber}</td>
                    <td className='px-4 py-3'>
                      <div className='font-bold'>{order.customer.name}</div>
                      <div className='text-xs text-[var(--text-muted)]'>{order.customer.phone || '-'}</div>
                    </td>
                    <td className='px-4 py-3 capitalize'>{order.channel.replaceAll('_', ' ')}</td>
                    <td className='px-4 py-3'>{order.outlet.name}</td>
                    <td className='px-4 py-3 text-xs'>{order.qrContext.locationLabel || order.qrContext.tableId || '-'}</td>
                    <td className='px-4 py-3'><StatusPill value={order.paymentStatus} /></td>
                    <td className='px-4 py-3'><StatusPill value={order.fulfillmentStatus} /></td>
                    <td className='px-4 py-3 text-right font-bold'>{formatRupiah(order.totalAmount, order.currency)}</td>
                  </tr>
                ))}
                {!loadingList && visibleOrders.length === 0 && (
                  <tr><td colSpan={8} className='px-4 py-10 text-center text-sm font-semibold text-[var(--text-muted)]'>No orders returned by backend.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className='min-h-0 overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-sm'>
          {!selectedOrder ? (
            <div className='py-12 text-center text-sm font-semibold text-[var(--text-muted)]'>Select an order to view detail.</div>
          ) : (
            <div className='space-y-5'>
              <div>
                <div className='text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]'>Order Detail</div>
                <h2 className='m-0 mt-1 text-xl font-black'>{selectedOrder.orderNumber}</h2>
                <p className='mt-1 text-xs text-[var(--text-muted)]'>Updated {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}</p>
              </div>

              {loadingDetail && <div className='rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs font-semibold'>Refreshing detail...</div>}
              {actionError && <div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700'>{actionError}</div>}

              <DetailGrid order={selectedOrder} />

              <section>
                <h3 className='text-sm font-black'>Items</h3>
                <div className='mt-2 space-y-2'>
                  {selectedOrder.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className='rounded-xl border border-[var(--border-subtle)] p-3 text-sm'>
                      <div className='font-bold'>{item.name || item.productNameSnapshot || 'Item'}</div>
                      <div className='text-xs text-[var(--text-muted)]'>Qty {item.quantity || 1} · {formatRupiah(item.line_total || item.lineTotal || item.subtotal || 0, selectedOrder.currency)}</div>
                    </div>
                  ))}
                  {selectedOrder.items.length === 0 && <div className='text-xs font-semibold text-[var(--text-muted)]'>No item snapshot returned.</div>}
                </div>
              </section>

              <section>
                <h3 className='text-sm font-black'>Allowed Actions</h3>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {actions.map((item) => (
                    <button
                      key={item.action}
                      type='button'
                      onClick={() => item.destructive ? setCancelAction(item.action) : submitAction(item.action)}
                      disabled={Boolean(inFlightAction)}
                      className={`rounded-xl px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${item.destructive ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]'}`}
                    >
                      {inFlightAction === item.action ? 'Submitting...' : item.label}
                    </button>
                  ))}
                  {actions.length === 0 && <div className='rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs font-bold text-[var(--text-muted)]'>No backend allowed_actions available.</div>}
                </div>
              </section>

              <section>
                <h3 className='text-sm font-black'>Status History</h3>
                <div className='mt-2 space-y-2 text-xs'>
                  {selectedOrder.statusHistory.map((event, index) => (
                    <div key={index} className='rounded-lg bg-[var(--surface-secondary)] px-3 py-2'>
                      <div className='font-bold'>{event.label || event.status || 'Status update'}</div>
                      <div className='text-[var(--text-muted)]'>{formatDate(event.at || event.created_at || event.createdAt)}</div>
                    </div>
                  ))}
                  {selectedOrder.statusHistory.length === 0 && <div className='text-xs font-semibold text-[var(--text-muted)]'>No status history returned.</div>}
                </div>
              </section>
            </div>
          )}
        </aside>
      </div>

      {cancelAction && (
        <div className='fixed inset-0 z-[9999] grid place-items-center bg-black/60 p-4'>
          <div className='w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-xl'>
            <h3 className='m-0 text-lg font-black'>Cancel Order</h3>
            <p className='mt-1 text-sm text-[var(--text-muted)]'>A reason is required and will be sent to the explicit cancel endpoint.</p>
            <label className='mt-4 block text-xs font-bold text-[var(--text-secondary)]'>Cancel reason</label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={4}
              className='mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-sm'
              placeholder='Example: customer requested cancellation'
            />
            <div className='mt-4 flex justify-end gap-2'>
              <button type='button' onClick={() => setCancelAction(null)} disabled={Boolean(inFlightAction)} className='rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-bold'>Back</button>
              <button type='button' onClick={() => submitAction(cancelAction, cancelReason)} disabled={Boolean(inFlightAction)} className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:opacity-60'>
                {inFlightAction ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ value }) {
  return <span className='inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-2.5 py-1 text-xs font-black capitalize'>{String(value || '-').replaceAll('_', ' ')}</span>
}

function DetailGrid({ order }) {
  const rows = [
    ['Channel', order.channel.replaceAll('_', ' ')],
    ['Payment', order.paymentStatus.replaceAll('_', ' ')],
    ['Fulfillment', order.fulfillmentStatus.replaceAll('_', ' ')],
    ['Public status', order.publicOrderStatus.replaceAll('_', ' ')],
    ['Fulfillment type', order.fulfillmentType.replaceAll('_', ' ')],
    ['Outlet', order.outlet.name],
    ['QR/table', order.qrContext.locationLabel || order.qrContext.tableId || '-'],
    ['Customer', `${order.customer.name}${order.customer.phone ? ` · ${order.customer.phone}` : ''}`],
    ['Total', formatRupiah(order.totalAmount, order.currency)],
  ]
  return (
    <section className='grid grid-cols-1 gap-2 text-sm'>
      {rows.map(([label, value]) => (
        <div key={label} className='rounded-xl border border-[var(--border-subtle)] p-3'>
          <div className='text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]'>{label}</div>
          <div className='mt-1 font-bold capitalize'>{value}</div>
        </div>
      ))}
    </section>
  )
}
