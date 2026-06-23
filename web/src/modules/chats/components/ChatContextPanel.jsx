import React, { useState, useEffect } from 'react'
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
    .map((product) => ({
      id: product.id || product._id,
      productId: product.id || product._id,
      name: product.name,
      unitPrice: asNumber(product.basePrice ?? product.base_price ?? product.price),
      quantity: 1,
      subtotal: asNumber(product.basePrice ?? product.base_price ?? product.price),
      inferred: true,
    }))
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
}) {
  const ctx = chat.commerceContext || {}
  const [selectedOutletId, setSelectedOutletId] = useState(null)
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false)
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false)
  const [isViewCartModalOpen, setIsViewCartModalOpen] = useState(false)
  const [ordersFilter, setOrdersFilter] = useState('all')
  const [isClearingCart, setIsClearingCart] = useState(false)
  const toast = useToast()

  const displayOutlets = useLiveOrFallback(liveOutlets, FALLBACK_OUTLETS)
  const displayProducts = useLiveOrFallback(liveProducts, FALLBACK_PRODUCTS)
  const inferredCart = inferCartItemsFromConversation(messages, displayProducts)
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
  const displayOrders = useLiveOrFallback(liveOrders, FALLBACK_ORDERS)

  // Only show products available at selected outlet
  const availableProductIds = outletProductMap[selectedOutletId] || []
  const availableProducts = displayOutlets.length > 0
    ? displayProducts.filter((p) => availableProductIds.includes(p.id || p._id))
    : displayProducts

  const filteredOrders = displayOrders.filter((order) => {
    if (ordersFilter === 'all') return true
    if (ordersFilter === 'paid') return order.payment === 'Paid'
    if (ordersFilter === 'pending') return order.payment === 'Pending'
    return order.status.toLowerCase() === ordersFilter
  })

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
          <label className='flex items-center gap-2.5 cursor-pointer group'>
            <input
              type='radio'
              name='payment-type'
              defaultChecked
              className='accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer'
            />
            <span className='text-xs font-bold text-[var(--brand-600)]'>
              Link Payment — Xendit Test
            </span>
          </label>
          <label className='flex items-center gap-2.5 cursor-pointer group'>
            <input
              type='radio'
              name='payment-type'
              className='accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer'
            />
            <span className='text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors'>
              Manual Transfer
            </span>
          </label>
          <label className='flex items-center gap-2.5 cursor-pointer group'>
            <input
              type='radio'
              name='payment-type'
              className='accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer'
            />
            <span className='text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors'>
              Cash on Delivery
            </span>
          </label>

          {/* Gateway state */}
          <div className='mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm text-left'>
            <div className='text-[11px] font-bold text-emerald-700 mb-0.5'>
              Xendit Test Mode
            </div>
            <div className='text-[10px] text-emerald-600/80 mb-2 leading-tight'>
              Connected when backend Xendit Test Mode env is configured. Payment
              and order statuses remain separate.
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
        </div>
      </div>

      {/* 6. Actions */}
      <div>
        <OrderStepHeader num='6' title='Actions' />
        <div className='flex flex-col gap-2.5 mt-1.5'>
          <button className='bg-gradient-to-r from-[var(--brand-500)] to-[var(--ai-500)] w-full py-3 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer border-none'>
            Create & Send Payment Link
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
              const id = order.id || order._id || order.orderNumber || order.order_number
              const status = order.status || order.payment || order.paymentStatus || 'Draft'
              const amount = order.amount || order.total || order.totalAmount || order.grandTotal || 0
              const time = order.time || order.date || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—')
              return (
                <div
                  key={id}
                  className='flex items-center justify-between group cursor-pointer'
                  onClick={() => onOpenOrder && id && onOpenOrder(id)}
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0' />
                    <span className='text-[10px] font-mono text-slate-500 group-hover:text-[var(--brand-600)] transition-colors truncate'>
                      {id || 'ORDER'}
                    </span>
                  </div>
                  <span className='text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200'>
                    {status}
                  </span>
                  <span className='text-[10px] font-bold text-slate-700 text-right'>
                    {typeof amount === 'string' ? amount : formatRupiah(amount)}
                  </span>
                  <span className='text-[10px] text-slate-400 text-right'>
                    {time}
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
          ordersFilter={ordersFilter}
          setOrdersFilter={setOrdersFilter}
          onClose={() => setIsOrdersModalOpen(false)}
          onOpenOrder={onOpenOrder}
        />
      )}
      {isQuickAddModalOpen && (
        <QuickAddModal onClose={() => setIsQuickAddModalOpen(false)} />
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
        />
      )}
      {isViewCartModalOpen && (
        <ViewCartModal onClose={() => setIsViewCartModalOpen(false)} cartItems={displayCart} />
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

function ConversationOrdersModal({
  orders,
  ordersFilter,
  setOrdersFilter,
  onClose,
  onOpenOrder,
}) {
  return (
    <CommerceModal title='Conversation Orders' onClose={onClose} size='lg'>
      <div className='chat-prism-order-filters'>
        {['all', 'pending', 'paid', 'completed'].map((filter) => (
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
              <th>Date</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.id}</strong>
                </td>
                <td>
                  <strong>{order.date}</strong>
                  <small>{order.time}</small>
                </td>
                <td>
                  <strong>{order.amount}</strong>
                </td>
                <td>
                  <span className={order.payment.toLowerCase()}>
                    {order.payment}
                  </span>
                </td>
                <td>
                  <span className={order.status.toLowerCase()}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className='chat-prism-table-actions'>
                    {order.actions.map((action) => (
                      <button
                        key={action}
                        onClick={() =>
                          action === 'Open' && onOpenOrder?.(order.id)
                        }
                      >
                        {action}
                      </button>
                    ))}
                    <button>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='chat-prism-pagination-row'>
        <span>Showing 1 to {orders.length} of 18 orders</span>
        <div>
          <button>
            <ChevronLeft size={14} />
          </button>
          <button className='active'>1</button>
          <button>2</button>
          <button>3</button>
          <button>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </CommerceModal>
  )
}

function QuickAddModal({ onClose }) {
  return (
    <CommerceModal title='Quick Add Item' onClose={onClose} size='lg'>
      <div className='chat-prism-quick-add-grid'>
        <aside>
          <h3>Search & Add</h3>
          <div className='chat-prism-modal-search'>
            <Search size={14} />
            <input placeholder='Search product...' />
          </div>
          <h3>Recent / Popular</h3>
          {[
            'Thai Tea (Original)',
            'Lemon Tea',
            'Milk Tea',
            'Brown Sugar Milk',
          ].map((item) => (
            <button key={item}>
              <Coffee size={14} /> {item}
            </button>
          ))}
        </aside>
        <main>
          <h3>Item Details</h3>
          <CommerceField label='Product'>
            <select>
              <option>Thai Tea (Original)</option>
              <option>Lemon Tea</option>
            </select>
          </CommerceField>
          <CommerceField label='Variant'>
            <select>
              <option>Regular (16oz)</option>
              <option>Large (22oz)</option>
            </select>
          </CommerceField>
          <div className='chat-prism-modal-two-col'>
            <CommerceField label='Quantity'>
              <QtyInput value='1' />
            </CommerceField>
            <CommerceField label='Unit Price'>
              <input readOnly value='Rp 25.000' />
            </CommerceField>
          </div>
          <div className='chat-prism-modal-two-col'>
            <CommerceField label='Discount'>
              <input placeholder='0' />
            </CommerceField>
            <CommerceField label='Notes'>
              <input placeholder='Tambahkan catatan...' />
            </CommerceField>
          </div>
        </main>
      </div>
      <div className='chat-prism-custom-item-row'>
        <h3>Or add a custom item</h3>
        <input placeholder='Item name' />
        <QtyInput value='1' />
        <input placeholder='Rp 0' />
      </div>
      <div className='chat-prism-modal-actions'>
        <button onClick={onClose}>Cancel</button>
        <button className='primary'>Add to Order</button>
      </div>
    </CommerceModal>
  )
}

function BrowseProductsModal({ onClose, onViewCart, products = [], cartItems = [], outletName = 'Outlet', outletStatus = 'Active' }) {
  const summary = buildCartSummary(cartItems)
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
          {['All', 'Tea', 'Coffee', 'Snacks', 'Toppings'].map((cat, idx) => (
            <button key={cat} className={idx === 0 ? 'active' : ''}>
              {cat}
            </button>
          ))}
        </div>
        <div className='chat-prism-modal-search'>
          <Search size={14} />
          <input placeholder='Search product...' />
        </div>
      </div>
      <div className='chat-prism-product-note'>
        <Info size={16} /> Showing products available at this outlet. Some items
        may be out of stock.
      </div>
      <div className='chat-prism-product-grid'>
        {products.length > 0 ? products.map((product) => (
          <ProductCard key={product.id || product._id} product={product} />
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
          <button className='primary'>Add to order</button>
        </div>
      </div>
    </CommerceModal>
  )
}

function ViewCartModal({ onClose, cartItems = [] }) {
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
          <div key={item.id || item.product_id} className='chat-prism-cart-card'>
            <div className='chat-prism-product-thumb'>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className='chat-prism-cart-card-head'>
                <strong>{item.name || item.productNameSnapshot || 'Product'}</strong>
                <button>
                  <Trash2 size={15} />
                </button>
              </div>
              <small>{item.variant || item.variantNameSnapshot || (item.inferred ? 'Dari percakapan' : '')}</small>
              <b>{formatRupiah(getItemUnitPrice(item))}</b>
              <div className='chat-prism-cart-card-foot'>
                <QtyInput value={String(getItemQty(item))} />
                <button>
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
        <button className='primary'>Proceed to Order</button>
      </div>
    </CommerceModal>
  )
}

function ProductCard({ product }) {
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
        <QtyInput value='1' />
        <button>Add</button>
      </div>
    </div>
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

function QtyInput({ value }) {
  return (
    <div className='chat-prism-qty-input'>
      <button>-</button>
      <input readOnly value={value} />
      <button>+</button>
    </div>
  )
}

function AiTab({ chat }) {
  const isHuman = !!(
    chat.mode === 'human' ||
    chat.takenOverAt ||
    chat.takenOverBy
  )

  const formatTs = (d) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

  return (
    <div>
      <SectionTitle>AI Agent</SectionTitle>
      <Field
        label='Assigned agent'
        value={
          chat.agentName ||
          chat.assignedAgentName ||
          chat.assignedAgent ||
          'No agent assigned'
        }
      />
      <Field
        label='Conversation mode'
        value={isHuman ? 'Human agent' : 'AI managed'}
      />

      {isHuman && (
        <>
          <Divider />
          <SectionTitle>Takeover</SectionTitle>
          <Field
            label='Taken over by'
            value={chat.takenOverBy || chat.takenOverByName || 'Unknown'}
          />
          <Field label='Taken over at' value={formatTs(chat.takenOverAt)} />
          <Field
            label='Escalation reason'
            value={chat.escalationReason || 'Not specified'}
          />
        </>
      )}

      <Divider />
      <SectionTitle>Conversation</SectionTitle>
      <Field
        label='Status'
        value={
          chat.status
            ? chat.status.charAt(0).toUpperCase() + chat.status.slice(1)
            : '—'
        }
      />
      <Field label='Last updated' value={formatTs(chat.updatedAt)} />
      <Field label='Created' value={formatTs(chat.createdAt)} />
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
  // Initialize outlet from chat.currentOutletId so sidebar shows correct outlet immediately
  const [liveCartOutletId, setLiveCartOutletId] = useState(
    chat?.currentOutletId || chat?.current_outlet_id || null
  )
  const [liveOrders, setLiveOrders] = useState([])
  const [outletProductMap, setOutletProductMap] = useState({})

  // ── Fetch static data (outlets, products, orders) once per chat ───────────
  useEffect(() => {
    if (isDemoMode() || !chat?.workspaceId) return
    ;(async () => {
      try {
        const [oRes, pRes, ordRes] = await Promise.all([
          api.get('/outlets'),
          api.get('/products'),
          api.get('/orders'),
        ])
        const outlets = Array.isArray(oRes.data?.data) ? oRes.data.data : Array.isArray(oRes.data) ? oRes.data : []
        const products = Array.isArray(pRes.data?.data) ? pRes.data.data : Array.isArray(pRes.data) ? pRes.data : []
        const orders = Array.isArray(ordRes.data?.data) ? ordRes.data.data.slice(0, 5) : Array.isArray(ordRes.data) ? ordRes.data.slice(0, 5) : []

        setLiveOutlets(outlets)
        setLiveProducts(products)
        setLiveOrders(orders)

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
          } catch {}
        }
        setOutletProductMap(map)
      } catch (e) {
        console.warn('[ContextPanel] static data error:', e.message)
      }
    })()
  }, [chat?.workspaceId])

  // ── Poll cart every 5s so sidebar stays in sync with AI actions ───────────
  useEffect(() => {
    if (isDemoMode() || !chat?.workspaceId) return
    const chatId = chat?.id || chat?._id
    const contactId = typeof chat?.contactId === 'object' ? chat?.contactId?.id : chat?.contactId
    if (!chatId && !contactId) return

    const fetchCart = async () => {
      try {
        const params = {}
        if (chatId) params.chat_id = chatId
        if (contactId) params.contact_id = contactId
        const cRes = await api.get('/carts/current', { params }).catch(() => null)
        const httpStatus = cRes?.status
        const cart = cRes?.data?.data || cRes?.data || null
        if (cart && (cart.outletId || cart.outlet_id)) {
          // Cart exists → sync from it
          setLiveCartItems(cart.items || [])
          setLiveCartOutletId(cart.outletId || cart.outlet_id)
        } else if (httpStatus === 404 || !cart) {
          // No active cart — clear items but keep outlet from chat record
          setLiveCartItems([])
          // Refetch chat to get latest currentOutletId
          try {
            const chatRes = await api.get(`/chats/${chatId}`).catch(() => null)
            const updatedChat = chatRes?.data?.data || chatRes?.data || null
            const latestOutletId = updatedChat?.currentOutletId || updatedChat?.current_outlet_id
            if (latestOutletId) setLiveCartOutletId(latestOutletId)
          } catch {}
        } else {
          setLiveCartItems(cart.items || [])
        }
      } catch (e) {
        // silent — don't break UI if cart fetch fails
      }
    }

    fetchCart() // immediate
    const interval = setInterval(fetchCart, 5000)
    // Also refresh immediately when cart is cleared from sidebar
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
          />
        )}
        {activeTab === 'ai' && <AiTab chat={chat} />}
      </div>
    </div>
  )
}
