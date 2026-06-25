import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../../shared/api/httpClient'
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

export default function Orders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const outletParam = searchParams.get('outlet')

  // Primary API Data States
  const [orders, setOrders] = useState([])
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

  // Modal States
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [submittingCancel, setSubmittingCancel] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)

  // Fetch orders on mount or manual refresh
  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const onOrderCreated = () => loadOrders()
    window.addEventListener('order:created', onOrderCreated)
    return () => window.removeEventListener('order:created', onOrderCreated)
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      const rawOrders = Array.isArray(res.data)
        ? res.data
        : res.data && Array.isArray(res.data.data)
          ? res.data.data
          : []

      const normalizedOrders = rawOrders.map((order) => ({
        ...order,
        _id: order._id || order.id,
        id: order.id || order._id,
      }))

      setOrders(normalizedOrders)

      // Fetch agents for product/price parsing
      const agentIds = [
        ...new Set(normalizedOrders.map((o) => o.agentId).filter(Boolean)),
      ]
      const agentMap = {}
      for (const agentId of agentIds) {
        try {
          const agentRes = await api.get(`/agents/${agentId}`)
          agentMap[agentId] = agentRes.data
        } catch (err) {
          console.error('Failed to load agent:', agentId)
        }
      }
      setAgents(agentMap)
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
    const apiList = orders.map((order) => {
      const agent = agents[order.agentId]
      const priceInfo = calculateOrderPrice(order, agent)

      // Legacy formData parsing (fallback for old orders)
      const entries = Object.entries(order.formData || {})
      const outletEntry = entries.find(([key]) =>
        key.toLowerCase().includes('outlet')
      )
      const outletFromFormData = outletEntry ? outletEntry[1] : 'Samarinda'

      const channelEntry = entries.find(
        ([key]) =>
          key.toLowerCase().includes('channel') ||
          key.toLowerCase().includes('platform')
      )
      const channelFromFormData = channelEntry
        ? channelEntry[1].toLowerCase()
        : '' // do NOT default to 'whatsapp' — let source field take priority

      const payStatusEntry = entries.find(
        ([key]) =>
          key.toLowerCase().includes('payment') ||
          key.toLowerCase().includes('bayar')
      )
      let paymentStatusFromFormData = payStatusEntry
        ? payStatusEntry[1]
        : order.paymentProofUrl
          ? 'Paid'
          : 'Unpaid'
      if (
        paymentStatusFromFormData.toLowerCase().includes('paid') ||
        paymentStatusFromFormData.toLowerCase().includes('lunas')
      ) {
        paymentStatusFromFormData = 'Paid'
      } else {
        paymentStatusFromFormData = 'Unpaid'
      }

      let itemsFromFormData = []
      if (priceInfo) {
        itemsFromFormData.push({
          name: priceInfo.itemName,
          qty: priceInfo.quantity,
          variant: 'Default Variant',
          price: priceInfo.unitPrice,
        })
      } else {
        const itemNameEntry = entries.find(
          ([key]) =>
            key.toLowerCase().includes('item') &&
            key.toLowerCase().includes('name')
        )
        const qtyEntry = entries.find(
          ([key]) =>
            key.toLowerCase() === 'qty' || key.toLowerCase() === 'quantity'
        )
        if (itemNameEntry) {
          itemsFromFormData.push({
            name: itemNameEntry[1],
            qty: qtyEntry ? parseInt(qtyEntry[1]) || 1 : 1,
            variant: 'Standard',
            price: 15000,
          })
        }
      }

      const subtotalFromFormData = priceInfo
        ? priceInfo.subtotal
        : itemsFromFormData[0]?.price * itemsFromFormData[0]?.qty || 0
      const orderIdDisplay = order.orderNumber
        || (order._id.startsWith('order-')
          ? `SLTH-${order._id.replace('order-', '')}`
          : order._id)

      const timeline = [
        {
          time: new Date(order.createdAt).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          label: 'Order created',
        },
      ]
      if (
        order.status === 'processed' ||
        order.status === 'preparing' ||
        order.status === 'ready' ||
        order.status === 'completed'
      ) {
        timeline.push({ time: new Date().toLocaleString(), label: 'Preparing' })
      }
      if (order.status === 'ready' || order.status === 'completed') {
        timeline.push({
          time: new Date().toLocaleString(),
          label: 'Ready to Process',
        })
      }
      if (order.status === 'completed') {
        timeline.push({ time: new Date().toLocaleString(), label: 'Completed' })
      }
      if (order.status === 'cancelled') {
        timeline.push({ time: new Date().toLocaleString(), label: 'Cancelled' })
      }

      // --- Resolve outlet name: prefer structured outlet object, then formData fallback ---
      const outletName =
        (order.outlet && typeof order.outlet === 'object'
          ? order.outlet.name
          : null) ||
        (order.outlet && typeof order.outlet === 'string'
          ? order.outlet
          : null) ||
        outletFromFormData

      // --- Resolve payment status: prefer server paymentStatus field, then formData fallback ---
      let paymentStatusResolved = order.paymentStatus
        ? order.paymentStatus.toLowerCase().includes('paid') ||
          order.paymentStatus.toLowerCase().includes('lunas')
          ? 'Paid'
          : 'Unpaid'
        : paymentStatusFromFormData

      // --- Resolve items: prefer order.items from order_items table, then formData fallback ---
      let itemsListResolved = itemsFromFormData
      if (Array.isArray(order.items) && order.items.length > 0) {
        itemsListResolved = order.items.map((item) => ({
          name: item.name || item.productNameSnapshot || 'Item',
          qty: item.quantity || 1,
          variant: item.metadata?.variant || '',
          price: item.unitPrice || 0,
        }))
      }

      // --- Resolve total: prefer server totalAmount, then subtotal from items, then fallback ---
      const totalResolved =
        order.totalAmount ||
        order.totals?.total ||
        (itemsListResolved.length > 0
          ? itemsListResolved.reduce((sum, i) => sum + i.price * i.qty, 0)
          : subtotalFromFormData || 25000)

      // --- Resolve channel: prefer channelSnapshot → source field → formData fallback ---
      let channelResolved =
        (order.channelSnapshot || '').toLowerCase() ||
        (order.source || '').toLowerCase() ||
        channelFromFormData ||
        'unknown'

      // --- Resolve customer name: prefer contactId object from server, then customerNameSnapshot ---
      const customerName =
        (order.contactId && typeof order.contactId === 'object'
          ? order.contactId.name
          : null) ||
        order.customerNameSnapshot ||
        'Unknown User'
      
      let customerPhone =
        (order.contactId && typeof order.contactId === 'object'
          ? (order.contactId.phone || order.contactId.handle || order.contactId.external_id || order.contactId.externalId)
          : null) ||
        order.customerPhoneSnapshot ||
        ''

      // --- Smart inference for WhatsApp ---
      // If we have a pure numeric ID starting with 62 (Indonesian country code), it is almost certainly WhatsApp
      if (/^\d{10,15}$/.test(customerPhone) && customerPhone.startsWith('62')) {
        channelResolved = 'whatsapp'
      } else if (order.chatId) {
        if (order.chatId.includes('@s.whatsapp.net') || order.chatId.includes('@g.us')) {
          channelResolved = 'whatsapp'
          if (!customerPhone) {
            customerPhone = order.chatId.split('@')[0]
          }
        }
      }

      return {
        _id: order._id,
        orderIdDisplay,
        status: order.status,
        contactId: {
          id: order.contactId && typeof order.contactId === 'object' ? order.contactId.id : (typeof order.contactId === 'string' ? order.contactId : null),
          name: customerName,
          phone: customerPhone,
        },
        customerNameSnapshot: order.customerNameSnapshot || null,
        customerPhoneSnapshot: order.customerPhoneSnapshot || null,
        chatId: order.chatId || null,
        outlet: outletName,
        channel: channelResolved,
        channelSnapshot: order.channelSnapshot || null,
        source: order.source || null,
        itemsCount:
          itemsListResolved.length > 0
            ? `${itemsListResolved.length} item${itemsListResolved.length > 1 ? 's' : ''}`
            : '0 items',
        itemsList: itemsListResolved,
        total: totalResolved,
        paymentMethod: order.paymentMethod || null,
        paymentStatus: paymentStatusResolved,
        notes: order.notes || '',
        createdAt: order.createdAt,
        timeline,
        paymentProofUrl: order.paymentProofUrl,
      }
    })

    return [...apiList, ...overriddenMocks]
  }, [orders, agents, mockOverrides, deletedMockIds])

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
        const orderOutlet = (o.outlet || '').toLowerCase()
        if (!orderOutlet.includes(outletQuery) && !outletQuery.includes(orderOutlet)) {
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
  }, [masterOrdersList, filters, activeTab])

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
    if (!selectedOrderId) {
      // Auto select the first item on load (to mimic mockup screen)
      return filteredOrders[0] || null
    }
    return (
      masterOrdersList.find((o) => o._id === selectedOrderId) ||
      filteredOrders[0] ||
      null
    )
  }, [selectedOrderId, filteredOrders, masterOrdersList])

  // Status Change Logic (Quick Actions & Dropdown)
  const handleStatusChange = async (orderId, newStatus) => {
    // Check if mock order
    const isMock = orderId.startsWith('order-')
    if (isMock) {
      // Update local override
      const order = masterOrdersList.find((o) => o._id === orderId)
      if (order) {
        const updatedTimeline = [...(order.timeline || [])]
        const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
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
            status: newStatus,
            timeline: updatedTimeline,
          },
        }))
      }
    } else {
      // Real API update — use PATCH /orders/:id/status for proper state machine + WA notification
      try {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus })
        // Update local state optimistically
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        )
      } catch (err) {
        const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err.message
        alert(`Gagal memperbarui status order: ${serverMsg}`)
      }
    }
  }

  // Open Cancel Modal
  const openCancelModal = (order) => {
    setCancelModalOrder(order)
    setCancelReason('')
  }

  // Handle Cancel Order Submission
  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      alert('Mohon masukkan alasan pembatalan.')
      return
    }

    const orderId = cancelModalOrder._id
    const isMock = orderId.startsWith('order-')

    setSubmittingCancel(true)
    try {
      if (isMock) {
        const order = masterOrdersList.find((o) => o._id === orderId)
        const updatedTimeline = [...(order.timeline || [])]
        updatedTimeline.push({
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          label: `Cancelled: ${cancelReason}`,
        })

        setMockOverrides((prev) => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            status: 'cancelled',
            paymentStatus: 'Unpaid',
            notes: cancelReason,
            timeline: updatedTimeline,
          },
        }))
        setCancelModalOrder(null)
      } else {
        await api.put(`/orders/${orderId}/cancel`, { reason: cancelReason })
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? { ...o, status: 'cancelled', notes: cancelReason }
              : o
          )
        )
        setCancelModalOrder(null)
      }
    } catch (err) {
      alert(
        'Gagal membatalkan order: ' + (err.response?.data?.error || err.message)
      )
    } finally {
      setSubmittingCancel(false)
    }
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
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`
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
          onStatusChange={(status) =>
            handleStatusChange(currentSelectedOrder._id, status)
          }
          onCancelClick={() => openCancelModal(currentSelectedOrder)}
          onOpenChat={() => handleOpenChat(currentSelectedOrder)}
          onResendPayment={() => handleResendPayment(currentSelectedOrder)}
        />
      )}

      {/* Cancel Order Modal Dialogue */}
      {cancelModalOrder && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-200'>
          <div className='bg-[var(--surface-primary)] rounded-2xl p-6 max-w-md w-full shadow-[0_16px_40px_rgba(17,24,46,0.14)] border border-[var(--border-subtle)] flex flex-col gap-4.5 animate-in fade-in zoom-in-95 duration-150'>
            <div className='flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]'>
              <h3 className='text-base font-bold text-[var(--text-primary)]'>
                Batalkan Pesanan
              </h3>
              <button
                onClick={() => setCancelModalOrder(null)}
                className='text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-1 rounded-full hover:bg-[var(--surface-secondary)] transition focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className='text-xs text-[var(--text-secondary)] flex flex-col gap-1.5'>
              <span>
                Pesanan dari:{' '}
                <strong className='text-[var(--text-primary)] font-extrabold'>
                  {cancelModalOrder.contactId?.name}
                </strong>
              </span>
              <span>
                Order ID:{' '}
                <strong className='text-[var(--text-primary)] font-extrabold'>
                  {cancelModalOrder.orderIdDisplay}
                </strong>
              </span>
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-xs font-bold text-[var(--text-secondary)]'>
                Alasan Pembatalan:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder='Contoh: Pembayaran tidak valid, stok habis, outlet tutup...'
                rows={4}
                className='w-full border border-[var(--border-subtle)] rounded-xl p-3 text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_var(--focus-brand-ring)] bg-[var(--surface-secondary)]'
              />
            </div>

            <div className='flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]'>
              <button
                onClick={() => setCancelModalOrder(null)}
                disabled={submittingCancel}
                className='px-4 py-2 border border-[var(--border-subtle)] text-xs font-semibold rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                Batal
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={submittingCancel}
                className='px-4 py-2 bg-[var(--danger-50)] text-[var(--danger-600)] border border-[var(--danger-100)] hover:border-[var(--danger-500)] transition duration-150 text-xs font-bold rounded-lg disabled:opacity-50 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              >
                {submittingCancel ? 'Membatalkan...' : 'Batalkan Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}

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
