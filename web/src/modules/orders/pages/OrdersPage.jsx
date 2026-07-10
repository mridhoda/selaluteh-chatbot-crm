import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../../shared/api/httpClient'
import { getApiBase } from '../../../shared/api/apiBase'
import { isDemoMode } from '../../../mocks/demoState'
import * as XLSX from 'xlsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimes,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'

import OrdersSummaryCards from '../components/OrdersSummaryCards'
import OrdersStatusTabs from '../components/OrdersStatusTabs'
import OrdersToolbar from '../components/OrdersToolbar'
import OrdersTable from '../components/OrdersTable'
import OrderDetailDrawer from '../components/OrderDetailDrawer'
import { getOrderQueryParams, getSessionUser } from '../../../shared/auth/permissions'

import { adminOrdersApi } from '../api/adminOrdersApi.js'
import {
  normalizeAdminOrder,
  normalizeAdminOrderList,
  normalizeAdminOrderDetail,
  mapAdminOrderError,
  validateAdminAction,
  getActionMethod,
} from '../models/adminOrderModel.js'
import CancelOrderModal from '../components/CancelOrderModal.jsx'

const isPaidStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  return normalized === 'paid' || normalized === 'lunas'
}

const normalizeRealtimeOrder = (order) => {
  if (!order) return null
  return normalizeAdminOrder(order)
}

export default function Orders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const outletParam = searchParams.get('outlet')

  // Primary API Data States
  const [orders, setOrders] = useState([])
  const [outletOptions, setOutletOptions] = useState([{ value: 'all', label: 'All Outlets' }])
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState({})
  const [lastUpdated, setLastUpdated] = useState('')

  // Local/Interactive States (overrides mockup changes in-session)
  const [mockOverrides, setMockOverrides] = useState({})
  const [deletedMockIds, setDeletedMockIds] = useState(new Set())

  // Filter States
  const [filters, setFilters] = useState({
    outlet: outletParam || 'all',
    date: 'all',
    channel: 'all',
    paymentStatus: 'all',
    orderStatus: 'all',
    search: '',
  })
  const [activeTab, setActiveTab] = useState('all')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Selected Detail Drawer State
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(true)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [inFlightAction, setInFlightAction] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Modal States
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)

  // Fetch orders on mount or manual refresh
  useEffect(() => {
    loadOutletOptions()
    loadOrders()
  }, [])

  useEffect(() => {
    const onOrderRealtime = (event) => {
      const realtimeOrder = normalizeRealtimeOrder(event.detail?.order)
      if (realtimeOrder) {
        setOrders((prev) => {
          const exists = prev.some((order) => (order._id || order.id) === realtimeOrder.id)
          if (exists) {
            return prev.map((order) => {
              const orderId = order._id || order.id
              return orderId === realtimeOrder.id ? { ...order, ...realtimeOrder } : order
            })
          }
          return [realtimeOrder, ...prev]
        })
      }
      loadOrders()
    }
    const onPaymentRealtime = (event) => {
      const payment = event.detail?.payment
      const realtimeOrder = normalizeRealtimeOrder(event.detail?.order)
      if (realtimeOrder) {
        setOrders((prev) => prev.map((order) => {
          const orderId = order._id || order.id
          return orderId === realtimeOrder.id ? { ...order, ...realtimeOrder } : order
        }))
      } else if (payment?.orderId || payment?.order_id) {
        const orderId = payment.orderId || payment.order_id
        const nextPaymentStatus = payment.status || payment.paymentStatus || payment.payment_status
        setOrders((prev) => prev.map((order) => {
          const currentId = order._id || order.id
          return currentId === orderId ? { ...order, paymentStatus: nextPaymentStatus } : order
        }))
      }
      loadOrders()
    }
    window.addEventListener('order:created', onOrderRealtime)
    window.addEventListener('order:paid', onOrderRealtime)
    window.addEventListener('order:updated', onOrderRealtime)
    window.addEventListener('payment:paid', onPaymentRealtime)
    window.addEventListener('payment:updated', onPaymentRealtime)
    return () => {
      window.removeEventListener('order:created', onOrderRealtime)
      window.removeEventListener('order:paid', onOrderRealtime)
      window.removeEventListener('order:updated', onOrderRealtime)
      window.removeEventListener('payment:paid', onPaymentRealtime)
      window.removeEventListener('payment:updated', onPaymentRealtime)
    }
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const payload = await adminOrdersApi.getAdminOrders(getOrderQueryParams(getSessionUser()))
      const normalized = normalizeAdminOrderList(payload)
      setOrders(normalized.orders)
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadOutletOptions = async () => {
    try {
      const res = await api.get('/outlets', { params: { limit: 200 } })
      const rawOutlets = Array.isArray(res.data)
        ? res.data
        : res.data && Array.isArray(res.data.data)
          ? res.data.data
          : []

      const options = rawOutlets
        .map((outlet) => {
          const value = String(outlet.id || outlet._id || outlet.outletId || '')
          const label = outlet.name || outlet.outletName || outlet.label || outlet.city || value
          return value && label ? { value, label } : null
        })
        .filter(Boolean)

      const nextOptions = options.length > 1
        ? [{ value: 'all', label: 'All Outlets' }, ...options]
        : options

      setOutletOptions(nextOptions)

      if (nextOptions.length > 0) {
        setFilters((prev) => {
          const hasCurrentOutlet = nextOptions.some((option) => option.value === prev.outlet)
          if (hasCurrentOutlet) return prev
          return { ...prev, outlet: nextOptions[0].value }
        })
      }
    } catch (err) {
      console.error('Failed to load outlet filter options:', err)
    }
  }

  // Price & item calculation for database orders
  const calculateOrderPrice = (order, agent) => {
    if (!agent || !agent.salesForms) return null

    const salesForm = agent.salesForms.find((f) => f.name === order.formName)
    if (!salesForm || !salesForm.products || salesForm.products.length === 0)
      return null

    const formData = order.formData || {}
    const itemNameKey = Object.keys(formData).find(
      (k) =>
        k.toLowerCase().includes('item') && k.toLowerCase().includes('name')
    )
    const quantityKey = Object.keys(formData).find(
      (k) => k.toLowerCase() === 'quantity' || k.toLowerCase() === 'qty'
    )

    if (!itemNameKey || !quantityKey) return null

    const itemName = formData[itemNameKey]
    const quantity = parseInt(formData[quantityKey]) || 1

    const product = salesForm.products.find(
      (p) => p.name.toLowerCase() === itemName.toLowerCase()
    )

    if (!product) return null

    const unitPrice = product.price || 0
    const subtotal = unitPrice * quantity

    return {
      itemName: product.name,
      quantity,
      unitPrice,
      subtotal,
    }
  }

  // Master list combiner (database orders + mock orders)
  const masterOrdersList = useMemo(() => {
    const mockList = [
      {
        _id: 'order-1028',
        orderIdDisplay: 'ORD-1028',
        status: 'preparing',
        contactId: { name: 'Rina Pratiwi', phone: '0812-3456-7890' },
        outlet: 'Samarinda',
        channel: 'whatsapp',
        itemsCount: '2 items',
        itemsList: [
          {
            name: 'Sally Caramel',
            qty: 1,
            variant: 'Large, Less Ice, Normal Sugar',
            price: 26000,
          },
          {
            name: 'Kopi Susu Gula Aren',
            qty: 1,
            variant: 'Large, Normal Ice, Extra Aren',
            price: 14000,
          },
        ],
        total: 38000,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Paid',
        notes: 'Less ice ya, terima kasih!',
        createdAt: '2025-05-16T10:21:00Z',
        timeline: [
          { time: '16 May 2025, 10:21 AM', label: 'Order created' },
          { time: '16 May 2025, 10:22 AM', label: 'Payment received' },
          { time: '16 May 2025, 10:24 AM', label: 'Preparing' },
        ],
      },
      {
        _id: 'order-1027',
        orderIdDisplay: 'ORD-1027',
        status: 'new',
        contactId: { name: 'Dewi Lestari', phone: '0813-2545-6789' },
        outlet: 'Tenggarong',
        channel: 'telegram',
        itemsCount: '3 items',
        itemsList: [
          {
            name: 'Es Teh Lemon',
            qty: 2,
            variant: 'Medium, Normal Ice, Less Sugar',
            price: 15000,
          },
          {
            name: 'Kopi Susu Gula Aren',
            qty: 1,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 22000,
          },
        ],
        total: 52000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid',
        notes: '',
        createdAt: '2025-05-16T10:19:00Z',
        timeline: [
          { time: '16 May 2025, 10:19 AM', label: 'Order created' },
          { time: '16 May 2025, 10:20 AM', label: 'Payment received' },
        ],
      },
      {
        _id: 'order-1026',
        orderIdDisplay: 'ORD-1026',
        status: 'ready',
        contactId: { name: 'Andi Wijaya', phone: '0811-2233-4455' },
        outlet: 'Bontang',
        channel: 'whatsapp',
        itemsCount: '1 item',
        itemsList: [
          {
            name: 'Sally Caramel',
            qty: 1,
            variant: 'Large, Normal Ice, Normal Sugar',
            price: 24000,
          },
        ],
        total: 24000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Unpaid',
        notes: 'Tolong dibuat agak manis',
        createdAt: '2025-05-16T10:12:00Z',
        timeline: [{ time: '16 May 2025, 10:12 AM', label: 'Order created' }],
      },
      {
        _id: 'order-1025',
        orderIdDisplay: 'ORD-1025',
        status: 'preparing',
        contactId: { name: 'Siti Aminah', phone: '0812-9988-7766' },
        outlet: 'Samarinda',
        channel: 'website',
        itemsCount: '4 items',
        itemsList: [
          {
            name: 'Es Teh Lemon',
            qty: 2,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 15000,
          },
          {
            name: 'Sally Caramel',
            qty: 2,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 23000,
          },
        ],
        total: 76000,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Paid',
        notes: '',
        createdAt: '2025-05-16T10:08:00Z',
        timeline: [
          { time: '16 May 2025, 10:08 AM', label: 'Order created' },
          { time: '16 May 2025, 10:10 AM', label: 'Payment received' },
        ],
      },
      {
        _id: 'order-1024',
        orderIdDisplay: 'ORD-1024',
        status: 'completed',
        contactId: { name: 'Budi Santoso', phone: '0852-6677-8899' },
        outlet: 'Balikpapan',
        channel: 'whatsapp',
        itemsCount: '2 items',
        itemsList: [
          {
            name: 'Es Teh Lemon',
            qty: 1,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 15000,
          },
          {
            name: 'Kopi Susu Gula Aren',
            qty: 1,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 16000,
          },
        ],
        total: 31000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid',
        notes: '',
        createdAt: '2025-05-16T09:58:00Z',
        timeline: [
          { time: '16 May 2025, 09:58 AM', label: 'Order created' },
          { time: '16 May 2025, 10:00 AM', label: 'Payment received' },
          { time: '16 May 2025, 10:05 AM', label: 'Preparing' },
          { time: '16 May 2025, 10:10 AM', label: 'Completed' },
        ],
      },
      {
        _id: 'order-1023',
        orderIdDisplay: 'ORD-1023',
        status: 'completed',
        contactId: { name: 'Nina Marlina', phone: '0813-5566-7788' },
        outlet: 'Tenggarong',
        channel: 'telegram',
        itemsCount: '1 item',
        itemsList: [
          {
            name: 'Kopi Susu Gula Aren',
            qty: 1,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 18000,
          },
        ],
        total: 18000,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Paid',
        notes: '',
        createdAt: '2025-05-16T09:45:00Z',
        timeline: [
          { time: '16 May 2025, 09:45 AM', label: 'Order created' },
          { time: '16 May 2025, 09:46 AM', label: 'Payment received' },
          { time: '16 May 2025, 09:50 AM', label: 'Preparing' },
          { time: '16 May 2025, 10:02 AM', label: 'Completed' },
        ],
      },
      {
        _id: 'order-1022',
        orderIdDisplay: 'ORD-1022',
        status: 'cancelled',
        contactId: { name: 'Fajar Rahman', phone: '0821-4777-6655' },
        outlet: 'Bontang',
        channel: 'manual',
        itemsCount: '2 items',
        itemsList: [
          {
            name: 'Es Teh',
            qty: 2,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 12000,
          },
          {
            name: 'Lemon Tea',
            qty: 1,
            variant: 'Medium, Normal Ice, Normal Sugar',
            price: 5000,
          },
        ],
        total: 29000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Unpaid',
        notes: 'Dibatalkan oleh pelanggan',
        createdAt: '2025-05-16T09:32:00Z',
        timeline: [
          { time: '16 May 2025, 09:32 AM', label: 'Order created' },
          { time: '16 May 2025, 09:35 AM', label: 'Cancelled' },
        ],
      },
    ]

    // Only use mock items if in demo mode
    const activeMocks = isDemoMode()
      ? mockList.filter((m) => !deletedMockIds.has(m._id))
      : []

    // Map overrides onto mocks
    const overriddenMocks = activeMocks.map((m) => {
      if (mockOverrides[m._id]) {
        return { ...m, ...mockOverrides[m._id] }
      }
      return m
    })

    // Map API orders to standard shape
    return [...orders, ...overriddenMocks]
  }, [orders, mockOverrides, deletedMockIds])

  // Date Filter matching helper
  const isDateMatched = (dateStr, dateFilter) => {
    if (dateFilter === 'all') return true
    const orderDate = new Date(dateStr)
    const now = new Date()

    // Determine if it is a mock order (from May 2025)
    const isMockOrder =
      orderDate.getFullYear() === 2025 && orderDate.getMonth() === 4

    if (dateFilter === 'today') {
      if (isMockOrder) {
        return orderDate.getDate() === 16
      }
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      )
    }

    if (dateFilter === 'yesterday') {
      if (isMockOrder) {
        return orderDate.getDate() === 15
      }
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return (
        orderDate.getFullYear() === yesterday.getFullYear() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getDate() === yesterday.getDate()
      )
    }

    if (dateFilter === '7days') {
      if (isMockOrder) {
        // Mock "today" is May 16, 2025. Last 7 days means May 10 to May 16, 2025.
        return orderDate.getDate() >= 10 && orderDate.getDate() <= 16
      }
      const diffTime = Math.abs(now - orderDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    }

    return true
  }

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return masterOrdersList.filter((o) => {
      // 1. Outlet Filter
      if (filters.outlet !== 'all') {
        const outletQuery = filters.outlet.toLowerCase()
        const outletLabel = (outletOptions.find((option) => option.value === filters.outlet)?.label || '').toLowerCase()
        const orderOutlet = (o.outlet || '').toLowerCase()
        const orderOutletId = String(o.outletId || '').toLowerCase()
        if (
          orderOutletId !== outletQuery &&
          !orderOutlet.includes(outletQuery) &&
          !outletQuery.includes(orderOutlet) &&
          !orderOutlet.includes(outletLabel) &&
          !outletLabel.includes(orderOutlet)
        ) {
          return false
        }
      }

      // 2. Date Filter
      if (!isDateMatched(o.createdAt, filters.date)) return false

      // 3. Channel Filter
      if (filters.channel !== 'all' && o.channel !== filters.channel)
        return false

      // 4. Payment Status Filter
      if (
        filters.paymentStatus !== 'all' &&
        o.paymentStatus !== filters.paymentStatus
      )
        return false

      // 5. Order Status Dropdown Filter
      if (filters.orderStatus !== 'all' && o.status !== filters.orderStatus)
        return false

      // 6. Tabs status filter (upper layer)
      if (activeTab !== 'all') {
        if (activeTab === 'pending_payment') {
          if (o.paymentStatus !== 'Unpaid' || o.status === 'cancelled')
            return false
        } else if (activeTab === 'accepted') {
          // accepted in mockup corresponds to processed
          if (o.status !== 'processed') return false
        } else {
          if (o.status !== activeTab) return false
        }
      }

      // 7. Search keyword
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase()
        const name = (o.contactId?.name || '').toLowerCase()
        const phone = (o.contactId?.phone || '').toLowerCase()
        const displayId = (o.orderIdDisplay || '').toLowerCase()
        if (
          !name.includes(query) &&
          !phone.includes(query) &&
          !displayId.includes(query)
        )
          return false
      }

      return true
    })
  }, [masterOrdersList, filters, activeTab, outletOptions])

  // Handle current page resets on filter modifications
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, activeTab])

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredOrders.slice(startIndex, startIndex + pageSize)
  }, [filteredOrders, currentPage, pageSize])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / pageSize) || 1
  }, [filteredOrders, pageSize])

  // Get currently selected order object details
  const currentSelectedOrder = useMemo(() => {
    if (selectedOrderDetail && (selectedOrderDetail._id === selectedOrderId || selectedOrderDetail.id === selectedOrderId)) {
      return selectedOrderDetail
    }
    if (!selectedOrderId) {
      // Auto select the first item on load (to mimic mockup screen)
      return filteredOrders[0] || null
    }
    return (
      masterOrdersList.find((o) => o._id === selectedOrderId) ||
      filteredOrders[0] ||
      null
    )
  }, [selectedOrderId, selectedOrderDetail, filteredOrders, masterOrdersList])

  // Status Change Logic (Quick Actions & Dropdown)
  const loadOrderDetail = async (orderId) => {
    if (!orderId) {
      setSelectedOrderDetail(null)
      return
    }
    if (String(orderId).startsWith('order-')) {
      const mockOrder = masterOrdersList.find((o) => o._id === orderId)
      setSelectedOrderDetail(mockOrder || null)
      return
    }
    setLoadingDetail(true)
    try {
      const payload = await adminOrdersApi.getAdminOrderDetail(orderId)
      const normalized = normalizeAdminOrderDetail(payload)
      setSelectedOrderDetail(normalized)
    } catch (err) {
      console.error('Failed to load order detail:', err)
      const listOrder = orders.find((o) => o.id === orderId || o._id === orderId)
      if (listOrder) {
        setSelectedOrderDetail(listOrder)
      }
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    loadOrderDetail(selectedOrderId)
  }, [selectedOrderId])

  const submitAction = async (action, reason = '') => {
    if (!currentSelectedOrder) return

    const orderId = currentSelectedOrder._id
    const isMock = orderId.startsWith('order-')

    if (isMock) {
      setInFlightAction(action)
      try {
        const statusMap = {
          mark_ready: 'ready',
          ready: 'ready',
          mark_completed: 'completed',
          complete: 'completed',
          cancel_order: 'cancelled',
          cancel: 'cancelled',
        }
        const nextStatus = statusMap[action] || 'new'
        const updatedTimeline = [...(currentSelectedOrder.timeline || [])]
        const label = action.replace('_', ' ')
        updatedTimeline.push({
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          label: `${label} (updated)`,
        })

        setMockOverrides((prev) => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            status: nextStatus,
            paymentStatus: nextStatus === 'cancelled' ? 'Unpaid' : (prev[orderId]?.paymentStatus || currentSelectedOrder.paymentStatus),
            notes: nextStatus === 'cancelled' ? (reason || 'Dibatalkan oleh admin') : (prev[orderId]?.notes || currentSelectedOrder.notes),
            timeline: updatedTimeline,
            allowedActions: [],
          },
        }))

        setSelectedOrderDetail((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: nextStatus,
            paymentStatus: nextStatus === 'cancelled' ? 'Unpaid' : prev.paymentStatus,
            notes: nextStatus === 'cancelled' ? (reason || 'Dibatalkan oleh admin') : prev.notes,
            timeline: updatedTimeline,
            allowedActions: [],
          }
        })
      } finally {
        setInFlightAction('')
        setCancelModalOrder(null)
      }
      return
    }

    const validation = validateAdminAction({ action, reason, inFlightAction })
    if (!validation.ok) {
      alert(validation.message)
      return
    }

    const methodName = getActionMethod(action)
    setInFlightAction(action)
    try {
      const body = action === 'cancel_order' || action === 'cancel' ? { reason: String(reason).trim() } : undefined
      const payload = await adminOrdersApi[methodName](orderId, body)
      const updatedOrder = normalizeAdminOrderDetail(payload)
      if (updatedOrder) {
        setSelectedOrderDetail(updatedOrder)
        setOrders((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
      }
      await loadOrders()
      if (orderId) {
        await loadOrderDetail(orderId)
      }
      setCancelModalOrder(null)
    } catch (err) {
      const code = err?.code || err?.response?.data?.error?.code || err?.status || err?.response?.status || ''
      const ORDER_ERROR_MESSAGES = {
        ORDER_INVALID_TRANSITION: 'Status order sudah berubah. Silakan refresh data.',
        ORDER_UNPAID: 'Order belum dibayar, belum bisa diproses.',
        ORDER_PAYMENT_NOT_PAID: 'Order belum dibayar, belum bisa diproses.',
        FORBIDDEN: 'Kamu tidak punya akses untuk action ini.',
        RATE_LIMITED: 'Terlalu banyak percobaan. Coba lagi sebentar.',
        INTERNAL_ERROR: 'Terjadi gangguan. Silakan coba lagi.',
      }
      const mappedMsg = ORDER_ERROR_MESSAGES[code] || ORDER_ERROR_MESSAGES[err.message] || mapAdminOrderError(err)
      alert(mappedMsg)
    } finally {
      setInFlightAction('')
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    const statusToAction = {
      ready: 'mark_ready',
      completed: 'mark_completed',
      cancelled: 'cancel_order',
    }
    const action = statusToAction[newStatus]
    if (action) {
      if (action === 'cancel_order') {
        openCancelModal(currentSelectedOrder)
      } else {
        await submitAction(action)
      }
    }
  }

  const openCancelModal = (order) => {
    setCancelModalOrder(order)
  }

  // Delete Order
  const handleDeleteOrder = async (orderId, orderName) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus order dari ${orderName}?`
      )
    ) {
      return
    }

    const isMock = orderId.startsWith('order-')
    if (isMock) {
      setDeletedMockIds((prev) => {
        const next = new Set(prev)
        next.add(orderId)
        return next
      })
      if (selectedOrderId === orderId) {
        setSelectedOrderId(null)
      }
    } else {
      try {
        await api.delete(`/orders/${orderId}`)
        setOrders((prev) => prev.filter((o) => o._id !== orderId))
        if (selectedOrderId === orderId) {
          setSelectedOrderId(null)
        }
      } catch (err) {
        alert(
          'Gagal menghapus order: ' + (err.response?.data?.error || err.message)
        )
      }
    }
  }

  // Export to Excel
  const handleExportToExcel = () => {
    if (filteredOrders.length === 0) {
      alert('Tidak ada data order untuk diekspor.')
      return
    }

    const data = filteredOrders.map((o) => ({
      'Order ID': o.orderIdDisplay,
      'Customer Name': o.contactId?.name,
      Phone: o.contactId?.phone,
      Outlet: o.outlet,
      Channel: o.channel,
      Items: o.itemsCount,
      'Total Amount': o.total,
      'Payment Status': o.paymentStatus,
      'Order Status': o.status,
      Notes: o.notes,
      'Created At': new Date(o.createdAt).toLocaleString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
    XLSX.writeFile(
      workbook,
      `orders_report_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  }

  // Open Chat navigation helper
  const handleOpenChat = (order) => {
    if (order.chatId) {
      navigate('/app', { state: { selectChatId: order.chatId } })
    } else {
      navigate('/app')
    }
  }

  // Resend Payment Link — kirim ulang notifikasi pembayaran ke customer via WA
  const handleResendPayment = async (order) => {
    if (!order?._id || order._id.startsWith('order-')) {
      alert('Resend Link hanya tersedia untuk order nyata.')
      return
    }
    try {
      await api.patch(`/orders/${order._id}/status`, { status: order.status })
      alert(
        `Notifikasi berhasil dikirim ulang ke ${order.contactId?.name || 'customer'}${
          order.contactId?.phone ? ` (${order.contactId.phone})` : ''
        }`
      )
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err.message
      alert(`Gagal mengirim ulang notifikasi: ${serverMsg}`)
    }
  }

  // View image proof in modal
  const handleViewImage = (url) => {
    const fullUrl = url.startsWith('http')
      ? url
      : `${getApiBase()}${url}`
    setPreviewImageUrl(fullUrl)
  }

  return (
    <div className='flex flex-1 overflow-hidden bg-[var(--app-background)] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)]'>
      {/* LEFT PORTION: Orders Main Content Dashboard */}
      <div
        className={`flex-1 flex flex-col min-w-0 p-4 pt-3 overflow-hidden transition-[padding] duration-200 motion-reduce:transition-none ${isOrderDetailOpen ? 'md:pr-[416px]' : 'md:pr-4'}`}
      >
        {/* Toolbar Header (Title, Subtitle, Actions, Filters) */}
        <OrdersToolbar
          filters={filters}
          setFilters={setFilters}
          outletOptions={outletOptions}
          onRefresh={loadOrders}
          onExport={handleExportToExcel}
          lastUpdated={lastUpdated}
          selectedOrder={currentSelectedOrder}
          isOrderDetailOpen={isOrderDetailOpen}
          onShowOrderDetail={() => setIsOrderDetailOpen(true)}
        />

        {/* Dynamic Summary Cards */}
        <OrdersSummaryCards orders={masterOrdersList} />

        {/* Tabs Row */}
        <OrdersStatusTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orders={masterOrdersList}
        />

        {/* Orders Data Table */}
        <OrdersTable
          orders={paginatedOrders}
          selectedOrder={currentSelectedOrder}
          onSelectOrder={(order) => {
            setSelectedOrderId(order._id)
            setIsOrderDetailOpen(true)
          }}
          onDeleteOrder={handleDeleteOrder}
          onViewImage={handleViewImage}
        />

        {/* Table Pagination Footer */}
        <div className='bg-[var(--surface-primary)] border-x border-b border-[var(--border-subtle)] rounded-b-xl px-6 py-3 flex items-center justify-between shrink-0 select-none text-xs text-[var(--text-muted)] font-semibold mt-[-1px]'>
          <div>
            Showing{' '}
            {filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}{' '}
            to {Math.min(currentPage * pageSize, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </div>

          <div className='flex items-center gap-4'>
            {/* Page Buttons */}
            <div className='flex items-center gap-1.5'>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className='w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center hover:bg-[var(--surface-secondary)] transition text-[var(--text-secondary)] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface-primary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1
                const isActive = pageNum === currentPage
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition text-xs font-bold border focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] ${
                      isActive
                        ? 'bg-[var(--brand-50)] border-[var(--brand-500)] text-[var(--brand-600)]'
                        : 'bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className='w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center hover:bg-[var(--surface-secondary)] transition text-[var(--text-secondary)] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface-primary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>

            {/* Page Size Select */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value))
                setCurrentPage(1)
              }}
              className='bg-[var(--surface-primary)] border border-[var(--border-subtle)] py-1.5 px-3 rounded-lg text-xs font-semibold text-[var(--text-secondary)] cursor-pointer focus:outline-none focus-visible:border-[var(--brand-500)] focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* RIGHT PORTION: Dynamic Order Detail Sidebar Drawer */}
      {isOrderDetailOpen && (
        <OrderDetailDrawer
          order={currentSelectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onHide={() => setIsOrderDetailOpen(false)}
          inFlightAction={inFlightAction}
          onSubmitAction={submitAction}
          onCancelClick={() => openCancelModal(currentSelectedOrder)}
          onOpenChat={() => handleOpenChat(currentSelectedOrder)}
          onResendPayment={() => handleResendPayment(currentSelectedOrder)}
        />
      )}

      {/* Cancel Order Modal Dialogue */}
      <CancelOrderModal
        isOpen={Boolean(cancelModalOrder)}
        order={cancelModalOrder}
        isSubmitting={inFlightAction === 'cancel_order' || inFlightAction === 'cancel'}
        onClose={() => setCancelModalOrder(null)}
        onConfirm={(reason) => submitAction(cancelModalOrder.allowedActions?.includes('cancel_order') ? 'cancel_order' : 'cancel', reason)}
      />

      {/* Image Proof Preview Modal Dialogue */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-4 cursor-pointer'
        >
          <img
            src={previewImageUrl}
            alt='Payment Proof Fullscreen'
            className='max-w-[90%] max-h-[85vh] object-contain rounded-xl shadow-2xl border-2 border-white/10'
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImageUrl(null)}
            className='absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition duration-150 cursor-pointer'
            title='Close image'
          >
            <FontAwesomeIcon icon={faTimes} className='text-lg' />
          </button>
        </div>
      )}
    </div>
  )
}
