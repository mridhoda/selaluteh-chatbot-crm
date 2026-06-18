import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy,
  CreditCard,
  Edit2,
  ExternalLink,
  Filter,
  Info,
  Instagram,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react'

const outlets = [
  { id: 'ST_SMG', name: 'Selalu Teh - Semarang City', location: 'Semarang, Central Java', status: 'Active', initials: 'ST' },
  { id: 'ST_BDO', name: 'Selalu Teh - Bandung', location: 'Bandung, West Java', status: 'Active', initials: 'SB' },
  { id: 'ST_JKT', name: 'Selalu Teh - Jakarta', location: 'Jakarta, DKI Jakarta', status: 'Active', initials: 'SJ' },
  { id: 'ST_SUB', name: 'Selalu Teh - Surabaya', location: 'Surabaya, East Java', status: 'Busy', initials: 'SS' },
  { id: 'ST_YOG', name: 'Selalu Teh - Yogyakarta', location: 'Yogyakarta, DI Yogyakarta', status: 'Offline', initials: 'SY' },
]

const conversationOrders = [
  { id: 'ORD-1028', date: 'May 7, 2025', time: '10:15 AM', amount: 'Rp 111.000', payment: 'Paid', status: 'Completed', actions: ['Open', 'Duplicate'] },
  { id: 'ORD-1027', date: 'May 7, 2025', time: '09:15 AM', amount: 'Rp 91.500', payment: 'Pending', status: 'Preparing', actions: ['Open', 'Resend'] },
  { id: 'ORD-1026', date: 'May 6, 2025', time: '02:49 PM', amount: 'Rp 85.000', payment: 'Paid', status: 'Completed', actions: ['Open', 'Duplicate'] },
  { id: 'ORD-1025', date: 'May 4, 2025', time: '11:42 AM', amount: 'Rp 65.000', payment: 'Paid', status: 'Completed', actions: ['Open', 'Duplicate'] },
  { id: 'ORD-1024', date: 'May 2, 2025', time: '04:22 PM', amount: 'Rp 120.000', payment: 'Pending', status: 'Preparing', actions: ['Open', 'Resend'] },
]

const products = [
  { id: 'p1', name: 'Matcha Latte', category: 'Tea', price: 'Rp 28.000', stock: 'In stock', icon: 'tea', badge: 'Bestseller' },
  { id: 'p2', name: 'Lemon Tea', category: 'Tea', price: 'Rp 18.000', stock: 'In stock', icon: 'coffee' },
  { id: 'p3', name: 'Kopi Susu Gula Aren', category: 'Coffee', price: 'Rp 24.000', stock: 'Low stock', icon: 'coffee' },
]

const cartItems = [
  { id: 'c1', name: 'Selkop Hoodie', variant: 'Navy / L', qty: 1, price: 'Rp 120.000', total: 'Rp 120.000' },
  { id: 'c2', name: 'Selkop Tumbler', variant: 'White / 500ml', qty: 2, price: 'Rp 85.000', total: 'Rp 170.000' },
  { id: 'c3', name: 'Selkop Tote Bag', variant: 'Canvas / Natural', qty: 1, price: 'Rp 65.000', total: 'Rp 65.000' },
]

const chats = [
  { name: 'alanyogaasikin', channel: 'selaluteh.id', message: 'Super Admin IT Core self assigned...', time: '11/17', active: true, unread: 2 },
  { name: 'Rezakia', channel: 'Selalu Teh by Ori', message: 'Betul sekali, Tetangga...', time: '11/08' },
  { name: 'Taufiq', channel: 'Selalu Teh by Ori', message: 'Tetanggaku Taufiq, untuk order...', time: '11/03' },
  { name: 'HASAN', channel: 'Selalu Teh by Ori', message: 'Terimakasih.. Saya sangat...', time: 'Fri 13:49', unread: 1 },
]

const messages = [
  { type: 'system', text: 'Conversation assigned to Faris Akbar', time: '20:12' },
  { type: 'agent', text: 'Halo! Aku Ori, asisten virtual di sini yang akan membantu menjawab seputar franchise.', time: '20:12' },
  { type: 'user', text: 'Dapatkah saya mengetahui lebih lanjut tentang franchise Selalu Teh?', time: '20:12' },
  { type: 'system', text: 'Super Admin IT Core self assigned to this conversation', time: '09:51' },
]

export default function ChatCenterPage() {
  const [rightPanelTab, setRightPanelTab] = useState('orders')
  const [selectedOutletId, setSelectedOutletId] = useState('ST_SMG')
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false)
  const [ordersFilter, setOrdersFilter] = useState('all')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false)
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false)
  const [isViewCartModalOpen, setIsViewCartModalOpen] = useState(false)
  const [messageInput, setMessageInput] = useState('')

  const selectedOutlet = useMemo(
    () => outlets.find((outlet) => outlet.id === selectedOutletId) || outlets[0],
    [selectedOutletId]
  )

  const filteredOrders = conversationOrders.filter((order) => {
    if (ordersFilter === 'all') return true
    if (ordersFilter === 'paid') return order.payment === 'Paid'
    if (ordersFilter === 'pending') return order.payment === 'Pending'
    return order.status.toLowerCase() === ordersFilter
  })

  return (
    <div className="chat-commerce-shell">
      <aside className="chat-commerce-inbox">
        <div className="chat-commerce-inbox-header">
          <div>
            <h1>Messages</h1>
            <span>12 New</span>
          </div>
          <div className="chat-commerce-icon-row">
            <button><Filter size={17} /></button>
            <button><Plus size={17} /></button>
          </div>
        </div>

        <div className="chat-commerce-search">
          <Search size={16} />
          <input placeholder="Search chats..." />
        </div>

        <div className="chat-commerce-tabs">
          <button className="active">Assigned <b>120</b></button>
          <button>Unassigned</button>
          <button>Mentions</button>
        </div>

        <div className="chat-commerce-chat-list">
          {chats.map((chat) => (
            <button key={chat.name} className={`chat-commerce-chat-item ${chat.active ? 'active' : ''}`}>
              <div className="chat-commerce-avatar">{chat.name[0]}</div>
              <div>
                <strong>{chat.name}</strong>
                <small>{chat.channel}</small>
                <p>{chat.message}</p>
              </div>
              <div className="chat-commerce-chat-meta">
                <span>{chat.time}</span>
                {chat.unread ? <b>{chat.unread}</b> : null}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-commerce-main">
        <header className="chat-commerce-thread-header">
          <div className="chat-commerce-contact">
            <div className="chat-commerce-avatar large">A</div>
            <div>
              <h2>alanyogaasikin</h2>
              <span><Instagram size={12} /> selaluteh.id</span>
            </div>
          </div>
          <button className="chat-commerce-ai-button"><Bot size={16} /> Switch to AI Agent</button>
        </header>

        <div className="chat-commerce-thread">
          {messages.map((message, index) => (
            message.type === 'system' ? (
              <div key={`${message.type}-${index}`} className="chat-commerce-system-message">
                <Sparkles size={12} /> {message.text} <span>{message.time}</span>
              </div>
            ) : (
              <div key={`${message.type}-${index}`} className={`chat-commerce-bubble-row ${message.type}`}>
                <div className="chat-commerce-bubble">
                  {message.text}
                </div>
                <small>{message.time}</small>
              </div>
            )
          ))}
        </div>

        <div className="chat-commerce-composer">
          <button><Plus size={20} /></button>
          <textarea
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Type your message..."
            rows={1}
          />
          <button className="send"><Send size={18} /></button>
        </div>
      </main>

      <aside className="chat-commerce-details">
        <div className="chat-commerce-detail-tabs">
          <button className={rightPanelTab === 'info' ? 'active' : ''} onClick={() => setRightPanelTab('info')}>Info</button>
          <button className={rightPanelTab === 'ticket' ? 'active' : ''} onClick={() => setRightPanelTab('ticket')}>Ticket</button>
          <button className={rightPanelTab === 'orders' ? 'active' : ''} onClick={() => setRightPanelTab('orders')}>Orders</button>
        </div>

        {rightPanelTab === 'orders' ? (
          <OrdersSidebar
            selectedOutlet={selectedOutlet}
            selectedOutletId={selectedOutletId}
            setSelectedOutletId={setSelectedOutletId}
            isOutletDropdownOpen={isOutletDropdownOpen}
            setIsOutletDropdownOpen={setIsOutletDropdownOpen}
            onOpenPayment={() => setIsPaymentModalOpen(true)}
            onOpenOrders={() => setIsOrdersModalOpen(true)}
            onOpenQuickAdd={() => setIsQuickAddModalOpen(true)}
            onOpenBrowse={() => setIsBrowseModalOpen(true)}
            onOpenCart={() => setIsViewCartModalOpen(true)}
          />
        ) : (
          <InfoSidebar tab={rightPanelTab} />
        )}
      </aside>

      {isPaymentModalOpen && <PaymentSetupModal onClose={() => setIsPaymentModalOpen(false)} />}
      {isOrdersModalOpen && (
        <ConversationOrdersModal
          orders={filteredOrders}
          ordersFilter={ordersFilter}
          setOrdersFilter={setOrdersFilter}
          onClose={() => setIsOrdersModalOpen(false)}
        />
      )}
      {isQuickAddModalOpen && <QuickAddModal onClose={() => setIsQuickAddModalOpen(false)} />}
      {isBrowseModalOpen && (
        <BrowseProductsModal
          onClose={() => setIsBrowseModalOpen(false)}
          onViewCart={() => {
            setIsBrowseModalOpen(false)
            setIsViewCartModalOpen(true)
          }}
        />
      )}
      {isViewCartModalOpen && <ViewCartModal onClose={() => setIsViewCartModalOpen(false)} />}
    </div>
  )
}

function OrdersSidebar({
  selectedOutlet,
  selectedOutletId,
  setSelectedOutletId,
  isOutletDropdownOpen,
  setIsOutletDropdownOpen,
  onOpenPayment,
  onOpenOrders,
  onOpenQuickAdd,
  onOpenBrowse,
  onOpenCart,
}) {
  return (
    <div className="chat-commerce-orders-panel">
      <section className="chat-commerce-step outlet-step">
        <StepHeader num="1" title="Outlet" />
        <button className={`chat-commerce-select ${isOutletDropdownOpen ? 'open' : ''}`} onClick={() => setIsOutletDropdownOpen(!isOutletDropdownOpen)}>
          <span>{selectedOutlet.name}</span>
          <ChevronDown size={14} />
        </button>

        {isOutletDropdownOpen && (
          <div className="chat-commerce-outlet-menu">
            <div className="chat-commerce-outlet-search">
              <Search size={14} />
              <input placeholder="Search outlet..." />
            </div>
            <button className="chat-commerce-outlet-option current" onClick={() => { setSelectedOutletId('ST_SMG'); setIsOutletDropdownOpen(false) }}>
              <span><MapPin size={14} /></span>
              <div><strong>Use current outlet</strong><small>Selalu Teh - Semarang City</small></div>
              {selectedOutletId === 'ST_SMG' && <CheckCircle2 size={16} />}
            </button>
            {outlets.map((outlet) => {
              const isSelected = selectedOutletId === outlet.id
              return (
                <button key={outlet.id} className={`chat-commerce-outlet-option ${isSelected ? 'selected' : ''}`} onClick={() => { setSelectedOutletId(outlet.id); setIsOutletDropdownOpen(false) }}>
                  <span>{outlet.initials}</span>
                  <div><strong>{outlet.name}</strong><small>{outlet.location}</small></div>
                  <em className={outlet.status.toLowerCase()}>{outlet.status}</em>
                  {isSelected && <Check size={14} />}
                </button>
              )
            })}
            <button className="chat-commerce-manage-outlets">Manage outlets <ExternalLink size={14} /></button>
          </div>
        )}
      </section>

      <section className="chat-commerce-step">
        <StepHeader num="2" title="Cart" />
        <div className="chat-commerce-cart-line">
          <span><ShoppingCart size={14} /> 3 items • Rp 110.000</span>
          <button onClick={onOpenCart}>View cart</button>
        </div>
      </section>

      <section className="chat-commerce-step">
        <StepHeader num="3" title="Quick add product" />
        <div className="chat-commerce-mini-search">
          <Search size={14} />
          <input placeholder="Search product..." />
        </div>
        <div className="chat-commerce-two-buttons">
          <button className="primary" onClick={onOpenQuickAdd}>Add item</button>
          <button onClick={onOpenBrowse}>Browse</button>
        </div>
      </section>

      <section className="chat-commerce-step">
        <StepHeader num="4" title="Order summary" />
        <SummaryRows />
      </section>

      <section className="chat-commerce-step">
        <StepHeader num="5" title="Payment" />
        <div className="chat-commerce-radio-list">
          <label className="selected"><span /> Link Payment</label>
          <label><span /> Manual Transfer</label>
          <label><span /> Cash on Delivery</label>
        </div>
        <div className="chat-commerce-warning-box">
          <strong>No payment gateway connected</strong>
          <p>Set up Midtrans or Xendit to send payment link.</p>
          <button onClick={onOpenPayment}>Set up now <ArrowRight size={10} /></button>
        </div>
      </section>

      <section className="chat-commerce-step">
        <StepHeader num="6" title="Actions" />
        <button className="chat-commerce-create-order">Create Order</button>
        <button className="chat-commerce-save-draft"><Bookmark size={14} /> Save Draft</button>
      </section>

      <section className="chat-commerce-step">
        <div className="chat-commerce-step-title-row">
          <StepHeader num="7" title="Conversation orders" />
          <button onClick={onOpenOrders}>View all</button>
        </div>
        <div className="chat-commerce-order-history">
          {conversationOrders.slice(0, 3).map((order) => (
            <div key={order.id}>
              <span>{order.id}</span>
              <b>{order.payment}</b>
              <strong>{order.amount}</strong>
              <small>{order.time}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function InfoSidebar({ tab }) {
  return (
    <div className="chat-commerce-info-panel">
      <div className="chat-commerce-profile-card">
        <h2>{tab === 'ticket' ? 'Ticket Board' : 'alanyogaasikin'}</h2>
        <p><Instagram size={14} /> selaluteh.id</p>
        <button><Copy size={14} /> Copy contact</button>
      </div>
      <div className="chat-commerce-empty-state">
        <MessageCircle size={24} />
        <strong>{tab === 'ticket' ? 'No tickets yet' : 'Customer info is ready'}</strong>
        <span>{tab === 'ticket' ? 'Create and track support tickets from this panel.' : 'Use Orders tab to create order from this conversation.'}</span>
      </div>
    </div>
  )
}

function PaymentSetupModal({ onClose }) {
  return (
    <ModalShell size="medium" onClose={onClose} title="Set Up Payment" subtitle="Connect a payment gateway or use manual payment to start receiving payments." icon={<Sparkles size={22} />}>
      <div className="chat-commerce-provider-list">
        <ProviderCard highlighted title="Midtrans" badge="Recommended" description="Accept payments via VA, e-Wallet, Cards, and more." action="Connect Midtrans" />
        <ProviderCard title="Xendit" badge="Not Connected" description="Payments for Indonesia & SEA. Cards, VA, QRIS." action="Connect Xendit" />
        <ProviderCard title="Manual Payment" badge="Not Connected" description="Confirm payments manually by bank transfer, cash, and other offline methods." action="Set Up Manual" icon={<Wallet size={22} />} />
      </div>
      <div className="chat-commerce-modal-grid two">
        <div className="chat-commerce-requirements">
          <h3>Payment Requirements</h3>
          <p><CheckCircle2 size={16} /> Business information is complete</p>
          <p><CheckCircle2 size={16} /> Bank account is added</p>
          <p className="muted"><AlertTriangle size={16} /> Upload identity document</p>
        </div>
        <div className="chat-commerce-warning-box modal-warning">
          <strong>Environment keys are not configured</strong>
          <p>You need to configure Midtrans / Xendit environment keys to go live.</p>
          <button>Go to Settings</button>
        </div>
      </div>
      <div className="chat-commerce-modal-actions">
        <button onClick={onClose}>Not now</button>
        <button className="primary">Continue Setup</button>
      </div>
    </ModalShell>
  )
}

function ConversationOrdersModal({ orders, ordersFilter, setOrdersFilter, onClose }) {
  return (
    <ModalShell size="large" onClose={onClose} title="Conversation Orders">
      <div className="chat-commerce-order-filters">
        {['all', 'pending', 'paid', 'completed'].map((filter) => (
          <button key={filter} className={ordersFilter === filter ? 'active' : ''} onClick={() => setOrdersFilter(filter)}>{filter}</button>
        ))}
      </div>
      <div className="chat-commerce-orders-table-wrap">
        <table className="chat-commerce-orders-table">
          <thead>
            <tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td><strong>{order.date}</strong><small>{order.time}</small></td>
                <td><strong>{order.amount}</strong></td>
                <td><span className={order.payment.toLowerCase()}>{order.payment}</span></td>
                <td><span className={order.status.toLowerCase()}>{order.status}</span></td>
                <td>
                  <div className="chat-commerce-table-actions">
                    {order.actions.map((action) => <button key={action}>{action}</button>)}
                    <button><MoreHorizontal size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chat-commerce-pagination">
        <span>Showing 1 to {orders.length} of 18 orders</span>
        <div><button><ChevronLeft size={14} /></button><button className="active">1</button><button>2</button><button>3</button><button><ChevronRight size={14} /></button></div>
      </div>
    </ModalShell>
  )
}

function QuickAddModal({ onClose }) {
  return (
    <ModalShell size="large" onClose={onClose} title="Quick Add Item">
      <div className="chat-commerce-quick-add">
        <aside>
          <h3>Search & Add</h3>
          <div className="chat-commerce-mini-search"><Search size={14} /><input placeholder="Search product..." /></div>
          <h3>Recent / Popular</h3>
          {['Thai Tea (Original)', 'Lemon Tea', 'Milk Tea', 'Brown Sugar Milk'].map((item) => <button key={item}><Coffee size={14} /> {item}</button>)}
        </aside>
        <main>
          <h3>Item Details</h3>
          <FormField label="Product"><select><option>Thai Tea (Original)</option><option>Lemon Tea</option></select></FormField>
          <FormField label="Variant"><select><option>Regular (16oz)</option><option>Large (22oz)</option></select></FormField>
          <div className="chat-commerce-modal-grid two">
            <FormField label="Quantity"><QtyInput value="1" /></FormField>
            <FormField label="Unit Price"><input readOnly value="Rp 25.000" /></FormField>
          </div>
          <div className="chat-commerce-modal-grid two">
            <FormField label="Discount"><input placeholder="0" /></FormField>
            <FormField label="Notes"><input placeholder="Tambahkan catatan..." /></FormField>
          </div>
        </main>
      </div>
      <div className="chat-commerce-custom-item">
        <h3>Or add a custom item</h3>
        <input placeholder="Item name" />
        <QtyInput value="1" />
        <input placeholder="Rp 0" />
      </div>
      <div className="chat-commerce-modal-actions"><button onClick={onClose}>Cancel</button><button className="primary">Add to Order</button></div>
    </ModalShell>
  )
}

function BrowseProductsModal({ onClose, onViewCart }) {
  return (
    <ModalShell size="large" onClose={onClose} title="Browse products" leading={<button className="chat-commerce-back" onClick={onClose}><ArrowLeft size={18} /></button>}>
      <div className="chat-commerce-browse-head">
        <span>Outlet: <b>Selalu Teh - Senayan City</b> <ChevronDown size={14} /></span>
        <em>Open • Closes at 22:00</em>
      </div>
      <div className="chat-commerce-product-toolbar">
        <div>{['All', 'Tea', 'Coffee', 'Snacks', 'Toppings'].map((cat, idx) => <button key={cat} className={idx === 0 ? 'active' : ''}>{cat}</button>)}</div>
        <div className="chat-commerce-mini-search"><Search size={14} /><input placeholder="Search product..." /></div>
      </div>
      <div className="chat-commerce-info-note"><Info size={16} /><span>Showing products available at this outlet. Some items may be out of stock.</span></div>
      <div className="chat-commerce-product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      <div className="chat-commerce-sticky-cart">
        <div><ShoppingCart size={20} /><span><strong>2 items selected</strong><small>Subtotal Rp 46.000</small></span></div>
        <div><button onClick={onViewCart}>View cart</button><button className="primary">Add to order</button></div>
      </div>
    </ModalShell>
  )
}

function ViewCartModal({ onClose }) {
  return (
    <ModalShell size="small" onClose={onClose} title="View Cart" subtitle="You have 3 item(s) in your cart">
      <div className="chat-commerce-cart-items">
        {cartItems.map((item) => (
          <div key={item.id} className="chat-commerce-cart-card">
            <div className="chat-commerce-product-icon"><ShoppingBag size={22} /></div>
            <div>
              <div className="chat-commerce-cart-card-head"><strong>{item.name}</strong><button><Trash2 size={15} /></button></div>
              <small>{item.variant}</small>
              <b>{item.price}</b>
              <div className="chat-commerce-cart-card-foot"><QtyInput value={String(item.qty)} /><button><Edit2 size={14} /></button><strong>{item.total}</strong></div>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-commerce-promo"><Tag size={16} /><input placeholder="Promo Code" /><button>Apply</button></div>
      <SummaryRows large />
      <div className="chat-commerce-free-shipping"><CheckCircle2 size={16} /><div><strong>Free shipping unlocked!</strong><span>Add Rp 78.615 more to get free shipping.</span></div></div>
      <div className="chat-commerce-modal-actions"><button onClick={onClose}>Continue Editing</button><button className="primary">Proceed to Order</button></div>
    </ModalShell>
  )
}

function ModalShell({ children, leading, icon, onClose, size = 'medium', subtitle, title }) {
  return (
    <div className="chat-commerce-modal-root">
      <button className="chat-commerce-modal-backdrop" onClick={onClose} aria-label="Close modal" />
      <div className={`chat-commerce-modal chat-commerce-modal--${size}`}>
        <header>
          <div className="chat-commerce-modal-title-row">
            {leading}
            <div>
              <h2>{icon}{title}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <div className="chat-commerce-modal-body">{children}</div>
      </div>
    </div>
  )
}

function ProviderCard({ action, badge, description, highlighted, icon, title }) {
  return (
    <div className={`chat-commerce-provider-card ${highlighted ? 'highlighted' : ''}`}>
      <div className="chat-commerce-provider-icon">{icon || <CreditCard size={22} />}</div>
      <div><strong>{title}</strong><p>{description}</p></div>
      <div><span>{badge}</span><button>{action}</button></div>
    </div>
  )
}

function ProductCard({ product }) {
  return (
    <div className="chat-commerce-product-card">
      <div className="chat-commerce-product-icon">{product.icon === 'tea' ? <Coffee size={30} /> : <Coffee size={30} />}</div>
      <div>
        <strong>{product.name}</strong>
        {product.badge ? <span><Sparkles size={9} /> {product.badge}</span> : <i />}
        <b>{product.price}</b>
        <small className={product.stock === 'Low stock' ? 'low' : ''}>{product.stock}</small>
      </div>
      <div><QtyInput value="1" /><button>Add</button></div>
    </div>
  )
}

function FormField({ children, label }) {
  return <label className="chat-commerce-field"><span>{label}</span>{children}</label>
}

function QtyInput({ value }) {
  return <div className="chat-commerce-qty"><button>-</button><input readOnly value={value} /><button>+</button></div>
}

function SummaryRows({ large }) {
  return (
    <div className={`chat-commerce-summary ${large ? 'large' : ''}`}>
      <p><span>Subtotal</span><b>Rp 100.000</b></p>
      <p className="discount"><span>Discount</span><b>- Rp 10.000</b></p>
      <p><span>Shipping</span><b>Rp 10.000</b></p>
      <p><span>VAT (11%)</span><b>Rp 11.000</b></p>
      <strong><span>Total</span><b>Rp 111.000</b></strong>
    </div>
  )
}

function StepHeader({ num, title }) {
  return (
    <div className="chat-commerce-step-header">
      <span>{num}</span>
      <h3>{title}</h3>
    </div>
  )
}
