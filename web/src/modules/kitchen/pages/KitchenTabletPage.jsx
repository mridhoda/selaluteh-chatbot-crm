import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Clock,
  Printer,
  Maximize2,
  ChefHat,
  CheckCircle2,
  X,
  Store,
  ChevronDown,
  ChevronUp,
  Check,
  Utensils,
  ShoppingBag,
  Flag,
  Maximize,
  RefreshCw,
  AlertCircle,
  Copy,
  Volume2,
} from 'lucide-react'
import api from '../../../shared/api/httpClient'
import { getOrderQueryParams, getSessionUser, normalizeRole } from '../../../shared/auth/permissions'
import {
  getReceiptEligibility,
  printWithBestAvailableTransport,
} from '../../printing/thermalPrint'
import orderAlertSound from '../../../sounds/orderan-selkop-masuk.mp3'

const slideInStyle = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-card {
  animation: slideIn 0.3s ease-out forwards;
}
`

const formatAgoText = (seconds) => {
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`
}

const formatTimer = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#25D366"/>
    <path d="M16.5 14.25c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06a6.56 6.56 0 0 1-3.23-2.82c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.5.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" fill="white"/>
  </svg>
)

const TelegramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#37AEE2"/>
    <path d="M7.7 11.5l7.3-2.8c.3-.1.6.1.5.4l-1.2 5.8c-.1.4-.3.5-.6.3l-2.2-1.6-1.1 1c-.1.1-.2.2-.4.2l.1-1.9 3.5-3.2c.1-.1 0-.2-.1-.1L9.1 12.3l-1.9-.6c-.4-.1-.4-.4.5-.7z" fill="white"/>
  </svg>
)

const OnlineStoreIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 16 16" className={`${className} fill-[#635bff]`} xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1h6v6H1V1Zm2 2v2h2V3H3Zm6-2h6v6H9V1Zm2 2v2h2V3h-2ZM1 9h6v6H1V9Zm2 2v2h2v-2H3Zm7-2h2v2h-2V9Zm3 0h2v2h-2V9Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Zm-1-2h2v2h-2v-2Z" />
  </svg>
)

const renderChannelIcon = (channel, className = "w-5 h-5") => {
  const ch = String(channel || '').toLowerCase()
  if (['qr_store', 'qr', 'location_qr', 'location-qr', 'table_qr', 'table-qr', 'website', 'web', 'online', 'online_store', 'public_store', 'storefront'].includes(ch)) {
    return <OnlineStoreIcon className={className} />
  }
  if (ch === 'whatsapp') {
    return <WhatsAppIcon className={className} />
  }
  if (ch === 'telegram') {
    return <TelegramIcon className={className} />
  }
  return <span className="text-lg shrink-0">💬</span>
}

const renderChannelLabel = (channel) => {
  const ch = String(channel || '').toLowerCase()
  if (['qr_store', 'qr', 'location_qr', 'location-qr', 'table_qr', 'table-qr', 'website', 'web', 'online', 'online_store', 'public_store', 'storefront'].includes(ch)) {
    return 'Online Store'
  }
  if (ch === 'whatsapp') {
    return 'WhatsApp'
  }
  if (ch === 'telegram') {
    return 'Telegram'
  }
  return channel || 'Chat'
}

const renderChannelSub = (channel) => {
  const ch = String(channel || '').toLowerCase()
  if (['qr_store', 'qr', 'location_qr', 'location-qr', 'table_qr', 'table-qr', 'website', 'web', 'online', 'online_store', 'public_store', 'storefront'].includes(ch)) {
    return 'via Online Order'
  }
  if (ch === 'whatsapp') {
    return 'via SelaluTeh Marketplace'
  }
  if (ch === 'telegram') {
    return 'via Telegram Bot'
  }
  return 'via Chat Room'
}

const formatCurrency = (value = 0) => {
  const num = Number(value) || 0
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`
}

const isPaidStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  return normalized === 'paid' || normalized === 'lunas'
}

const normalizeKitchenStatus = (order = {}) => {
  const fulfillmentStatus = String(order.fulfillmentStatus || order.fulfillment_status || '').trim().toLowerCase()
  if (['preparing', 'ready', 'completed', 'cancelled'].includes(fulfillmentStatus)) return fulfillmentStatus
  if (fulfillmentStatus === 'awaiting_acceptance' || fulfillmentStatus === 'accepted') return 'new'
  const legacyStatus = String(order.status || '').trim().toLowerCase()
  if (['preparing'].includes(legacyStatus)) return 'preparing'
  if (['ready_for_pickup', 'ready_for_delivery', 'ready'].includes(legacyStatus)) return 'ready'
  if (['completed'].includes(legacyStatus)) return 'completed'
  if (['cancelled', 'canceled', 'rejected'].includes(legacyStatus)) return 'cancelled'
  return 'new'
}

const OrderCard = ({ order, onMove, onViewDetail }) => {
  const elapsed = Math.floor((order.timerSeconds || 0) / 60)
  const isWarning = elapsed > 10
  const isCritical = elapsed > 15
  const isPreparing = order.status === 'preparing'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 animate-card flex flex-col relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPreparing ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>

      <div className="flex flex-col gap-1.5 mb-3 pl-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black tracking-tighter ${isPreparing ? 'text-purple-700' : 'text-emerald-700'}`}>
              {order.orderIdDisplay}
            </span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
              {order.fulfillment}
            </span>
          </div>

          <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full shrink-0 ${
            isCritical && isPreparing ? 'bg-red-100 text-red-600' :
            isWarning && isPreparing ? 'bg-orange-100 text-orange-600' :
            'bg-slate-100 text-slate-600'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formatTimer(order.timerSeconds || 0)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold whitespace-nowrap">
          <span>{order.time}</span>
          <span>•</span>
          <span>{formatAgoText(order.timerSeconds || 0)}</span>
        </div>
      </div>

      <div
        className="flex-1 bg-slate-50 rounded-xl p-3 mb-4 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100"
        onClick={() => onViewDetail(order)}
      >
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-2.5 items-start">
              <div className="bg-white border border-slate-200 text-slate-800 font-bold w-7 h-7 rounded flex items-center justify-center shrink-0 shadow-sm text-sm mt-0.5">
                {item.qty}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm leading-snug break-words">{item.name}</div>
                {item.variant && (
                  <div className="text-xs font-semibold text-purple-600 mt-1 flex items-start gap-1">
                    <span className="bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded text-[10px] break-words">
                      {item.variant}
                    </span>
                  </div>
                )}
                {item.note && (
                  <div className="text-xs font-medium text-amber-600 mt-1 flex items-start gap-1">
                    <span className="bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] italic break-words">
                      Note: {item.note}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.note && (
          <div className="mt-3 p-2 bg-[#FFFDF2] border border-[#FFF8CC] rounded-xl text-xs text-amber-800 font-semibold leading-normal break-words flex items-start gap-1">
            <span className="shrink-0 text-amber-500 font-bold">Note:</span>
            <span>{order.note}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onViewDetail(order)}
          className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 bg-white active:bg-slate-50 transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        {isPreparing ? (
          <button
            onClick={() => onMove(order._id, 'ready')}
            className="flex-1 h-12 bg-purple-600 active:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(147,51,234,0.3)] transition-colors text-base"
          >
            <CheckCircle2 className="w-5 h-5" />
            Tandai Ready
          </button>
        ) : (
          <button
            onClick={() => onMove(order._id, 'completed')}
            className="flex-1 h-12 bg-emerald-500 active:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-colors text-base"
          >
            <Flag className="w-5 h-5" />
            Selesai
          </button>
        )}
      </div>
    </div>
  )
}

export default function KitchenTabletPage({ onViewModeChange }) {
  const canUseDesktopView = ['owner', 'admin'].includes(normalizeRole(getSessionUser()?.workspaceRole || getSessionUser()?.role))
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [lastSync, setLastSync] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [printingOrderId, setPrintingOrderId] = useState(null)
  const [completedExpanded, setCompletedExpanded] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const boardRef = useRef(null)
  const alertAudioRef = useRef(null)
  const knownOrderIdsRef = useRef(new Set())
  const hasLoadedOrdersRef = useRef(false)

  const LOADED_KEY = 'kitchen_tablet_loaded'

  const mapOrder = (order) => {
    const createdAtTime = order.createdAt ? new Date(order.createdAt) : (order.timeAdded || new Date())
    const elapsed = createdAtTime ? Math.floor((Date.now() - createdAtTime.getTime()) / 1000) : 120
    const status = normalizeKitchenStatus(order)

    const items = Array.isArray(order.items) && order.items.length > 0
      ? order.items.map(i => {
          const modifiers = i.metadata?.modifiers || i.modifiers || i.selectedModifiers || i.selected_modifier_options || []
          const variantStr = i.metadata?.variant || i.variant || i.variantName || i.variant_name || 
            (Array.isArray(modifiers) ? modifiers.map(m => m.option_name || m.optionName || m.value || m.name || m.label).filter(Boolean).join(', ') : '') || ''
          
          return {
            name: i.name || i.productNameSnapshot || 'Item',
            qty: i.quantity || 1,
            variant: variantStr,
            note: i.metadata?.note || i.note || i.notes || '',
            imageUrl: i.metadata?.imageUrl || i.metadata?.image_url || null,
            unitPrice: i.unitPrice || 0,
          }
        })
      : []

    const getQueueNumber = () => {
      const rawNum = order.orderNumber || order.orderIdDisplay || order.queue || ''
      if (/^A\d+$/.test(rawNum)) return rawNum
      if (rawNum) {
        const parts = rawNum.split('-')
        const lastPart = parts[parts.length - 1]
        const num = parseInt(lastPart, 10)
        if (!isNaN(num)) return `A${num}`
      }
      const cleanId = (order._id || order.id || '').replace('order-', '')
      const num = parseInt(cleanId.slice(-4), 10)
      return `A${isNaN(num) ? cleanId.slice(-4) : num}`
    }

    const entries = Object.entries(order.formData || {})
    const outletEntry = entries.find(([key]) => key.toLowerCase().includes('outlet'))
    const outletName = order.outlet?.name || order.outlet || (outletEntry ? outletEntry[1] : 'SelaluTeh Danau Murung')
    const channel = (order.channel || order.channelSnapshot || order.source || 'whatsapp').toLowerCase()

    return {
      _id: order._id || order.id,
      orderIdDisplay: getQueueNumber(),
      invoiceId: order.orderNumber || order.invoiceId || order.queue || `INV-${(order._id || order.id || '').slice(-8).toUpperCase()}`,
      status,
      channel,
      _timeAdded: createdAtTime.getTime(),
      time: createdAtTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timerSeconds: elapsed > 0 ? elapsed : 60,
      fulfillment: order.fulfillment || 'Pickup',
      paymentStatus: isPaidStatus(order.paymentStatus || (entries.find(([k]) => k.toLowerCase().includes('payment')) ? entries.find(([k]) => k.toLowerCase().includes('payment'))[1] : '')) ? 'Paid' : 'Unpaid',
      items,
      customer: {
        name: order.customerNameSnapshot || order.contactId?.name || 'Customer',
        phone: (order.contactId && typeof order.contactId === 'object'
          ? (order.contactId.phone || order.contactId.handle || order.contactId.external_id || '')
          : null) || order.customerPhoneSnapshot || ''
      },
      outlet: outletName,
      note: order.notes || order.fulfillmentSnapshot?.customerNote || order.fulfillment_snapshot?.customerNote || '',
    }
  }

  const loadInitialData = async () => {
    try {
      const ordersRes = await api.get('/orders/kitchen', { params: getOrderQueryParams(getSessionUser()) }).catch(() => null)
      const rawOrders = ordersRes?.data?.data || ordersRes?.data || []

      if (rawOrders.length === 0 && !sessionStorage.getItem(LOADED_KEY)) {
        sessionStorage.setItem(LOADED_KEY, '1')
        const demo = [
          { id: 'order-4', orderNumber: 'SLTH-20260710-0004', status: 'preparing', timeAdded: new Date(Date.now() - 11 * 60000), items: [{ name: 'Selkop Society', quantity: 1, metadata: { variant: 'Less Sugar, No Ice' }, unitPrice: 15000 }, { name: 'Kopi Susu Gula Aren', quantity: 2, metadata: { variant: '' }, unitPrice: 18000 }], customerNameSnapshot: 'Rendi', paymentStatus: 'Paid', fulfillment: 'Dine In' },
          { id: 'order-5', orderNumber: 'SLTH-20260710-0005', status: 'preparing', timeAdded: new Date(Date.now() - 4 * 60000), items: [{ name: 'Americano Hot', quantity: 1, metadata: { variant: '' }, unitPrice: 12000 }], customerNameSnapshot: 'Milo', paymentStatus: 'Paid', fulfillment: 'Takeaway' },
          { id: 'order-3', orderNumber: 'SLTH-20260710-0003', status: 'ready', timeAdded: new Date(Date.now() - 25 * 60000), items: [{ name: 'Latte', quantity: 3, metadata: { variant: 'Oat Milk' }, unitPrice: 15000 }], customerNameSnapshot: 'Hubla', paymentStatus: 'Paid', fulfillment: 'Pickup' },
        ]
        setOrders(demo.map(mapOrder))
        setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        return
      }

      const parsedOrders = rawOrders.filter(order => {
        const entries = Object.entries(order.formData || {})
        const payStatusEntry = entries.find(([key]) => key.toLowerCase().includes('payment') || key.toLowerCase().includes('bayar'))
        const paymentStatus = order.paymentStatus || (payStatusEntry ? payStatusEntry[1] : '')
        return isPaidStatus(paymentStatus)
      }).map(mapOrder).filter(order => ['preparing', 'ready', 'completed'].includes(order.status))

      const nextOrderIds = new Set(parsedOrders.map((order) => order._id).filter(Boolean))
      const hasNewOrder = hasLoadedOrdersRef.current && [...nextOrderIds].some((id) => !knownOrderIdsRef.current.has(id))
      knownOrderIdsRef.current = nextOrderIds
      hasLoadedOrdersRef.current = true
      if (hasNewOrder && soundEnabled) {
        const audio = alertAudioRef.current
        if (audio) {
          audio.currentTime = 0
          audio.play().catch(() => setSoundEnabled(false))
        }
      }
      setOrders(parsedOrders)
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (error) {
      console.error('Failed to load kitchen tablet data:', error)
    }
  }

  useEffect(() => {
    loadInitialData()
    const pollInterval = setInterval(loadInitialData, 30000)
    const onEvent = () => loadInitialData()
    window.addEventListener('order:created', onEvent)
    window.addEventListener('order:paid', onEvent)
    window.addEventListener('order:updated', onEvent)
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('order:created', onEvent)
      window.removeEventListener('order:paid', onEvent)
      window.removeEventListener('order:updated', onEvent)
    }
  }, [soundEnabled])

  // Timer tickers incrementing every second
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'completed' || order.status === 'cancelled') {
            return order
          }
          return {
            ...order,
            timerSeconds: (order.timerSeconds || 0) + 1
          }
        })
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTotalItems = (items) => items.reduce((s, i) => s + i.qty, 0)

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (!orderId.startsWith('mock-')) {
        if (newStatus === 'ready') {
          await api.post(`/api/v1/admin/orders/${orderId}/ready`)
        } else if (newStatus === 'completed') {
          await api.post(`/api/v1/admin/orders/${orderId}/complete`)
        }
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
      }
      loadInitialData()
    } catch (err) {
      console.error('Failed to transition order status:', err)
      alert(`Gagal merubah status order: ${err.message}`)
      loadInitialData()
    }
  }

  const toggleFullscreen = async () => {
    const board = boardRef.current
    if (!board) return
    try {
      if (document.fullscreenElement === board) {
        await document.exitFullscreen()
        return
      }
      if (document.fullscreenElement) await document.exitFullscreen()
      await board.requestFullscreen()
    } catch (error) {
      console.error('Fullscreen failed:', error)
    }
  }

  const enableSound = async () => {
    const audio = alertAudioRef.current
    if (!audio) return
    try {
      await audio.play()
      setSoundEnabled(true)
    } catch {
      setSoundEnabled(false)
    }
  }

  useEffect(() => {
    const playAlert = () => {
      if (!soundEnabled) return
      const audio = alertAudioRef.current
      if (!audio) return
      audio.currentTime = 0
      audio.play().catch(() => setSoundEnabled(false))
    }
    window.addEventListener('order:created', playAlert)
    window.addEventListener('order:paid', playAlert)
    window.addEventListener('push:test', playAlert)
    return () => {
      window.removeEventListener('order:created', playAlert)
      window.removeEventListener('order:paid', playAlert)
      window.removeEventListener('push:test', playAlert)
    }
  }, [soundEnabled])

  useEffect(() => {
    const board = boardRef.current
    const handler = () => setIsFullscreen(document.fullscreenElement === board)
    document.addEventListener('fullscreenchange', handler)
    handler()
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      if (document.fullscreenElement === board) document.exitFullscreen().catch(() => {})
    }
  }, [])

  const handlePrint = async (order) => {
    if (!order || printingOrderId) return
    const eligibility = getReceiptEligibility(order, 'KITCHEN_TICKET')
    if (!eligibility.eligible) { alert(eligibility.safeMessage); return }
    setPrintingOrderId(order._id)
    try {
      const result = await printWithBestAvailableTransport(order, {
        documentType: 'KITCHEN_TICKET',
        footerLines: ['Kitchen copy', 'Dispatch only, bukan bukti selesai cetak fisik'],
      })
      if (result?.errorCode) {
        alert(result.safeMessage || 'Print tidak bisa dibuka.')
      } else if (result?.transport === 'CLEANTER') {
        alert('Kitchen ticket dikirim ke Cleanter.')
      }
    } finally {
      setPrintingOrderId(null)
    }
  }

  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')
  const completedOrders = orders.filter(o => o.status === 'completed')

  return (
    <div
      ref={boardRef}
      className="flex flex-col h-screen overflow-hidden bg-slate-100"
    >
      <style>{slideInStyle}</style>
      <audio ref={alertAudioRef} src={orderAlertSound} preload="auto" />
      <header className="bg-white h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-slate-700" />
            Kitchen Board
          </h1>
          <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold border border-pink-200 hidden sm:block">
            Outlet Staff
          </div>
        </div>

          <div className="flex items-center gap-2">
          <button
            onClick={enableSound}
            aria-label={soundEnabled ? 'Suara order aktif' : 'Aktifkan suara order'}
            title={soundEnabled ? 'Suara order aktif' : 'Aktifkan suara order'}
            className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl shadow-sm ${soundEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
            <div>
              <div className="text-slate-400 font-bold uppercase text-[9px] leading-tight">Last Sync</div>
              <div className="text-slate-700 font-bold leading-tight">{lastSync}</div>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"
          >
            <Maximize className="w-5 h-5" />
          </button>

          {canUseDesktopView && <button
            onClick={() => {
              if (onViewModeChange) {
                onViewModeChange('classic')
                localStorage.setItem('kitchen_view_mode', 'classic')
              }
            }}
            className="h-10 px-3 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm hover:bg-slate-50 transition-colors text-xs font-bold gap-1"
          >
            <Store className="w-4 h-4 text-purple-600" />
            <span>Desktop View</span>
          </button>}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-slate-50">
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 overflow-hidden">
          <div className="bg-purple-50/80 border-b border-purple-100/80 px-4 py-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-purple-900">Preparing</h2>
            </div>
            <div className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
              {preparingOrders.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
            {preparingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Utensils className="w-12 h-12 opacity-20" />
                <p className="font-medium text-sm">No orders in preparation</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                {preparingOrders.map(order => (
                  <OrderCard key={order._id} order={order} onMove={updateOrderStatus} onViewDetail={setSelectedOrder} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="bg-emerald-50/80 border-b border-emerald-100/80 px-4 py-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-emerald-900">Ready for Pickup</h2>
            </div>
            <div className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
              {readyOrders.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
            {readyOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 opacity-20" />
                <p className="font-medium text-sm">No ready orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                {readyOrders.map(order => (
                  <OrderCard key={order._id} order={order} onMove={updateOrderStatus} onViewDetail={setSelectedOrder} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="bg-white border-t border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div 
          onClick={() => setCompletedExpanded(!completedExpanded)}
          className="px-6 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 text-sm">Completed Today</span>
            <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-md text-xs">{completedOrders.length}</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {completedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {completedExpanded && (
          <div className="px-6 pb-4 pt-1 flex items-center gap-3 overflow-x-auto min-h-[50px] scrollbar-thin">
            {completedOrders.length === 0 ? (
              <div className="text-xs text-slate-400 py-1">No completed orders today</div>
            ) : (
              completedOrders.map(order => (
                <div 
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`flex items-center gap-3.5 px-4 py-2 bg-white border rounded-xl cursor-pointer transition-all shrink-0 ${
                    selectedOrder?._id === order._id ? 'border-[#10B981] ring-2 ring-[#DCFCE7]' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-xs">{order.orderIdDisplay}</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{formatCurrency(order.items.reduce((s, i) => s + (i.unitPrice * i.qty), 0))}</span>
                  </div>
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#10B981] shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full overflow-hidden animate-card">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-4xl font-black text-slate-800">{selectedOrder.orderIdDisplay}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                    selectedOrder.status === 'preparing' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    <Check className="w-3 h-3" />
                    {selectedOrder.status === 'preparing' ? 'Preparing' : 'Ready'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mr-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold text-slate-500 mb-1">{selectedOrder.invoiceId}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 font-semibold">
                      <span>{selectedOrder.time}</span>
                      <span>•</span>
                      <span className="text-[#FF7F3E]">{formatAgoText(selectedOrder.timerSeconds)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {renderChannelIcon(selectedOrder.channel, "w-10 h-10")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> {selectedOrder.fulfillment}
                </span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {selectedOrder.paymentStatus}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Items</div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm font-semibold">
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[#11182E] font-bold shrink-0">{item.qty}x</span>
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">{item.name}</span>
                          {item.variant && <span className="text-xs text-gray-400 font-normal mt-0.5">{item.variant}</span>}
                          {item.note && <span className="text-xs text-amber-600 font-normal mt-0.5 italic">Note: {item.note}</span>}
                        </div>
                      </div>
                      <div className="text-gray-700 font-bold shrink-0">{formatCurrency(item.unitPrice * item.qty)}</div>
                    </div>
                  ))}
                </div>

                {selectedOrder.note && (
                  <div className="mt-3 rounded-xl border border-[#FFF8CC] bg-[#FFFDF2] p-3 text-xs text-amber-800 leading-relaxed font-semibold">
                    <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">Note from Customer</h4>
                    {selectedOrder.note}
                  </div>
                )}

                <div className="border-t border-gray-200 my-2.5"></div>

                <div className="space-y-1.5 text-sm font-semibold text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-gray-700">{formatCurrency(selectedOrder.items.reduce((s, i) => s + (i.unitPrice * i.qty), 0))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-500">
                    <span>Platform Fee</span>
                    <span className="text-gray-700">{formatCurrency(0)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="flex justify-between text-base font-bold text-gray-900 pt-0.5">
                    <span>Total Paid</span>
                    <span className="text-[#FF4B72]">{formatCurrency(selectedOrder.items.reduce((s, i) => s + (i.unitPrice * i.qty), 0))}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.customer?.name && (
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer</h4>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {selectedOrder.customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{selectedOrder.customer.name}</div>
                      {selectedOrder.customer.phone && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-semibold">
                          <span>
                            {selectedOrder.channel === 'telegram' 
                              ? (selectedOrder.customer.phone.startsWith('@') ? selectedOrder.customer.phone : `@${selectedOrder.customer.phone}`)
                              : selectedOrder.customer.phone}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(
                                selectedOrder.channel === 'telegram' 
                                  ? (selectedOrder.customer.phone.startsWith('@') ? selectedOrder.customer.phone : `@${selectedOrder.customer.phone}`)
                                  : selectedOrder.customer.phone
                              )
                              alert('Nomor telepon disalin!')
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Copy customer identifier"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Channel Section */}
              <div className="border-t border-gray-100 pt-3 mb-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Channel</h4>
                <div className="flex items-center gap-2.5 text-xs text-gray-600 font-semibold">
                  {renderChannelIcon(selectedOrder.channel, "w-5 h-5")}
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">
                      {renderChannelLabel(selectedOrder.channel)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      {renderChannelSub(selectedOrder.channel)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                disabled={Boolean(printingOrderId)}
                onClick={() => handlePrint(selectedOrder)}
                className="flex-1 py-3 border-2 border-purple-200 text-purple-700 font-bold rounded-xl flex items-center justify-center gap-2 bg-white hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                {printingOrderId === selectedOrder?._id ? 'Dispatching...' : 'Print Invoice / Receipt'}
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
