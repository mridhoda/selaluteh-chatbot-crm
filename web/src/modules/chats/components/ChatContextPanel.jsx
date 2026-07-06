import React, { useState, useEffect, useRef } from 'react'
import api from '../../../shared/api/httpClient'
import { isDemoMode } from '../../../mocks/demoState'
import {
  Copy,
  ExternalLink,
  Send,
  AlertCircle,
  Ticket,
  ShoppingBag,
  Filter,
  ChevronDown,
  Plus,
  User,
  UserPlus,
  Bot,
  Shield,
  CheckCircle,
  Clock,
  Calendar,
  LayoutGrid,
  ShoppingCart,
  Bookmark,
  Search,
  ArrowRight,
  X,
  Wallet,
  CheckCircle2,
  MinusCircle,
  MoreHorizontal,
  Trash2,
  Edit2,
  Coffee,
  Tag,
  Info,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  Sparkles,
  AlertTriangle,
  History,
  FileText,
  RefreshCcw,
} from 'lucide-react'
import { useToast } from '../../../shared/components/feedback/Toast'

// ─── small helpers ─────────────────────────────────────────────────────────

function Tab({ label, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`chat-prism-context-tab ${active ? 'active' : ''}`}
    >
      {icon}
      {label}
    </button>
  )
}

function Field({ label, value, copyText, onCopy }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            fontSize: 13,
            color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          {value || '—'}
        </span>
        {copyText && value && (
          <button
            onClick={onCopy}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={'Copy ' + label}
          >
            <Copy size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        margin: '14px 0',
      }}
    />
  )
}

// ── mock fallback data (used when live API returns empty) ─────────────────
const FALLBACK_OUTLETS = [
  { id: 'ST_SMG', name: 'Selalu Teh - Semarang City', location: 'Semarang, Central Java', status: 'Active', initials: 'ST' },
  { id: 'ST_BDO', name: 'Selalu Teh - Bandung', location: 'Bandung, West Java', status: 'Active', initials: 'SB' },
]
const FALLBACK_ORDERS = [
  { id: 'ORD-1028', date: 'May 7, 2025', time: '10:15 AM', amount: 'Rp 111.000', payment: 'Paid', status: 'Completed' },
  { id: 'ORD-1027', date: 'May 7, 2025', time: '09:15 AM', amount: 'Rp 91.500', payment: 'Pending', status: 'Preparing' },
]
const FALLBACK_PRODUCTS = []
const FALLBACK_CART = []

function useLiveOrFallback(live, fallback) {
  return (Array.isArray(live) && live.length > 0) ? live : fallback
}

const formatRupiah = (value = 0) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`

const asNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9,-]/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const getItemQty = (item = {}) => asNumber(item.quantity ?? item.qty ?? 1) || 1

const getItemUnitPrice = (item = {}) => asNumber(
  item.unitPrice ??
  item.effectivePrice ??
  item.price ??
  item.basePrice ??
  item.base_price ??
  0
)

const getItemSubtotal = (item = {}) => {
  const explicit = asNumber(item.subtotal ?? item.subtotalAmount ?? item.line_total_minor ?? item.total)
  if (explicit > 0) return explicit
  return getItemUnitPrice(item) * getItemQty(item)
}

const buildCartSummary = (items = []) => {
  const list = Array.isArray(items) ? items : []
  const itemCount = list.reduce((sum, item) => sum + getItemQty(item), 0)
  const subtotal = list.reduce((sum, item) => sum + getItemSubtotal(item), 0)
  return {
    itemCount,
    subtotal,
    discount: 0,
    shipping: 0,
    vat: 0,
    total: subtotal,
  }
}

const normalizeText = (value = '') => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const getMessageText = (message = {}) => message.content || message.text || message.message || ''

const isInboundMessage = (message = {}) => {
  const role = message.senderType || message.role || message.sender || message.from
  return message.direction === 'inbound' || role === 'user' || role === 'customer'
}

function inferCartItemsFromConversation(messages = [], products = []) {
  if (!Array.isArray(messages) || !Array.isArray(products) || products.length === 0) return []
  const inboundText = messages.filter(isInboundMessage).map(getMessageText).join('\n')
  const normalizedConversation = normalizeText(inboundText)
  if (!normalizedConversation) return []

  return products
    .filter((product) => {
      const productName = normalizeText(product.name)
      return productName && normalizedConversation.includes(productName)
    })
    .map((product) => {
      const productName = normalizeText(product.name)
      let quantity = 1
      
      // Look for patterns like "3x product" or "3 product"
      const preMatch = normalizedConversation.match(new RegExp(`(\\d+)\\s*(?:x\\s*)?${productName.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')}`))
      if (preMatch && parseInt(preMatch[1]) > 0) {
        quantity = parseInt(preMatch[1])
      } else {
        // Look for patterns like "product 3x" or "product 3"
        const postMatch = normalizedConversation.match(new RegExp(`${productName.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')}\\s*(?:x\\s*)?(\\d+)`))
        if (postMatch && parseInt(postMatch[1]) > 0) {
          quantity = parseInt(postMatch[1])
        }
      }

      return {
        id: product.id || product._id,
        productId: product.id || product._id,
        name: product.name,
        unitPrice: asNumber(product.basePrice ?? product.base_price ?? product.price),
        quantity: quantity,
        subtotal: asNumber(product.basePrice ?? product.base_price ?? product.price) * quantity,
        inferred: true,
      }
    })
}

const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const PRODUCTS = []
const CART_ITEMS = []

// ─── tab panels ────────────────────────────────────────────────────────────

function ContactTab({ chat }) {
  const toast = useToast()
  const copy = (val) => {
    if (!val) return
    navigator.clipboard.writeText(String(val)).then(
      () => toast.success('Copied!'),
      () => toast.error('Copy failed')
    )
  }

  const tags = chat.tags || chat.contactTags || []
  const phone =
    chat.contactPhone || chat.contactHandle || chat.contactId || null
  const firstContact = chat.createdAt || chat.firstContactAt

  const formattedFirstContact = firstContact
    ? new Date(firstContact).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  return (
    <div className='chat-prism-info-sections'>
      <section className='chat-prism-profile-block'>
        <div className='chat-prism-profile-title-row'>
          <h2>{chat.contactName || 'Unknown'}</h2>
          <button
            onClick={() => copy(phone || chat.contactName)}
            title='Copy contact'
          >
            <Copy size={16} />
          </button>
        </div>
        <div className='chat-prism-profile-channel'>
          {chat.platform || 'Channel'} {phone ? `· ${phone}` : ''}
        </div>
        <button className='chat-prism-select-status'>
          <span>
            <Filter size={14} /> Select Pipeline Status
          </span>
          <ChevronDown size={14} />
        </button>
      </section>

      <InfoDivider />

      <InfoHeader title='Labels' action='Add Label' icon={<Plus size={12} />} />
      <p className='chat-prism-muted-line'>
        {tags.length ? tags.join(', ') : 'No labels yet'}
      </p>

      <InfoDivider />

      <AccordionMini title='Session History'>
        <p className='chat-prism-center-muted'>No sessions available</p>
      </AccordionMini>

      <InfoDivider />

      <div>
        <label className='chat-prism-section-label'>Handled By</label>
        <button className='chat-prism-assignee-card'>
          <span className='chat-prism-assignee-icon'>
            <User size={14} />
          </span>
          <strong>
            {chat.takenOverByName || chat.takenOverBy || 'Super Admin IT Core'}
          </strong>
          <ChevronDown size={14} />
        </button>
      </div>

      <InfoDivider />

      <InfoHeader
        title='Collaborators'
        action='Add Collaborator'
        icon={<UserPlus size={14} />}
      />
      <p className='chat-prism-muted-line'>No collaborators yet</p>

      <InfoDivider />

      <div>
        <label className='chat-prism-section-label'>Notes</label>
        <textarea className='chat-prism-notes' placeholder='Add a note...' />
      </div>

      <InfoDivider />

      <div>
        <label className='chat-prism-section-label'>AI Summary</label>
        <button className='chat-prism-summary-button'>
          Generate AI Summary
        </button>
      </div>

      <InfoDivider />

      <AccordionMini title='Additional Data'>
        <button className='chat-prism-outline-action'>
          Add New Additional Info
        </button>
      </AccordionMini>

      <InfoDivider />

      <div>
        <h4 className='chat-prism-section-label'>Conversation Details</h4>
        <DetailMini label='Assigned By' value='—' icon={<User size={12} />} />
        <DetailMini
          label='Handled By'
          value={
            chat.takenOverByName || chat.takenOverBy || 'Super Admin IT Core'
          }
          icon={<User size={12} />}
        />
        <DetailMini label='Resolved By' value='—' icon={<User size={12} />} />
        <DetailMini label='AI Handoff At' value='—' icon={<Bot size={12} />} />
        <DetailMini label='Assigned At' value='—' icon={<Clock size={12} />} />
        <DetailMini
          label='Created At'
          value={formattedFirstContact}
          icon={<Calendar size={12} />}
          highlight
        />
        <DetailMini
          label='Resolved At'
          value='—'
          icon={<CheckCircle size={12} />}
        />
      </div>

      <InfoDivider />

      <div className='chat-prism-access-grid'>
        <label className='chat-prism-section-label'>Conversation Access</label>
        <button>
          <Shield size={14} /> Active - Click to Block
        </button>
        <label className='chat-prism-section-label'>AI Access</label>
        <button>
          <Bot size={14} /> AI Active - Click to Block
        </button>
      </div>

      <InfoDivider />

      <div className='chat-prism-ticket-block'>
        <label className='chat-prism-section-label'>Tickets</label>
        <button className='chat-prism-ticket-board'>
          <span>
            <LayoutGrid size={14} /> Default Board
          </span>
          <ChevronDown size={14} />
        </button>
        <p className='chat-prism-center-muted'>No tickets yet</p>
      </div>
    </div>
  )
}

function InfoDivider() {
  return <div className='chat-prism-info-divider' />
}

function InfoHeader({ title, action, icon }) {
  return (
    <div className='chat-prism-info-header'>
      <h4>{title}</h4>
      <button>
        {icon}
        {action}
      </button>
    </div>
  )
}

function AccordionMini({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        className='chat-prism-accordion-title'
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <ChevronDown size={14} className={open ? 'open' : ''} />
      </button>
      {open && children}
    </div>
  )
}

function DetailMini({ label, value, icon, highlight }) {
  return (
    <div className='chat-prism-detail-mini'>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong className={highlight ? 'highlight' : ''}>{value}</strong>
      </div>
    </div>
  )
}

function OrderStepHeader({ num, title }) {
  return (
    <div className='flex items-center gap-2 mb-1.5 select-none'>
      <div className='w-5 h-5 rounded-full border border-[var(--ai-200)] text-[var(--ai-700)] flex items-center justify-center text-[10px] font-bold bg-[var(--ai-50)] shadow-sm shrink-0'>
        {num}
      </div>
      <h3 className='text-[11px] font-extrabold text-slate-700 uppercase tracking-wider'>
        {title}
      </h3>
    </div>
  )
}

function CommerceTab({
  chat,
  messages = [],
  onOpenOrder,
  liveOutlets = [],
  liveProducts = [],
  liveCartItems = [],
  liveCartOutletId = null,
  liveOrders = [],
  outletProductMap = {},
  liveCartId = null,
  setLiveCartId,
  setLiveCartItems,
  setLiveCartOutletId,
  setLiveOrders,
}) {
  const ctx = chat.commerceContext || {}
  const getProviderLabel = (prov) => {
    if (!prov) return ''
    const match = {
      xendit: 'Xendit',
      midtrans: 'Midtrans',
      doku: 'DOKU Checkout',
      bayargg: 'Bayar.gg',
    }
    return match[prov.toLowerCase()] || prov
  }
  const [selectedOutletId, setSelectedOutletId] = useState(null)
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false)
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false)
  const [isViewCartModalOpen, setIsViewCartModalOpen] = useState(false)
  const [ordersFilter, setOrdersFilter] = useState('all')
  const [isClearingCart, setIsClearingCart] = useState(false)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)
  const [paymentConfig, setPaymentConfig] = useState(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState('link')
  const toast = useToast()

  const getChatContactId = () => {
    const rawContactId = chat.contactId
    return typeof rawContactId === 'object' ? rawContactId?.id : rawContactId
  }

  const getChatId = () => chat.id || chat._id

  const getCustomerSnapshot = () => {
    const contact = typeof chat.contactId === 'object' ? chat.contactId : chat.contact || chat.contacts || {}
    return {
      name: contact.name || chat.customerName || chat.name || '',
      phone: contact.phone || chat.customerPhone || chat.phone || '',
      handle: contact.handle || chat.handle || '',
    }
  }

  const handleAddToCart = async ({ productId, quantity, variant, notes, discount }) => {
    try {
      const contactId = getChatContactId()
      const chatId = getChatId()
      const platformType = chat.platform || 'telegram'

      let currentCartId = liveCartId
      if (!currentCartId) {
        if (!selectedOutletId) {
          toast.error('Pilih outlet terlebih dahulu')
          return
        }
        const cartRes = await api.post('/carts', {
          outletId: selectedOutletId,
          contactId,
          chatId,
          platformType
        })
        const newCart = cartRes?.data?.data || cartRes?.data
        if (newCart && newCart.id) {
          currentCartId = newCart.id
          setLiveCartId(newCart.id)
          setLiveCartItems(newCart.items || [])
          setLiveCartOutletId(newCart.outletId)
        } else {
          toast.error('Gagal membuat keranjang')
          return
        }
      }

      const res = await api.post(`/carts/${currentCartId}/items`, {
        productId,
        quantity,
        variant,
        modifiers: notes ? [notes] : []
      })
      const updatedCart = res?.data?.data || res?.data
      if (updatedCart) {
        setLiveCartItems(updatedCart.items || [])
        toast.success('Produk berhasil ditambahkan ke keranjang')
        window.dispatchEvent(new Event('cart-cleared'))
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Gagal menambahkan produk ke keranjang')
    }
  }

  const handleUpdateCartQty = async (productId, quantity) => {
    try {
      if (!liveCartId) return
      const res = await api.patch(`/carts/${liveCartId}/items/${productId}`, { quantity })
      const updatedCart = res?.data?.data || res?.data
      if (updatedCart) {
        setLiveCartItems(updatedCart.items || [])
        window.dispatchEvent(new Event('cart-cleared'))
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memperbarui jumlah produk')
    }
  }

  const handleRemoveFromCart = async (productId) => {
    try {
      if (!liveCartId) return
      const res = await api.delete(`/carts/${liveCartId}/items/${productId}`)
      const updatedCart = res?.data?.data || res?.data
      if (updatedCart) {
        setLiveCartItems(updatedCart.items || [])
        toast.success('Produk berhasil dihapus')
        window.dispatchEvent(new Event('cart-cleared'))
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal menghapus produk')
    }
  }

  const handleAddProductFromBrowse = async (product, qty) => {
    await handleAddToCart({
      productId: product.id || product._id,
      quantity: qty,
      variant: 'Regular (16oz)',
    })
  }

  const handleCreateAndSendPaymentLink = async () => {
    if (isCreatingPaymentLink) return
    const contactId = getChatContactId()
    const chatId = getChatId()

    if (!selectedOutletId) {
      toast.error('Pilih outlet terlebih dahulu')
      return
    }

    if (!contactId || !chatId) {
      toast.error('Data chat/contact belum lengkap untuk membuat link pembayaran')
      return
    }

    if (!liveCartItems || liveCartItems.length === 0) {
      toast.error('Keranjang masih kosong')
      return
    }

    setIsCreatingPaymentLink(true)
    try {
      const idempotencyKey = `human_checkout_${liveCartId || chatId}_${Date.now()}`
      const checkoutRes = await api.post('/checkouts', {
        outletId: selectedOutletId,
        contactId,
        chatId,
        idempotencyKey,
        customerSnapshot: getCustomerSnapshot(),
        fulfillmentSnapshot: {
          method: 'pickup',
          outletName: selectedOutlet?.name || '',
        },
      })
      const checkout = checkoutRes?.data?.data || checkoutRes?.data

      const confirmRes = await api.post(`/checkouts/${checkout.id}/confirm`)
      const confirmedCheckout = confirmRes?.data?.data || confirmRes?.data

      const orderRes = await api.post('/orders', { checkoutId: confirmedCheckout.id || checkout.id })
      const order = orderRes?.data?.data || orderRes?.data

      let paymentUrl = ''
      let payment = null
      const total = order.totals?.total || order.totalAmount || cartSummary.total
      const orderNumber = order.orderNumber || order.order_number || order.id

      if (selectedPaymentType === 'link') {
        const paymentRes = await api.post(`/orders/${order.id}/payments/session`, {
          customer: getCustomerSnapshot(),
          idempotencyKey: `human_payment_${order.id}`,
        })
        payment = paymentRes?.data?.data || paymentRes?.data
        paymentUrl = payment.paymentUrl || payment.paymentLink || payment.paymentLinkUrl
        if (!paymentUrl) {
          throw new Error('Payment link tidak tersedia dari provider')
        }
      } else {
        const paymentRes = await api.post('/payments', {
          orderId: order.id,
          amount: total,
          currency: order.totals?.currency || 'IDR',
          customer: getCustomerSnapshot(),
          paymentMethod: selectedPaymentType === 'manual' ? 'bank_transfer' : 'cod',
          outletId: selectedOutletId,
        })
        payment = paymentRes?.data?.data || paymentRes?.data
      }

      let message = ''
      if (selectedPaymentType === 'link') {
        message = `Link pembayaran untuk pesanan ${orderNumber}:\n${paymentUrl}\n\nTotal: ${formatRupiah(total)}\nSilakan selesaikan pembayaran melalui link di atas.`
      } else if (selectedPaymentType === 'manual') {
        message = `Pesanan ${orderNumber} telah dibuat menggunakan Manual Transfer.\nTotal: ${formatRupiah(total)}\nSilakan lakukan transfer manual sesuai instruksi pembayaran.`
      } else if (selectedPaymentType === 'cod') {
        message = `Pesanan ${orderNumber} telah dibuat menggunakan Cash on Delivery (COD).\nTotal: ${formatRupiah(total)}\nSilakan siapkan pembayaran saat pesanan diambil.`
      }

      await api.post(`/chats/${chatId}/send`, { text: message })

      setLiveOrders((current) => [order, ...(current || [])])
      setLiveCartItems([])
      setLiveCartId(null)
      window.dispatchEvent(new Event('cart-cleared'))
      toast.success(
        selectedPaymentType === 'link'
          ? 'Payment link berhasil dibuat dan dikirim'
          : 'Pesanan berhasil dibuat dan dikirim'
      )
    } catch (err) {
      console.error('[CommerceTab] Failed to process order payment:', err)
      toast.error(err.response?.data?.message || err.message || 'Gagal memproses pesanan')
    } finally {
      setIsCreatingPaymentLink(false)
    }
  }

  const displayOutlets = useLiveOrFallback(liveOutlets, FALLBACK_OUTLETS)
  const displayProducts = useLiveOrFallback(liveProducts, FALLBACK_PRODUCTS)

  // Filter messages to only infer cart items from messages newer than the latest order
  const latestOrder = [...(liveOrders || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
  const latestOrderTime = latestOrder ? new Date(latestOrder.createdAt || 0).getTime() : 0
  const messagesForInference = (messages || []).filter((msg) => {
    if (!latestOrderTime) return true
    const msgTime = new Date(msg.createdAt || msg.timestamp || 0).getTime()
    // Give a 1-second grace window to ensure order creation timestamp is after the initiating message
    return msgTime > latestOrderTime
  })

  const inferredCart = inferCartItemsFromConversation(messagesForInference, displayProducts)
  const displayCart = useLiveOrFallback(liveCartItems, inferredCart.length ? inferredCart : FALLBACK_CART)
  const cartSummary = buildCartSummary(displayCart)

  // Sync outlet dropdown: prioritize cart's outlet, then first available outlet
  useEffect(() => {
    if (liveCartOutletId) {
      setSelectedOutletId(liveCartOutletId)
    } else if (!selectedOutletId && displayOutlets.length > 0) {
      setSelectedOutletId(displayOutlets[0].id)
    }
  }, [liveCartOutletId, displayOutlets])

  const selectedOutlet = displayOutlets.find((item) => item.id === selectedOutletId) || displayOutlets[0]
  // Normalize orders from API to a consistent shape for display
  const normalizeOrder = (order) => {
    const id = order.id || order._id || order.orderNumber || order.order_number || order.orderIdDisplay
    const orderNumber = order.orderNumber || order.order_number || order.order_number_snapshot || id || '—'
    const status = order.status || 'Draft'
    const paymentStatus = order.paymentStatus || order.payment || order.payment_status || 'Pending'
    const amount = order.amount || order.total || order.totalAmount || order.totals?.total || order.grandTotal || 0
    const channel = (order.channelSnapshot || order.channel || order.platform || '').toLowerCase()
    const rawDate = order.createdAt || order.date
    const date = rawDate
      ? new Date(rawDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : (order.date || '—')
    const time = rawDate
      ? new Date(rawDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : (order.time || '—')
    const customerName = (order.contactId && typeof order.contactId === 'object' ? order.contactId.name : null)
      || order.customerNameSnapshot || order.contactName || null
    const customerPhone = (order.contactId && typeof order.contactId === 'object' ? order.contactId.phone : null)
      || order.customerPhoneSnapshot || null
    const contactIdentifier = order.contactId && typeof order.contactId === 'object'
      ? order.contactId.id
      : (typeof order.contactId === 'string' ? order.contactId : null)
    return { id, orderNumber, status, paymentStatus, amount, channel, date, time, customerName, customerPhone, contactIdentifier, _raw: order }
  }

  const rawDisplayOrders = useLiveOrFallback(liveOrders, FALLBACK_ORDERS)
  const displayOrders = rawDisplayOrders.map(normalizeOrder)

  // Only show products available at selected outlet
  const availableProductIds = outletProductMap[selectedOutletId] || []
  const availableProducts = displayOutlets.length > 0 && availableProductIds.length > 0
    ? displayProducts.filter((p) => availableProductIds.includes(p.id || p._id))
    : displayProducts

  const filteredOrders = displayOrders.filter((order) => {
    if (ordersFilter === 'all') return true
    if (ordersFilter === 'paid') return (order.paymentStatus || '').toLowerCase() === 'paid'
    if (ordersFilter === 'pending') return (order.paymentStatus || '').toLowerCase() === 'pending' || (order.paymentStatus || '').toLowerCase() === 'unpaid'
    return (order.status || '').toLowerCase() === ordersFilter
  })

  // When the most recent order is completed/cancelled, signal the parent to clear the cart
  // by dispatching the cart-cleared event (parent's polling useEffect listens for it)
  useEffect(() => {
    if (!liveOrders || liveOrders.length === 0) return
    const sorted = [...liveOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    const latestStatus = (sorted[0]?.status || '').toLowerCase()
    const isDone = latestStatus === 'completed' || latestStatus === 'delivered' || latestStatus === 'cancelled'
    if (isDone) window.dispatchEvent(new Event('cart-cleared'))
  }, [liveOrders])

  useEffect(() => {
    let active = true
    const fetchPaymentConfig = async () => {
      try {
        const res = await api.get('/api/workspaces/settings/payment')
        const data = res.data?.data || {}
        if (active) {
          setPaymentConfig(data)
          // Set default selected payment type based on settings:
          // 1. Link (gateway) if provider is configured
          // 2. manual (bank_transfer) if bank_transfer is enabled
          // 3. cod if cod is enabled
          const methods = data.payment_methods || data.paymentMethods || []
          if (data.provider) {
            setSelectedPaymentType('link')
          } else if (methods.includes('bank_transfer')) {
            setSelectedPaymentType('manual')
          } else if (methods.includes('cod')) {
            setSelectedPaymentType('cod')
          }
        }
      } catch (err) {
        console.error('Failed to load payment config:', err)
      }
    }
    fetchPaymentConfig()
    return () => { active = false }
  }, [])

  const handleClearCart = async () => {
    if (!window.confirm('Yakin ingin menghapus semua item dari keranjang aktif user ini?')) return
    setIsClearingCart(true)
    try {
      const contactId = typeof chat.contactId === 'object' ? chat.contactId?.id : chat.contactId
      await api.post('/carts/clear-active', { contactId, chatId: chat.id })
      toast.success('Keranjang berhasil dikosongkan')
      // trigger parent re-poll by dispatching a storage event (picked up by polling effect)
      window.dispatchEvent(new Event('cart-cleared'))
    } catch (err) {
      toast.error('Gagal mengosongkan keranjang')
    } finally {
      setIsClearingCart(false)
    }
  }

  return (
    <div className='space-y-6 pb-6'>
      {/* 1. Outlet */}
      <div>
        <OrderStepHeader num='1' title='Outlet' />
        <div className='w-full mt-1.5 relative'>
          <button
            className={`chat-prism-commerce-select ${isOutletDropdownOpen ? 'open' : ''}`}
            onClick={() => setIsOutletDropdownOpen((open) => !open)}
          >
            <span>{selectedOutlet?.name || 'Pilih outlet...'}</span>
            <ChevronDown
              size={14}
              className={isOutletDropdownOpen ? 'open' : ''}
            />
          </button>

          {isOutletDropdownOpen && (
            <div className='chat-prism-outlet-dropdown'>
              <div className='chat-prism-outlet-search'>
                <Search size={14} />
                <input type='text' placeholder='Search outlet...' />
              </div>
              {displayOutlets.map((item) => {
                const isSelected = selectedOutletId === item.id
                return (
                  <button
                    key={item.id}
                    className={`chat-prism-outlet-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedOutletId(item.id)
                      setIsOutletDropdownOpen(false)
                    }}
                  >
                    <span className='chat-prism-outlet-initials'>
                      {item.initials || (item.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <span className='chat-prism-outlet-copy'>
                      <strong>{item.name}</strong>
                      <small>{item.location || item.city || ''}</small>
                    </span>
                    <em className={(item.status || 'active').toLowerCase()}>{item.status || 'Active'}</em>
                    {isSelected && <Check size={14} />}
                  </button>
                )
              })}
              <button className='chat-prism-manage-outlets'>
                Manage outlets <ExternalLink size={14} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 2. Cart */}
      <div>
        <OrderStepHeader num='2' title='Cart' />
        <div className='mt-1.5 flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm'>
          <div className='flex items-center gap-2 text-xs font-semibold text-slate-600'>
            <ShoppingCart size={14} className='text-slate-400 shrink-0' />
            <span>{cartSummary.itemCount} item{cartSummary.itemCount === 1 ? '' : 's'}</span>
            <span className='text-slate-300'>•</span>
            <span>{formatRupiah(cartSummary.subtotal)}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <button
              className='px-3 py-1.5 bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-100)] rounded-lg text-xs font-bold hover:bg-[var(--brand-100)] transition-colors cursor-pointer'
              onClick={() => setIsViewCartModalOpen(true)}
            >
              View cart
            </button>
            <button
              title='Kosongkan keranjang'
              disabled={isClearingCart}
              onClick={handleClearCart}
              className='p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50'
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Add */}
      <div>
        <OrderStepHeader num='3' title='Quick add product' />
        <div className='mt-1.5 space-y-2'>
          <div className='relative'>
            <Search
              size={14}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0'
            />
            <input
              type='text'
              placeholder='Search product...'
              className='w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[var(--brand-100)] focus:border-[var(--brand-300)] outline-none transition-all shadow-sm placeholder-slate-400'
            />
          </div>
          <div className='flex gap-2'>
            <button
              className='bg-gradient-to-r from-[var(--brand-500)] to-[var(--ai-500)] flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer border-none'
              onClick={() => setIsQuickAddModalOpen(true)}
            >
              Add item
            </button>
            <button
              className='flex-1 py-2.5 bg-white text-[var(--brand-600)] border border-[var(--brand-200)] text-xs font-bold rounded-xl hover:bg-[var(--brand-50)] transition-colors shadow-sm cursor-pointer'
              onClick={() => setIsBrowseModalOpen(true)}
            >
              Browse
            </button>
          </div>
        </div>
      </div>

      {/* 4. Order Summary */}
      <div>
        <OrderStepHeader num='4' title='Order summary' />
        <div className='bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mt-1.5 space-y-2.5'>
          <div className='flex justify-between text-xs text-slate-500 font-semibold'>
            <span>Subtotal</span>
            <span className='text-slate-700'>{formatRupiah(cartSummary.subtotal)}</span>
          </div>
          <div className='flex justify-between text-xs text-[var(--brand-500)] font-semibold'>
            <span>Discount</span>
            <span>- {formatRupiah(cartSummary.discount)}</span>
          </div>
          <div className='flex justify-between text-xs text-slate-500 font-semibold'>
            <span>Shipping</span>
            <span className='text-slate-700'>{formatRupiah(cartSummary.shipping)}</span>
          </div>
          <div className='flex justify-between text-xs text-slate-500 font-semibold'>
            <span>VAT (11%)</span>
            <span className='text-slate-700'>{formatRupiah(cartSummary.vat)}</span>
          </div>
          <div className='h-[1px] bg-slate-100 my-2' />
          <div className='flex justify-between text-sm font-bold text-slate-800'>
            <span>Total</span>
            <span className='text-[var(--brand-600)]'>{formatRupiah(cartSummary.total)}</span>
          </div>
        </div>
      </div>

      {/* 5. Payment */}
      <div>
        <OrderStepHeader num='5' title='Payment' />
        <div className='bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mt-1.5 space-y-3.5'>
          {/* Link Payment Option */}
          {(!paymentConfig || paymentConfig?.provider) && (
            <label className='flex items-center gap-2.5 cursor-pointer group'>
              <input
                type='radio'
                name='payment-type'
                checked={selectedPaymentType === 'link'}
                onChange={() => setSelectedPaymentType('link')}
                className='accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer'
              />
              <span className={`text-xs font-bold ${selectedPaymentType === 'link' ? 'text-[var(--brand-600)]' : 'text-slate-600 group-hover:text-slate-800 transition-colors'}`}>
                Link Payment {paymentConfig?.provider ? `— ${getProviderLabel(paymentConfig.provider)}` : '— Xendit'} {paymentConfig?.environment === 'production' ? '' : 'Test'}
              </span>
            </label>
          )}

          {/* Manual Transfer Option */}
          {(!paymentConfig || (paymentConfig?.paymentMethods || paymentConfig?.payment_methods || []).includes('bank_transfer')) && (
            <label className='flex items-center gap-2.5 cursor-pointer group'>
              <input
                type='radio'
                name='payment-type'
                checked={selectedPaymentType === 'manual'}
                onChange={() => setSelectedPaymentType('manual')}
                className='accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer'
              />
              <span className={`text-xs font-bold ${selectedPaymentType === 'manual' ? 'text-[var(--brand-600)]' : 'text-slate-600 group-hover:text-slate-800 transition-colors'}`}>
                Manual Transfer
              </span>
            </label>
          )}

          {/* COD Option */}
          {(!paymentConfig || (paymentConfig?.paymentMethods || paymentConfig?.payment_methods || []).includes('cod')) && (
            <label className='flex items-center gap-2.5 cursor-pointer group'>
              <input
                type='radio'
                name='payment-type'
                checked={selectedPaymentType === 'cod'}
                onChange={() => setSelectedPaymentType('cod')}
                className='accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer'
              />
              <span className={`text-xs font-bold ${selectedPaymentType === 'cod' ? 'text-[var(--brand-600)]' : 'text-slate-600 group-hover:text-slate-800 transition-colors'}`}>
                Cash on Delivery
              </span>
            </label>
          )}

          {/* Gateway state */}
          {selectedPaymentType === 'link' && (paymentConfig?.provider || !paymentConfig) && (
            <div className='mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm text-left'>
              <div className='text-[11px] font-bold text-emerald-700 mb-0.5'>
                {paymentConfig?.provider ? getProviderLabel(paymentConfig.provider) : 'Xendit'} {paymentConfig?.environment === 'production' ? 'Production Mode' : 'Test Mode'}
              </div>
              <div className='text-[10px] text-emerald-600/80 mb-2 leading-tight'>
                Connected when backend is configured. Payment and order statuses remain separate.
              </div>
              <button
                className='text-[10px] font-bold text-amber-700 flex items-center gap-1 hover:underline border-none bg-transparent cursor-pointer p-0'
                onClick={() => setIsPaymentModalOpen(true)}
              >
                View setup{' '}
                <ArrowRight
                  size={10}
                  className='group-hover:translate-x-0.5 transition-transform shrink-0'
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Actions */}
      <div>
        <OrderStepHeader num='6' title='Actions' />
        <div className='flex flex-col gap-2.5 mt-1.5'>
          <button
            disabled={isCreatingPaymentLink || !cartSummary.itemCount}
            onClick={handleCreateAndSendPaymentLink}
            className='bg-gradient-to-r from-[var(--brand-500)] to-[var(--ai-500)] w-full py-3 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isCreatingPaymentLink
              ? selectedPaymentType === 'link'
                ? 'Creating Payment Link...'
                : 'Creating Order...'
              : selectedPaymentType === 'link'
                ? 'Create & Send Payment Link'
                : selectedPaymentType === 'manual'
                  ? 'Create & Send Order (Manual Transfer)'
                  : 'Create & Send Order (COD)'}
          </button>
          <button className='w-full py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer'>
            <Bookmark size={14} className='text-slate-400 shrink-0' />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* 7. History */}
      <div>
        <div className='bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mt-1.5'>
          <div className='flex items-center justify-between mb-3'>
            <OrderStepHeader num='7' title='Conversation orders' />
            <button
              className='text-[10px] font-bold text-[var(--ai-600)] hover:underline border-none bg-transparent cursor-pointer'
              onClick={() => setIsOrdersModalOpen(true)}
            >
              View all
            </button>
          </div>
          <div className='space-y-3'>
            {displayOrders.slice(0, 3).length > 0 ? displayOrders.slice(0, 3).map((order) => {
              return (
                <div
                  key={order.id}
                  className='flex items-center justify-between group cursor-pointer'
                  onClick={() => onOpenOrder && order.id && onOpenOrder(order.id)}
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0' />
                    <span className='text-[10px] font-mono text-slate-500 group-hover:text-[var(--brand-600)] transition-colors truncate'>
                      {order.orderNumber || order.id || 'ORDER'}
                    </span>
                  </div>
                  <span className='text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200'>
                    {order.status}
                  </span>
                  <span className='text-[10px] font-bold text-slate-700 text-right'>
                    {typeof order.amount === 'string' ? order.amount : formatRupiah(order.amount)}
                  </span>
                  <span className='text-[10px] text-slate-400 text-right'>
                    {order.time}
                  </span>
                </div>
              )
            }) : <p className='text-[10px] text-slate-400'>No orders yet.</p>}
          </div>
        </div>
      </div>
      {isPaymentModalOpen && (
        <PaymentSetupModal onClose={() => setIsPaymentModalOpen(false)} />
      )}
      {isOrdersModalOpen && (
        <ConversationOrdersModal
          orders={filteredOrders}
          allOrders={displayOrders}
          ordersFilter={ordersFilter}
          setOrdersFilter={setOrdersFilter}
          onClose={() => setIsOrdersModalOpen(false)}
          onOpenOrder={onOpenOrder}
          chat={chat}
        />
      )}
      {isQuickAddModalOpen && (
        <QuickAddModal
          products={availableProducts}
          onClose={() => setIsQuickAddModalOpen(false)}
          onAdd={handleAddToCart}
        />
      )}
      {isBrowseModalOpen && (
        <BrowseProductsModal
          onClose={() => setIsBrowseModalOpen(false)}
          onViewCart={() => {
            setIsBrowseModalOpen(false)
            setIsViewCartModalOpen(true)
          }}
          products={availableProducts}
          cartItems={displayCart}
          outletName={selectedOutlet?.name || 'Outlet'}
          outletStatus={selectedOutlet?.operational_status || selectedOutlet?.status || 'Active'}
          onAddProduct={handleAddProductFromBrowse}
        />
      )}
      {isViewCartModalOpen && (
        <ViewCartModal
          onClose={() => setIsViewCartModalOpen(false)}
          cartItems={displayCart}
          onUpdateQty={handleUpdateCartQty}
          onRemove={handleRemoveFromCart}
        />
      )}
    </div>
  )
}

function CommerceModal({
  title,
  subtitle,
  children,
  icon,
  onClose,
  size = 'md',
}) {
  return (
    <div className='chat-prism-commerce-modal-root'>
      <button
        className='chat-prism-commerce-modal-backdrop'
        onClick={onClose}
        aria-label='Close modal'
      />
      <div className={`chat-prism-commerce-modal ${size}`}>
        <header>
          <div>
            <h2>
              {icon}
              {title}
            </h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label='Close modal'>
            <X size={20} />
          </button>
        </header>
        <div className='chat-prism-commerce-modal-body'>{children}</div>
      </div>
    </div>
  )
}

function PaymentSetupModal({ onClose }) {
  return (
    <CommerceModal
      title='Set Up Payment'
      subtitle='Connect a payment gateway or use manual payment to start receiving payments.'
      icon={<Sparkles className='chat-prism-payment-title-icon' size={24} />}
      onClose={onClose}
      size='md'
    >
      <h3 className='chat-prism-payment-section-title'>Payment Providers</h3>
      <div className='chat-prism-payment-providers'>
        <PaymentProviderCard
          provider='midtrans'
          recommended
          title='Midtrans'
          description='Accept payments via VA, e-Wallet, Cards, and more.'
          action='Connect Midtrans'
        />
        <PaymentProviderCard
          provider='xendit'
          title='Xendit'
          description='Payments for Indonesia & SEA. Cards, VA, QRIS.'
          action='Connect Xendit'
        />
        <PaymentProviderCard
          provider='manual'
          title='Manual Payment'
          description='Confirm payments manually (bank transfer, cash, etc).'
          action='Set Up Manual'
        />
      </div>

      <div className='chat-prism-payment-bottom'>
        <div>
          <h3>Payment Requirements</h3>
          <p>
            <CheckCircle2 size={16} /> Business information is complete
          </p>
          <p>
            <CheckCircle2 size={16} /> Bank account is added
          </p>
          <p className='muted'>
            <MinusCircle size={16} /> Upload identity document
          </p>
        </div>
        <div className='chat-prism-payment-warning'>
          <h3>
            <AlertTriangle size={16} /> Environment keys are not configured
          </h3>
          <p>
            You need to configure your Midtrans / Xendit environment keys to go
            live.
          </p>
          <button>Go to Settings</button>
        </div>
      </div>

      <div className='chat-prism-modal-actions'>
        <button onClick={onClose}>Not now</button>
        <button className='primary'>Continue Setup</button>
      </div>
    </CommerceModal>
  )
}

function PaymentProviderCard({
  action,
  description,
  provider,
  recommended,
  title,
}) {
  const icon =
    provider === 'midtrans' ? (
      <span className='chat-prism-midtrans-mark'>
        <i />
        <i />
        <i />
      </span>
    ) : provider === 'xendit' ? (
      <span className='chat-prism-xendit-mark'>{'</>'}</span>
    ) : (
      <Wallet size={24} strokeWidth={2.5} />
    )

  return (
    <div
      className={`chat-prism-payment-provider ${recommended ? 'recommended' : ''}`}
    >
      <div className={`chat-prism-payment-provider-icon ${provider || ''}`}>
        {icon}
      </div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <div>
        <span>{recommended ? 'Recommended' : 'Not Connected'}</span>
        <button>{action}</button>
      </div>
    </div>
  )
}

// Helper to get status badge colour class
function getOrderStatusClass(status = '') {
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'delivered') return 'completed'
  if (s === 'cancelled' || s === 'canceled') return 'cancelled'
  if (s === 'preparing' || s === 'processing' || s === 'ready') return 'preparing'
  if (s === 'new' || s === 'pending') return 'new'
  return 'default'
}

function getPaymentStatusClass(status = '') {
  const s = status.toLowerCase()
  if (s === 'paid') return 'paid'
  if (s === 'pending') return 'pending'
  return 'unpaid'
}

function ConversationOrdersModal({
  orders,
  allOrders,
  ordersFilter,
  setOrdersFilter,
  onClose,
  onOpenOrder,
  chat,
}) {
  const total = (allOrders || orders).length
  return (
    <CommerceModal title='Conversation Orders' onClose={onClose} size='lg'>
      <div className='chat-prism-order-filters'>
        {['all', 'pending', 'paid', 'completed', 'cancelled'].map((filter) => (
          <button
            key={filter}
            className={ordersFilter === filter ? 'active' : ''}
            onClick={() => setOrdersFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className='chat-prism-orders-table-wrap'>
        <table className='chat-prism-orders-table'>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Platform</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? orders.map((order) => {
              const displayName = order.customerName || chat?.contactName || '—'
              const displayPhone = order.customerPhone
              const displayId = order.contactIdentifier
              const contactSub = displayPhone || (displayId ? `ID: ${String(displayId).slice(-8)}` : null)
              const platform = order.channel || (chat?.platform || '').toLowerCase() || 'unknown'
              const amountStr = typeof order.amount === 'string'
                ? order.amount
                : formatRupiah(order.amount)
              return (
                <tr key={order.id || Math.random()}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{order.orderNumber || order.id || '—'}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <strong style={{ fontSize: 12 }}>{displayName}</strong>
                      {contactSub && (
                        <small style={{ fontSize: 10, color: 'var(--text-muted)' }}>{contactSub}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      padding: '2px 6px',
                      borderRadius: 5,
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)',
                    }}>
                      {platform || '—'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: 11 }}>{order.date}</strong>
                    <small style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>{order.time}</small>
                  </td>
                  <td>
                    <strong>{amountStr}</strong>
                  </td>
                  <td>
                    <span className={getPaymentStatusClass(order.paymentStatus)}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className={getOrderStatusClass(order.status)}>
                      {order.status || 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className='chat-prism-table-actions'>
                      <button
                        onClick={() => onOpenOrder?.(order.id)}
                        title='Open order detail'
                      >
                        Open
                      </button>
                      <button title='More actions'>
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 12 }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className='chat-prism-pagination-row'>
        <span>Showing {orders.length} of {total} order{total !== 1 ? 's' : ''}</span>
        <div>
          <button disabled>
            <ChevronLeft size={14} />
          </button>
          <button className='active'>1</button>
          <button disabled>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </CommerceModal>
  )
}

function QtyInput({ value, onChange }) {
  const numValue = Number(value) || 1
  return (
    <div className='chat-prism-qty-input'>
      <button onClick={() => onChange && onChange(Math.max(1, numValue - 1))}>-</button>
      <input readOnly value={value} />
      <button onClick={() => onChange && onChange(numValue + 1)}>+</button>
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1)
  const price = product.basePrice ?? product.base_price ?? product.price ?? 0
  return (
    <div className='chat-prism-product-card'>
      <div className='chat-prism-product-thumb'>
        <Coffee size={30} />
      </div>
      <div>
        <strong>{product.name}</strong>
        {product.badge ? (
          <span>
            <Sparkles size={9} /> {product.badge}
          </span>
        ) : (
          <i />
        )}
        <b>{formatRupiah(price)}</b>
        <small className={product.stock === 'Low stock' ? 'low' : ''}>
          {product.stock}
        </small>
      </div>
      <div>
        <QtyInput value={String(qty)} onChange={setQty} />
        <button onClick={() => onAdd?.(product, qty)}>Add</button>
      </div>
    </div>
  )
}

function QuickAddModal({ products = [], onClose, onAdd }) {
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariant, setSelectedVariant] = useState('Regular (16oz)')
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')

  // Custom item inputs
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState(1)
  const [customPrice, setCustomPrice] = useState('')

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Popular products: match mock names or take the first few products
  const popularNames = ['Teh Tarik', 'Lemon Tea', 'Milk Tea', 'Vanilla']
  const popularProducts = products.filter((p) =>
    popularNames.some((name) => p.name.toLowerCase().includes(name.toLowerCase()))
  ).slice(0, 4)
  const displayPopular = popularProducts.length > 0 ? popularProducts : products.slice(0, 4)

  // Determine unit price of the selected product
  const selectedProduct = products.find((p) => String(p.id || p._id) === String(selectedProductId))
  const unitPrice = selectedProduct
    ? (selectedProduct.outletAvailability?.priceOverride ?? selectedProduct.basePrice ?? selectedProduct.price ?? 0)
    : 0

  // Set default product when products list is loaded
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id || products[0]._id)
    }
  }, [products, selectedProductId])

  const handleAddClick = () => {
    if (customName.trim()) {
      toast.info('Custom item tidak didukung oleh POS backend. Silakan pilih produk dari menu.')
      return
    }

    if (!selectedProductId) {
      toast.error('Pilih produk terlebih dahulu')
      return
    }

    onAdd({
      productId: selectedProductId,
      quantity,
      variant: selectedVariant,
      notes: notes.trim(),
      discount: Number(discount) || 0
    })
    onClose()
  }

  return (
    <CommerceModal title='Quick Add Item' onClose={onClose} size='lg'>
      <div className='chat-prism-quick-add-grid'>
        <aside>
          <h3>Search & Add</h3>
          <div className='chat-prism-modal-search'>
            <Search size={14} />
            <input
              placeholder='Search product...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <h3>Recent / Popular</h3>
          {displayPopular.length > 0 ? displayPopular.map((item) => (
            <button
              key={item.id || item._id}
              onClick={() => {
                setSelectedProductId(item.id || item._id)
                setSelectedVariant('Regular (16oz)')
              }}
              style={{
                borderColor: String(selectedProductId) === String(item.id || item._id) ? 'var(--brand-500)' : '',
                background: String(selectedProductId) === String(item.id || item._id) ? 'var(--brand-50)' : '',
                color: String(selectedProductId) === String(item.id || item._id) ? 'var(--brand-700)' : '',
              }}
            >
              <Coffee size={14} /> {item.name}
            </button>
          )) : (
            <p className='text-xs text-[var(--text-muted)] leading-relaxed'>
              Belum ada produk tersedia untuk outlet ini.
            </p>
          )}
        </aside>
        <main>
          <h3>Item Details</h3>
          <CommerceField label='Product'>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value)
                setSelectedVariant('Regular (16oz)')
              }}
            >
              <option value=''>Select product...</option>
              {filteredProducts.map((item) => (
                <option key={item.id || item._id} value={item.id || item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </CommerceField>
          <CommerceField label='Variant'>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
            >
              <option value='Regular (16oz)'>Regular (16oz)</option>
              <option value='Large (22oz)'>Large (22oz)</option>
              <option value='Standard'>Standard</option>
            </select>
          </CommerceField>
          <div className='chat-prism-modal-two-col'>
            <CommerceField label='Quantity'>
              <QtyInput value={String(quantity)} onChange={setQuantity} />
            </CommerceField>
            <CommerceField label='Unit Price'>
              <input readOnly value={formatRupiah(unitPrice)} />
            </CommerceField>
          </div>
          <div className='chat-prism-modal-two-col'>
            <CommerceField label='Discount'>
              <input
                placeholder='0'
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </CommerceField>
            <CommerceField label='Notes'>
              <input
                placeholder='Tambahkan catatan...'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CommerceField>
          </div>
        </main>
      </div>
      <div className='chat-prism-custom-item-row'>
        <h3>Or add a custom item</h3>
        <input
          placeholder='Item name'
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
        />
        <QtyInput value={String(customQty)} onChange={setCustomQty} />
        <input
          placeholder='Rp 0'
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
        />
      </div>
      <div className='chat-prism-modal-actions'>
        <button onClick={onClose}>Cancel</button>
        <button className='primary' onClick={handleAddClick}>Add to Order</button>
      </div>
    </CommerceModal>
  )
}

function BrowseProductsModal({ onClose, onViewCart, products = [], cartItems = [], outletName = 'Outlet', outletStatus = 'Active', onAddProduct }) {
  const summary = buildCartSummary(cartItems)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    if (selectedCat === 'All') return matchesSearch
    const cat = p.category || p.metadata?.category || ''
    return matchesSearch && cat.toLowerCase() === selectedCat.toLowerCase()
  })

  return (
    <CommerceModal title='Browse products' onClose={onClose} size='lg'>
      <div className='chat-prism-browse-head'>
        <span>
          Outlet: <b>{outletName}</b> <ChevronDown size={14} />
        </span>
        <em>{outletStatus}</em>
      </div>
      <div className='chat-prism-product-toolbar'>
        <div>
          {['All', 'Minuman', 'Tea', 'Coffee', 'Snacks', 'Toppings'].map((cat) => (
            <button
              key={cat}
              className={selectedCat === cat ? 'active' : ''}
              onClick={() => setSelectedCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className='chat-prism-modal-search'>
          <Search size={14} />
          <input
            placeholder='Search product...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className='chat-prism-product-note'>
        <Info size={16} /> Showing products available at this outlet. Some items
        may be out of stock.
      </div>
      <div className='chat-prism-product-grid'>
        {filtered.length > 0 ? filtered.map((product) => (
          <ProductCard
            key={product.id || product._id}
            product={product}
            onAdd={onAddProduct}
          />
        )) : <p style={{padding: 20, color: 'var(--text-muted)'}}>No products available at this outlet</p>}
      </div>
      <div className='chat-prism-sticky-cart'>
        <div>
          <ShoppingCart size={20} />
          <span>
            <strong>{summary.itemCount} item(s) selected</strong>
            <small>Subtotal {formatRupiah(summary.subtotal)}</small>
          </span>
        </div>
        <div>
          <button onClick={onViewCart}>View cart</button>
          <button className='primary' onClick={onClose}>Add to order</button>
        </div>
      </div>
    </CommerceModal>
  )
}

function ViewCartModal({ onClose, cartItems = [], onUpdateQty, onRemove }) {
  const summary = buildCartSummary(cartItems)
  return (
    <CommerceModal
      title='View Cart'
      subtitle={`You have ${summary.itemCount} item(s) in your cart`}
      onClose={onClose}
      size='sm'
    >
      <div className='chat-prism-cart-items'>
        {cartItems.length > 0 ? cartItems.slice(0, 10).map((item) => (
          <div key={item.id || item.productId} className='chat-prism-cart-card'>
            <div className='chat-prism-product-thumb'>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className='chat-prism-cart-card-head'>
                <strong>{item.name || item.productNameSnapshot || 'Product'}</strong>
                <button onClick={() => onRemove?.(item.productId)}>
                  <Trash2 size={15} />
                </button>
              </div>
              <small>{item.variant || item.variantNameSnapshot || (item.inferred ? 'Dari percakapan' : '')}</small>
              <b>{formatRupiah(getItemUnitPrice(item))}</b>
              <div className='chat-prism-cart-card-foot'>
                <QtyInput
                  value={String(getItemQty(item))}
                  onChange={(newQty) => onUpdateQty?.(item.productId, newQty)}
                />
                <button title="Edit item details">
                  <Edit2 size={14} />
                </button>
                <strong>{formatRupiah(getItemSubtotal(item))}</strong>
              </div>
            </div>
          </div>
        )) : <p style={{ padding: 16, color: 'var(--text-muted)' }}>Cart masih kosong.</p>}
      </div>
      <div className='chat-prism-promo-row'>
        <Tag size={16} />
        <input placeholder='Promo Code' />
        <button>Apply</button>
      </div>
      <OrderSummaryMini large summary={summary} />
      <div className='chat-prism-free-shipping'>
        <CheckCircle2 size={16} />
        <div>
          <strong>Free shipping unlocked!</strong>
          <span>Add Rp 78.615 more to get free shipping.</span>
        </div>
      </div>
      <div className='chat-prism-modal-actions'>
        <button onClick={onClose}>Continue Editing</button>
        <button className='primary' onClick={onClose}>Proceed to Order</button>
      </div>
    </CommerceModal>
  )
}

function OrderSummaryMini({ large, summary = buildCartSummary([]) }) {
  return (
    <div className={`chat-prism-order-summary-mini ${large ? 'large' : ''}`}>
      <p>
        <span>Subtotal</span>
        <b>{formatRupiah(summary.subtotal)}</b>
      </p>
      <p className='discount'>
        <span>Discount</span>
        <b>- {formatRupiah(summary.discount)}</b>
      </p>
      <p>
        <span>Shipping</span>
        <b>{formatRupiah(summary.shipping)}</b>
      </p>
      <p>
        <span>VAT (11%)</span>
        <b>{formatRupiah(summary.vat)}</b>
      </p>
      <strong>
        <span>Total</span>
        <b>{formatRupiah(summary.total)}</b>
      </strong>
    </div>
  )
}

function CommerceField({ children, label }) {
  return (
    <label className='chat-prism-commerce-field'>
      <span>{label}</span>
      {children}
    </label>
  )
}


function TicketTab({ chat }) {
  const toast = useToast()
  const copy = (val) => {
    if (!val) return
    navigator.clipboard.writeText(String(val)).then(
      () => toast.success('Copied!'),
      () => toast.error('Copy failed')
    )
  }

  // Mock data to match the UI precisely
  const mockTicket = {
    type: 'COMPLAINT',
    id: '#CMP-2025-0618-0042',
    status: 'Open',
    priority: 'Medium',
    category: 'Wrong / Incomplete Items',
    outlet: 'Selalu Teh Danau Murung',
    invoice: 'INV-TEST-001',
    assignedTo: 'Rina Pratiwi',
    slaLeft: '1h 24m left',
    slaDue: 'Due: Jun 25, 06:00 AM',
    lastUpdate: 'Jun 25, 04:35 AM',
    summary: 'Customer received incomplete items. Ordered Teh Asli 5 pcs but items received do not match the order.',
    progress: [
      { status: 'Open', label: 'Complaint created', time: 'Jun 24, 03:36 PM', active: true, color: 'rose' },
      { status: 'Investigating', label: 'CS assigned', time: 'Jun 24, 03:42 PM', active: false, color: 'blue' },
      { status: 'Waiting Outlet', label: 'Waiting for outlet response', time: 'Jun 24, 03:55 PM', active: false, color: 'amber' },
      { status: 'Resolved', label: 'Pending', time: '-', active: false, color: 'slate' }
    ]
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{mockTicket.type}</span>
            <span className="text-sm font-bold text-slate-700">{mockTicket.id}</span>
          </div>
          <button onClick={() => copy(mockTicket.id)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <Copy size={14} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 text-[11px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            {mockTicket.status}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-600 text-[11px] font-bold">
            <AlertCircle size={10} strokeWidth={3} />
            {mockTicket.priority}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-[120px_1fr] items-start">
            <span className="text-slate-500 font-semibold">Category</span>
            <span className="text-slate-800 font-semibold">{mockTicket.category}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] items-start">
            <span className="text-slate-500 font-semibold">Outlet</span>
            <span className="text-slate-800 font-semibold">{mockTicket.outlet}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="text-slate-500 font-semibold">Invoice / Order</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-800 font-bold">{mockTicket.invoice}</span>
              <button onClick={() => copy(mockTicket.invoice)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <Copy size={12} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] items-center">
            <span className="text-slate-500 font-semibold">Assigned To</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                  {mockTicket.assignedTo.split(' ').map(n=>n[0]).join('')}
                </div>
                <span className="text-slate-800 font-semibold">{mockTicket.assignedTo}</span>
              </div>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--brand-200)] text-[var(--brand-600)] bg-[var(--brand-50)] text-[10px] font-bold hover:bg-[var(--brand-100)] transition-colors cursor-pointer">
                <UserPlus size={10} />
                Reassign
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] items-start pt-1">
            <span className="text-slate-500 font-semibold">SLA Due / Response</span>
            <div>
              <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                <Clock size={12} />
                {mockTicket.slaLeft}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{mockTicket.slaDue}</div>
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] items-center pt-1">
            <span className="text-slate-500 font-semibold">Last Update</span>
            <span className="text-slate-800 font-semibold">{mockTicket.lastUpdate}</span>
          </div>
        </div>

        <div className="h-px bg-slate-100 my-5"></div>

        {/* Summary */}
        <div className="mb-5">
          <h4 className="text-[11px] font-bold text-slate-500 mb-2">Summary</h4>
          <p className="text-[12px] text-slate-800 font-semibold leading-relaxed">
            {mockTicket.summary}
          </p>
          <button className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand-600)] mt-2 hover:text-[var(--brand-700)] cursor-pointer bg-transparent border-none p-0">
            Show more <ChevronDown size={12} />
          </button>
        </div>

        <div className="h-px bg-slate-100 my-5"></div>

        {/* Progress */}
        <div className="mb-6">
          <h4 className="text-[11px] font-bold text-slate-800 mb-4">Progress</h4>
          <div className="relative pl-2.5 space-y-4">
            {/* The vertical timeline line */}
            <div className="absolute top-2 bottom-2 left-[13px] w-0.5 bg-slate-100"></div>
            
            {mockTicket.progress.map((item, i) => {
              // Map color names to tailwind classes
              const borderColor = item.color === 'rose' ? 'border-rose-500' :
                                  item.color === 'blue' ? 'border-blue-500' :
                                  item.color === 'amber' ? 'border-amber-500' :
                                  'border-slate-300';
              const dotColor = item.color === 'rose' ? 'bg-rose-500' :
                               item.color === 'blue' ? 'bg-blue-500' :
                               item.color === 'amber' ? 'bg-amber-500' :
                               'bg-slate-300';
              return (
                <div key={i} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`w-2.5 h-2.5 rounded-full z-10 bg-white border-[2.5px] ${borderColor} flex items-center justify-center mt-0.5 ml-[1px]`}>
                    {item.active && <div className={`w-1 h-1 rounded-full ${dotColor}`}></div>}
                  </div>
                  
                  {/* Content */}
                  <div className={`flex-1 ${!item.active && item.status === 'Resolved' ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-800">{item.status}</span>
                      <span className="text-[10px] font-medium text-slate-500">{item.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons Pinned to Bottom */}
      <div className="p-4 bg-white border-t border-slate-100 space-y-2">
        <button className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
          <User size={14} /> Assign
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
          <History size={14} /> Change Status
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
          <FileText size={14} /> Add Note
        </button>
        <button className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
          <div className="flex items-center gap-2">
            <Shield size={14} /> View Complaint
          </div>
          <ExternalLink size={14} className="text-slate-400" />
        </button>
        <button className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors shadow-sm mt-2 cursor-pointer">
          <AlertTriangle size={14} /> Escalate
        </button>
      </div>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

export default function ChatContextPanel({
  chat,
  messages = [],
  onOpenOrder,
  onResendPaymentLink,
}) {
  const [activeTab, setActiveTab] = useState('contact')

  // ── Live data ─────────────────────────────────────────────────────────────
  const [liveOutlets, setLiveOutlets] = useState([])
  const [liveProducts, setLiveProducts] = useState([])
  const [liveCartItems, setLiveCartItems] = useState([])
  const [liveCartId, setLiveCartId] = useState(null)
  // Initialize outlet from chat.currentOutletId so sidebar shows correct outlet immediately
  const [liveCartOutletId, setLiveCartOutletId] = useState(
    chat?.currentOutletId || chat?.current_outlet_id || null
  )
  const [liveOrders, setLiveOrders] = useState([])
  const [outletProductMap, setOutletProductMap] = useState({})
  // Ref so the cart-polling closure always reads the LATEST liveOrders (avoids stale closure)
  const liveOrdersRef = useRef([])

  // ── Fetch outlets, products and conversation-scoped orders ───────────────
  useEffect(() => {
    if (isDemoMode() || !chat?.workspaceId) return
    const chatId = chat?.id || chat?._id
    const rawContactId = chat?.contactId
    const contactId = typeof rawContactId === 'object' ? rawContactId?.id : rawContactId

    ;(async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          api.get('/outlets'),
          api.get('/products'),
        ])
        const outlets = Array.isArray(oRes.data?.data) ? oRes.data.data : Array.isArray(oRes.data) ? oRes.data : []
        const products = Array.isArray(pRes.data?.data) ? pRes.data.data : Array.isArray(pRes.data) ? pRes.data : []

        setLiveOutlets(outlets)
        setLiveProducts(products)

        // Fetch orders filtered by this conversation's chatId / contactId
        try {
          const ordParams = {}
          if (chatId) ordParams.chat_id = chatId
          if (contactId) ordParams.contact_id = contactId
          const ordRes = await api.get('/orders', { params: ordParams }).catch(() => null)
          let orders = Array.isArray(ordRes?.data?.data)
            ? ordRes.data.data
            : Array.isArray(ordRes?.data) ? ordRes.data : []
          // Sort newest first, keep up to 20
          orders = orders
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 20)
          setLiveOrders(orders)
        } catch {
          // silently degrade — orders section shows fallback or empty
        }

        // Build outlet → product ID map
        const map = {}
        for (const p of products) {
          try {
            const aRes = await api.get(`/products/${p.id || p._id}/outlet-availability`).catch(() => null)
            const avail = aRes?.data?.data || []
            for (const a of avail) {
              const oid = a.outletId || a.outlet_id
              if (!map[oid]) map[oid] = []
              map[oid].push(p.id || p._id)
            }
          } catch {
            // Availability is optional; the modal falls back to all loaded products.
          }
        }
        setOutletProductMap(map)
      } catch (e) {
        console.warn('[ContextPanel] static data error:', e.message)
      }
    })()
  }, [chat?.workspaceId, chat?.id, chat?._id, chat?.contactId])

  // Keep the ref in sync whenever liveOrders changes
  useEffect(() => { liveOrdersRef.current = liveOrders }, [liveOrders])

  // ── Auto-clear cart when latest order is completed/delivered/cancelled ──────
  useEffect(() => {
    if (isDemoMode()) return
    if (!liveOrders || liveOrders.length === 0) return
    const sorted = [...liveOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    const latestStatus = (sorted[0]?.status || '').toLowerCase()
    const isDone = latestStatus === 'completed' || latestStatus === 'delivered' || latestStatus === 'cancelled'
    if (!isDone) return
    setLiveCartItems([])
    const chatId = chat?.id || chat?._id
    const contactId = typeof chat?.contactId === 'object' ? chat?.contactId?.id : chat?.contactId
    if (chatId || contactId) {
      api.post('/carts/clear-active', { contactId, chatId }).catch(() => {})
    }
  }, [liveOrders])

  // ── Poll cart every 5s so sidebar stays in sync with AI actions ───────────
  useEffect(() => {
    if (isDemoMode() || !chat?.workspaceId) return
    const chatId = chat?.id || chat?._id
    const contactId = typeof chat?.contactId === 'object' ? chat?.contactId?.id : chat?.contactId
    if (!chatId && !contactId) return

    const fetchCart = async () => {
      try {
        // Check FIRST if the latest order for this chat is already done.
        // Use ref so we always read fresh liveOrders even inside a stale closure.
        const currentOrders = liveOrdersRef.current || []
        if (currentOrders.length > 0) {
          const latest = [...currentOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
          const ls = (latest?.status || '').toLowerCase()
          if (ls === 'completed' || ls === 'delivered' || ls === 'cancelled') {
            // Order is done — cart must be empty, don't let backend overwrite
            setLiveCartItems([])
            return
          }
        }

        const params = {}
        if (chatId) params.chat_id = chatId
        if (contactId) params.contact_id = contactId
        const cRes = await api.get('/carts/current', { params }).catch(() => null)
        const httpStatus = cRes?.status
        const cart = cRes?.data?.data || cRes?.data || null

        if (cart && (cart.outletId || cart.outlet_id || cart.id)) {
          setLiveCartId(cart.id || null)
          setLiveCartItems(cart.items || [])
          setLiveCartOutletId(cart.outletId || cart.outlet_id)
        } else if (httpStatus === 404 || !cart) {
          setLiveCartId(null)
          setLiveCartItems([])
          try {
            const chatRes = await api.get(`/chats/${chatId}`).catch(() => null)
            const updatedChat = chatRes?.data?.data || chatRes?.data || null
            const latestOutletId = updatedChat?.currentOutletId || updatedChat?.current_outlet_id
            if (latestOutletId) setLiveCartOutletId(latestOutletId)
          } catch {
            // Keep current outlet selection if chat refresh fails.
          }
        } else {
          setLiveCartId(cart.id || null)
          setLiveCartItems(cart.items || [])
        }
      } catch {
        // silent
      }
    }

    fetchCart()
    const interval = setInterval(fetchCart, 5000)
    window.addEventListener('cart-cleared', fetchCart)
    return () => {
      clearInterval(interval)
      window.removeEventListener('cart-cleared', fetchCart)
    }
  }, [chat?.id, chat?._id, chat?.contactId])

  if (!chat) return null

  return (
    <div className='chat-prism-context-panel'>
      {/* Tabs */}
      <div className='chat-prism-context-tabs'>
        <Tab
          label='Info'
          icon={<AlertCircle size={16} />}
          active={activeTab === 'contact'}
          onClick={() => setActiveTab('contact')}
        />
        <Tab
          label='Ticket'
          icon={<Ticket size={16} />}
          active={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        />
        <Tab
          label='Orders'
          icon={<ShoppingBag size={16} />}
          active={activeTab === 'commerce'}
          onClick={() => setActiveTab('commerce')}
        />
      </div>

      {/* Panel content */}
      <div className='chat-prism-context-content'>
        {activeTab === 'contact' && <ContactTab chat={chat} />}
        {activeTab === 'commerce' && (
          <CommerceTab
            chat={chat}
            messages={messages}
            onOpenOrder={onOpenOrder}
            onResendPaymentLink={onResendPaymentLink}
            liveOutlets={liveOutlets}
            liveProducts={liveProducts}
            liveCartItems={liveCartItems}
            liveCartOutletId={liveCartOutletId}
            liveOrders={liveOrders}
            outletProductMap={outletProductMap}
            liveCartId={liveCartId}
            setLiveCartId={setLiveCartId}
            setLiveCartItems={setLiveCartItems}
            setLiveCartOutletId={setLiveCartOutletId}
            setLiveOrders={setLiveOrders}
          />
        )}
        {activeTab === 'ai' && <TicketTab chat={chat} />}
      </div>
    </div>
  )
}
