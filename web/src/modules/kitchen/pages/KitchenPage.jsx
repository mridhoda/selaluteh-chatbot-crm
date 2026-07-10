import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Clock,
  Printer,
  Maximize2,
  Minimize2,
  CheckCircle2,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Store,
  FileText,
  Check,
  ClipboardList,
  CheckCircle,
  Utensils,
  ChevronLeft,
  ChefHat
} from 'lucide-react'
import api from '../../../shared/api/httpClient'
import { getOrderQueryParams, getSessionUser } from '../../../shared/auth/permissions'
import {
  getReceiptEligibility,
  isAndroidUserAgent,
  openReceiptPrintWindow,
  printWithBestAvailableTransport,
} from '../../printing/thermalPrint'

// Helper for WhatsApp SVG Icon (Identical to reference green logo)
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#25D366"/>
    <path d="M16.5 14.25c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06a6.56 6.56 0 0 1-3.23-2.82c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.5.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" fill="white"/>
  </svg>
)

// Helper for Telegram SVG Icon (Identical to reference blue logo)
const TelegramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#37AEE2"/>
    <path d="M7.7 11.5l7.3-2.8c.3-.1.6.1.5.4l-1.2 5.8c-.1.4-.3.5-.6.3l-2.2-1.6-1.1 1c-.1.1-.2.2-.4.2l.1-1.9 3.5-3.2c.1-.1 0-.2-.1-.1L9.1 12.3l-1.9-.6c-.4-.1-.4-.4.5-.7z" fill="white"/>
  </svg>
)

const formatCurrency = (value = 0) => {
  const num = Number(value) || 0
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`
}

const formatAgoText = (seconds) => {
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`
}

const isPaidStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  return normalized === 'paid' || normalized === 'lunas'
}

const normalizeKitchenStatus = (order = {}) => {
  const fulfillmentStatus = String(order.fulfillmentStatus || order.fulfillment_status || '').trim().toLowerCase()
  if (['preparing', 'ready', 'completed', 'cancelled'].includes(fulfillmentStatus)) {
    return fulfillmentStatus
  }
  if (fulfillmentStatus === 'awaiting_acceptance' || fulfillmentStatus === 'accepted') {
    return 'new'
  }

  const legacyStatus = String(order.status || '').trim().toLowerCase()
  if (['preparing'].includes(legacyStatus)) return 'preparing'
  if (['ready_for_pickup', 'ready_for_delivery', 'ready'].includes(legacyStatus)) return 'ready'
  if (['completed'].includes(legacyStatus)) return 'completed'
  if (['cancelled', 'canceled', 'rejected'].includes(legacyStatus)) return 'cancelled'
  return 'new'
}

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [outlets, setOutlets] = useState([])
  const [selectedOutlet, setSelectedOutlet] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [lastSync, setLastSync] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [printingOrderId, setPrintingOrderId] = useState(null)
  
  // Reference for the dashboard container to toggle fullscreen
  const boardRef = useRef(null)

  // Web Audio Context for order notification chime
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      // First tone (G5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.frequency.value = 783.99 // G5
      gain1.gain.setValueAtTime(0, ctx.currentTime)
      gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.3)

      // Second tone (C6)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = 1046.50 // C6
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15)
      gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc2.start(ctx.currentTime + 0.15)
      osc2.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.warn('Web Audio chime failed:', e)
    }
  }

  // Load Outlets & Orders
  const loadInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch outlets
      const outletsRes = await api.get('/outlets').catch(() => null)
      const listOutlets = outletsRes?.data?.data || outletsRes?.data || []
      
      // Ensure we have a default outlet matching mockup
      const formattedOutlets = listOutlets.map(o => ({
        id: o._id || o.id,
        name: o.name
      }))

      if (!formattedOutlets.find(o => o.name.includes('Danau Murung'))) {
        formattedOutlets.unshift({ id: 'danau-murung', name: 'SelaluTeh Danau Murung' })
      }
      setOutlets(formattedOutlets)

      // 2. Fetch server orders
      const ordersRes = await api.get('/orders', { params: getOrderQueryParams(getSessionUser()) }).catch(() => null)
      const rawOrders = ordersRes?.data?.data || ordersRes?.data || []

      // Normalize server orders to match kitchen layout shape
      const parsedOrders = rawOrders.filter(order => {
        const entries = Object.entries(order.formData || {})
        const payStatusEntry = entries.find(([key]) => key.toLowerCase().includes('payment') || key.toLowerCase().includes('bayar'))
        const paymentStatus = order.paymentStatus || (payStatusEntry ? payStatusEntry[1] : '')
        return isPaidStatus(paymentStatus)
      }).map(order => {
        const entries = Object.entries(order.formData || {})
        const outletEntry = entries.find(([key]) => key.toLowerCase().includes('outlet'))
        const outletName = order.outlet?.name || order.outlet || (outletEntry ? outletEntry[1] : 'SelaluTeh Danau Murung')

        const payStatusEntry = entries.find(([key]) => key.toLowerCase().includes('payment'))
        const paymentStatus = order.paymentStatus || (payStatusEntry ? payStatusEntry[1] : (order.paymentProofUrl ? 'Paid' : 'Unpaid'))

        const channel = (order.channelSnapshot || order.source || 'whatsapp').toLowerCase()

        const items = Array.isArray(order.items) && order.items.length > 0
          ? order.items.map(i => {
              let price = i.unitPrice || 0
              if (price > 0 && price < 100) {
                price = price * 1000
              }
              return {
                name: i.name || i.productNameSnapshot || 'Item',
                qty: i.quantity || 1,
                variant: i.metadata?.variant || '',
                price
              }
            })
          : []

        const status = normalizeKitchenStatus(order)

        const createdAtTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '9:41 AM'
        const elapsed = order.createdAt ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000) : 120

        const itemsTotal = items.reduce((s, i) => s + (i.price * i.qty), 0)
        let totalAmount = order.totalAmount || itemsTotal
        if (totalAmount > 0 && totalAmount < 1000) {
          totalAmount = totalAmount * 1000
        }

        const platformFee = 0

        const getQueueNumber = () => {
          const rawNum = order.orderNumber || order.orderIdDisplay || ''
          if (rawNum) {
            const parts = rawNum.replace('#', '').split('-')
            const lastPart = parts[parts.length - 1]
            if (/^\d+$/.test(lastPart)) {
              return `#${parseInt(lastPart, 10)}`
            }
            return rawNum.startsWith('#') ? rawNum : `#${rawNum}`
          }
          const cleanId = (order._id || order.id || '').replace('order-', '')
          return `#${cleanId.slice(-4)}`
        }
        const orderIdDisplay = getQueueNumber()

        return {
          _id: order._id || order.id,
          orderIdDisplay,
          invoiceId: order.orderNumber || order.invoiceId || `INV-${(order._id || order.id).slice(-8).toUpperCase()}`,
          status,
          channel,
          time: createdAtTime,
          agoText: 'Just now',
          timerSeconds: elapsed > 0 ? elapsed : 60,
          fulfillment: 'Pickup',
          paymentStatus: isPaidStatus(paymentStatus) ? 'Paid' : 'Unpaid',
          items,
          customer: {
            name: order.customerNameSnapshot || order.contactId?.name || 'Customer',
            phone: (order.contactId && typeof order.contactId === 'object'
              ? (order.contactId.phone || order.contactId.handle || order.contactId.external_id || order.contactId.externalId || '')
              : null) || order.customerPhoneSnapshot || ''
          },
          outlet: outletName,
          note: order.notes || '',
          platformFee,
          totalAmount
        }
      }).filter(order => ['preparing', 'ready', 'completed'].includes(order.status))

      setOrders(parsedOrders)

      // Set default selected order if none selected
      if (!selectedOrderId && parsedOrders.length > 0) {
        const initialSelected = parsedOrders.find(o => o.orderIdDisplay === '#8') || parsedOrders[0]
        setSelectedOrderId(initialSelected._id)
      }

      setLastSync(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }))
    } catch (error) {
      console.error('Failed to load kitchen board data:', error)
      setLastSync(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }))
    } finally {
      setLoading(false)
    }
  }

  // Poll for new orders and update timers
  useEffect(() => {
    loadInitialData()
    const pollInterval = setInterval(() => {
      loadInitialData()
    }, 30000)

    const onOrderCreated = () => loadInitialData()
    window.addEventListener('order:created', onOrderCreated)
    window.addEventListener('order:paid', onOrderCreated)
    window.addEventListener('order:updated', onOrderCreated)

    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('order:created', onOrderCreated)
      window.removeEventListener('order:paid', onOrderCreated)
      window.removeEventListener('order:updated', onOrderCreated)
    }
  }, [])

  // Check if new orders arrived to trigger chime
  const prevNewOrdersCountRef = useRef(0)
  useEffect(() => {
    const newCount = orders.filter(o => o.status === 'preparing' && o.paymentStatus === 'Paid').length
    if (newCount > prevNewOrdersCountRef.current && prevNewOrdersCountRef.current > 0) {
      playChime()
    }
    prevNewOrdersCountRef.current = newCount
  }, [orders])

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
            timerSeconds: order.timerSeconds + 1
          }
        })
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format seconds to MM:SS
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Handles updating the order status with server sync
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      if (!orderId.startsWith('mock-')) {
        if (newStatus === 'ready') {
          await api.post(`/admin/orders/${orderId}/ready`)
        } else if (newStatus === 'completed') {
          await api.post(`/admin/orders/${orderId}/complete`)
        }
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus, timerSeconds: 0 } : o))
      }
      loadInitialData()
    } catch (err) {
      console.error('Failed to transition order status:', err)
      alert(`Gagal merubah status order: ${err.message}`)
      loadInitialData()
    }
  }

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      boardRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Fullscreen failed:', err)
      })
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (selectedOutlet === 'all') return orders
    return orders.filter(o => o.outlet.toLowerCase().includes(selectedOutlet.toLowerCase()))
  }, [orders, selectedOutlet])

  // Split columns
  const preparingCards = useMemo(() => filteredOrders.filter(o => o.status === 'preparing'), [filteredOrders])
  const readyCards = useMemo(() => filteredOrders.filter(o => o.status === 'ready'), [filteredOrders])
  const completedCards = useMemo(() => filteredOrders.filter(o => o.status === 'completed'), [filteredOrders])

  // Selected order details object
  const selectedOrder = useMemo(() => {
    return orders.find(o => o._id === selectedOrderId)
  }, [orders, selectedOrderId])

  // Handle printing selected order
  const handlePrint = async (order) => {
    if (!order) return
    if (printingOrderId) return
    const eligibility = getReceiptEligibility(order, 'KITCHEN_TICKET')
    if (!eligibility.eligible) {
      alert(eligibility.safeMessage)
      return
    }

    const printOptions = {
      documentType: 'KITCHEN_TICKET',
      footerLines: ['Kitchen copy', 'Dispatch only, bukan bukti selesai cetak fisik'],
    }
    setPrintingOrderId(order._id)
    try {
      const result = await printWithBestAvailableTransport(order, printOptions)

      if (result.errorCode) {
        alert(result.safeMessage || 'Print tidak bisa dibuka. Gunakan Preview/izinkan popup untuk mencetak.')
      } else if (result.transport === 'CLEANTER') {
        alert('Kitchen ticket dikirim ke Cleanter. HTTP ACK hanya berarti DISPATCHED.')
      }
    } finally {
      setPrintingOrderId(null)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    alert('Nomor telepon disalin!')
  }

  return (
    <div 
      ref={boardRef} 
      className={`flex flex-col h-full bg-[#FAF9F6] text-[#11182E] overflow-hidden ${isFullscreen ? 'p-6 fixed inset-0 z-50 w-screen h-screen' : ''}`}
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Kitchen Board</h1>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FFF0F3] text-[#FF4B72] rounded-full text-xs font-semibold border border-[#FFE0E6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B72] animate-pulse"></span>
            Outlet Staff
          </span>
          
          {/* Custom styled select matching reference dropdown */}
          <div className="relative ml-2">
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="appearance-none pl-9 pr-8 py-1.5 bg-[#F9F7FC] hover:bg-[#F2EFF7] border border-[#E9E4F0] rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer transition-all duration-200"
            >
              <option value="all">Semua Outlet</option>
              {outlets.map(o => (
                <option key={o.id} value={o.name}>{o.name}</option>
              ))}
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Active Orders Count Badge */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Active Orders</span>
              <span className="text-sm font-bold text-red-500 leading-none">{preparingCards.length + readyCards.length}</span>
            </div>
          </div>

          {/* Sync Box */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-all" onClick={loadInitialData}>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Last Sync</span>
              <span className="text-sm font-bold text-gray-700 leading-none">{lastSync}</span>
            </div>
          </div>

          {/* Fullscreen Button */}
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 transition-all shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>Fullscreen</span>
          </button>

          {/* Print Selected Order Button */}
          <button 
            disabled={!selectedOrderId || Boolean(printingOrderId)}
            onClick={() => handlePrint(selectedOrder)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF4B72] hover:bg-[#E63C62] active:bg-[#C92C4E] text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{printingOrderId === selectedOrder?._id ? 'Dispatching...' : 'Print Selected Order'}</span>
          </button>
        </div>
      </div>

      {/* 2. Kitchen Board & Sidebar Main Layout */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden mb-3">
        {/* Two Columns Kitchen Board */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-y-auto lg:overflow-visible">
          {/* Column 1: Preparing */}
          <div className="flex flex-col h-full bg-[#FCFAFF] rounded-xl border border-[#E9D5FF] shadow-sm overflow-hidden">
            {/* Header with Soft Purple Background and Purple Border Bottom */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F3E8FF] border-b border-[#E9D5FF]">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="font-bold text-sm text-[#8B5CF6] tracking-wide">Preparing</h3>
              </div>
              <span className="px-2 py-0.5 bg-[#8B5CF6] text-white text-[11px] font-bold rounded-full">{preparingCards.length}</span>
            </div>
            
            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {preparingCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Utensils className="w-9 h-9 mb-2 stroke-[1.5] text-gray-300" />
                  <p className="text-xs">No orders in preparation</p>
                </div>
              ) : (
                preparingCards.map(order => (
                  <div 
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    className={`group relative flex flex-col p-4 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedOrderId === order._id 
                        ? 'border-[#8B5CF6] shadow-md shadow-[#F5EFFF] ring-2 ring-[#F3E8FF]' 
                        : 'border-[#F3E8FF] hover:border-[#E9D5FF] hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-[#8B5CF6]">{order.orderIdDisplay}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{order.invoiceId}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 font-semibold">
                          <span>{order.time}</span>
                          <span>•</span>
                          <span>{order.agoText}</span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        {order.channel === 'whatsapp' ? <WhatsAppIcon className="w-5 h-5" /> : <TelegramIcon className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Second Row: Timer and badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span className="text-sm font-bold text-[#F59E0B] tracking-wider tabular-nums">
                        {formatTimer(order.timerSeconds)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 font-bold rounded flex items-center gap-1">
                        <Store className="w-2.5 h-2.5" />
                        <span>Pickup</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#E8F8F0] text-[#10B981] font-bold rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                        <span>Paid</span>
                      </span>
                    </div>

                    {/* Items List layout exactly like reference */}
                    <div className="flex-1 space-y-2 text-xs font-semibold text-gray-700 border-t border-dashed border-gray-100 pt-3 pb-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="text-[#11182E] font-bold shrink-0 min-w-[18px]">{item.qty}x</span>
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold">{item.name}</span>
                            {item.variant && <span className="text-[10px] text-gray-400 font-normal mt-0.5">{item.variant}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3 pt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order._id, 'ready');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-xs font-bold shadow-sm shadow-[#F5EFFF] transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Ready */}
          <div className="flex flex-col h-full bg-[#FAFFF9] rounded-xl border border-[#BBF7D0] shadow-sm overflow-hidden">
            {/* Header with Soft Green Background and Green Border Bottom */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#DCFCE7] border-b border-[#BBF7D0]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <h3 className="font-bold text-sm text-[#15803D] tracking-wide">Ready</h3>
              </div>
              <span className="px-2 py-0.5 bg-[#15803D] text-white text-[11px] font-bold rounded-full">{readyCards.length}</span>
            </div>
            
            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {readyCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Utensils className="w-9 h-9 mb-2 stroke-[1.5] text-gray-300" />
                  <p className="text-xs">No ready orders</p>
                </div>
              ) : (
                readyCards.map(order => (
                  <div 
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    className={`group relative flex flex-col p-4 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedOrderId === order._id 
                        ? 'border-[#10B981] shadow-md shadow-[#F0FDF4] ring-2 ring-[#DCFCE7]' 
                        : 'border-[#DCFCE7] hover:border-[#BBF7D0] hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-[#10B981]">{order.orderIdDisplay}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{order.invoiceId}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 font-semibold">
                          <span>{order.time}</span>
                          <span>•</span>
                          <span>{order.agoText}</span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        {order.channel === 'whatsapp' ? <WhatsAppIcon className="w-5 h-5" /> : <TelegramIcon className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Second Row: Timer and badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span className="text-sm font-bold text-[#EF4444] tracking-wider tabular-nums">
                        {formatTimer(order.timerSeconds)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 font-bold rounded flex items-center gap-1">
                        <Store className="w-2.5 h-2.5" />
                        <span>Pickup</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#E8F8F0] text-[#10B981] font-bold rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                        <span>Paid</span>
                      </span>
                    </div>

                    {/* Items List layout exactly like reference */}
                    <div className="flex-1 space-y-2 text-xs font-semibold text-gray-700 border-t border-dashed border-gray-100 pt-3 pb-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="text-[#11182E] font-bold shrink-0 min-w-[18px]">{item.qty}x</span>
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold">{item.name}</span>
                            {item.variant && <span className="text-[10px] text-gray-400 font-normal mt-0.5">{item.variant}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3 pt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order._id, 'completed');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold shadow-sm shadow-[#F0FDF4] transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Picked Up</span>
                      </button>
                      <button 
                        disabled={Boolean(printingOrderId)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(order);
                        }}
                        className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Right Sidebar Detail View */}
        {selectedOrder && (
          <div className="w-[380px] bg-white rounded-xl border border-gray-200/70 shadow-sm flex flex-col h-full overflow-hidden shrink-0">
            {/* Sidebar Header Navigation */}
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
              <button 
                onClick={() => setSelectedOrderId(null)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSelectedOrderId(null)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Details Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              
              {/* Combined Title Block (reducing gap between number and order ID) */}
              <div className="flex flex-col space-y-1">
                {/* Row 2: Large Order Number & Status Badge */}
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-extrabold tracking-tight ${
                    selectedOrder.status === 'preparing' ? 'text-[#8B5CF6]' :
                    selectedOrder.status === 'ready' ? 'text-[#10B981]' :
                    selectedOrder.status === 'completed' ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {selectedOrder.orderIdDisplay}
                  </span>
                  
                  {/* Status Badges styled to match reference */}
                  {selectedOrder.status === 'preparing' && (
                    <span className="px-3 py-1 bg-[#F3E8FF] text-[#8B5CF6] rounded-full text-xs font-bold border border-[#E9D5FF] flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5" />
                      Preparing
                    </span>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <span className="px-3 py-1 bg-[#DCFCE7] text-[#10B981] rounded-full text-xs font-bold border border-[#BBF7D0] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready
                    </span>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-bold border border-gray-200 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Row 3: Invoice & Time Info + Large Channel Icon */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{selectedOrder.invoiceId}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 font-semibold">
                      <span>{selectedOrder.time}</span>
                      <span>•</span>
                      <span className="text-[#FF7F3E]">{formatAgoText(selectedOrder.timerSeconds)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {selectedOrder.channel === 'whatsapp' ? (
                      <WhatsAppIcon className="w-10 h-10" />
                    ) : (
                      <TelegramIcon className="w-10 h-10" />
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Pickup & Paid Badges */}
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-medium rounded text-[11px] flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  <span>Pickup</span>
                </span>
                <span className="px-2 py-0.5 bg-[#E8F8F0] text-[#10B981] font-semibold rounded text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span>Paid</span>
                </span>
              </div>

              {/* Items List section */}
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm font-semibold">
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[#11182E] font-bold shrink-0">{item.qty}x</span>
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">{item.name}</span>
                          {item.variant && <span className="text-xs text-gray-400 font-normal mt-0.5">{item.variant}</span>}
                        </div>
                      </div>
                      <div className="text-gray-700 font-bold shrink-0">{formatCurrency(item.price * item.qty)}</div>
                    </div>
                  ))}
                </div>

                {/* Clean solid separator line */}
                <div className="border-t border-gray-200 my-2.5"></div>

                <div className="space-y-1.5 text-sm font-semibold text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-gray-700">{formatCurrency(selectedOrder.totalAmount - selectedOrder.platformFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-500">
                    <span>Platform Fee</span>
                    <span className="text-gray-700">{formatCurrency(selectedOrder.platformFee)}</span>
                  </div>
                  
                  {/* Solid separator line */}
                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="flex justify-between text-base font-bold text-gray-900 pt-0.5">
                    <span>Total Paid</span>
                    <span className="text-[#FF4B72]">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Section */}
              {selectedOrder.customer && (
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</h4>
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
                            onClick={() => handleCopy(
                              selectedOrder.channel === 'telegram' 
                                ? (selectedOrder.customer.phone.startsWith('@') ? selectedOrder.customer.phone : `@${selectedOrder.customer.phone}`)
                                : selectedOrder.customer.phone
                            )}
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
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Channel</h4>
                <div className="flex items-center gap-2.5 text-xs text-gray-600 font-semibold">
                  {selectedOrder.channel === 'whatsapp' ? <WhatsAppIcon className="w-5 h-5" /> : <TelegramIcon className="w-5 h-5" />}
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">
                      {selectedOrder.channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      via {selectedOrder.channel === 'whatsapp' ? 'SelaluTeh Marketplace' : 'Telegram Bot'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note from Customer Section */}
              {selectedOrder.note && (
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Note from Customer</h4>
                  <div className="p-3 bg-[#FFFDF2] border border-[#FFF8CC] rounded-xl text-xs text-amber-800 leading-relaxed font-semibold">
                    {selectedOrder.note}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Print/Close */}
            <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0 bg-white">
              <button 
                disabled={Boolean(printingOrderId)}
                onClick={() => handlePrint(selectedOrder)}
                className="flex-1 py-2.5 border border-[#8B5CF6] hover:bg-purple-50 text-[#8B5CF6] rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                {printingOrderId === selectedOrder?._id ? 'Dispatching...' : 'Print Invoice / Receipt'}
              </button>
              <button 
                onClick={() => setSelectedOrderId(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Completed Today Bar */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden shrink-0">
        <div 
          onClick={() => setCompletedExpanded(!completedExpanded)}
          className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-xs">Completed Today</span>
            <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#16803D] text-[11px] font-bold rounded-full">{completedCards.length}</span>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            {completedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {completedExpanded && (
          <div className="px-4 pb-4 pt-1 flex items-center gap-3 overflow-x-auto min-h-[50px] scrollbar-thin">
            {completedCards.length === 0 ? (
              <div className="text-xs text-gray-400 py-1">No completed orders today</div>
            ) : (
              completedCards.map(order => (
                <div 
                  key={order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  className={`flex items-center gap-3.5 px-4 py-2 bg-white border rounded-xl cursor-pointer transition-all shrink-0 ${
                    selectedOrderId === order._id ? 'border-[#10B981] ring-2 ring-[#DCFCE7]' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-xs">{order.orderIdDisplay}</span>
                    <span className="text-[9px] text-gray-400 font-semibold mt-0.5">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <CheckCircle className="w-4.5 h-4.5 text-[#10B981] shrink-0" />
                </div>
              ))
            )}
            
            <button 
              onClick={() => alert('View All Completed Orders Clicked')}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 transition-all shrink-0"
            >
              <span>View All</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
