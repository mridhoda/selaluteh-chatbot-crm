import React, { useState } from 'react'
import { Copy, ExternalLink, Send, AlertCircle, Ticket, ShoppingBag, Filter, ChevronDown, Plus, User, UserPlus, Bot, Shield, CheckCircle, Clock, Calendar, LayoutGrid, ShoppingCart, Bookmark, Search, ArrowRight } from 'lucide-react'
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
    <div className="chat-prism-info-sections">
      <section className="chat-prism-profile-block">
        <div className="chat-prism-profile-title-row">
          <h2>{chat.contactName || 'Unknown'}</h2>
          <button onClick={() => copy(phone || chat.contactName)} title="Copy contact">
            <Copy size={16} />
          </button>
        </div>
        <div className="chat-prism-profile-channel">
          {chat.platform || 'Channel'} {phone ? `· ${phone}` : ''}
        </div>
        <button className="chat-prism-select-status">
          <span><Filter size={14} /> Select Pipeline Status</span>
          <ChevronDown size={14} />
        </button>
      </section>

      <InfoDivider />

      <InfoHeader title="Labels" action="Add Label" icon={<Plus size={12} />} />
      <p className="chat-prism-muted-line">{tags.length ? tags.join(', ') : 'No labels yet'}</p>

      <InfoDivider />

      <AccordionMini title="Session History">
        <p className="chat-prism-center-muted">No sessions available</p>
      </AccordionMini>

      <InfoDivider />

      <div>
        <label className="chat-prism-section-label">Handled By</label>
        <button className="chat-prism-assignee-card">
          <span className="chat-prism-assignee-icon"><User size={14} /></span>
          <strong>{chat.takenOverByName || chat.takenOverBy || 'Super Admin IT Core'}</strong>
          <ChevronDown size={14} />
        </button>
      </div>

      <InfoDivider />

      <InfoHeader title="Collaborators" action="Add Collaborator" icon={<UserPlus size={14} />} />
      <p className="chat-prism-muted-line">No collaborators yet</p>

      <InfoDivider />

      <div>
        <label className="chat-prism-section-label">Notes</label>
        <textarea className="chat-prism-notes" placeholder="Add a note..." />
      </div>

      <InfoDivider />

      <div>
        <label className="chat-prism-section-label">AI Summary</label>
        <button className="chat-prism-summary-button">Generate AI Summary</button>
      </div>

      <InfoDivider />

      <AccordionMini title="Additional Data">
        <button className="chat-prism-outline-action">Add New Additional Info</button>
      </AccordionMini>

      <InfoDivider />

      <div>
        <h4 className="chat-prism-section-label">Conversation Details</h4>
        <DetailMini label="Assigned By" value="—" icon={<User size={12} />} />
        <DetailMini label="Handled By" value={chat.takenOverByName || chat.takenOverBy || 'Super Admin IT Core'} icon={<User size={12} />} />
        <DetailMini label="Resolved By" value="—" icon={<User size={12} />} />
        <DetailMini label="AI Handoff At" value="—" icon={<Bot size={12} />} />
        <DetailMini label="Assigned At" value="—" icon={<Clock size={12} />} />
        <DetailMini label="Created At" value={formattedFirstContact} icon={<Calendar size={12} />} highlight />
        <DetailMini label="Resolved At" value="—" icon={<CheckCircle size={12} />} />
      </div>

      <InfoDivider />

      <div className="chat-prism-access-grid">
        <label className="chat-prism-section-label">Conversation Access</label>
        <button><Shield size={14} /> Active - Click to Block</button>
        <label className="chat-prism-section-label">AI Access</label>
        <button><Bot size={14} /> AI Active - Click to Block</button>
      </div>

      <InfoDivider />

      <div className="chat-prism-ticket-block">
        <label className="chat-prism-section-label">Tickets</label>
        <button className="chat-prism-ticket-board"><span><LayoutGrid size={14} /> Default Board</span><ChevronDown size={14} /></button>
        <p className="chat-prism-center-muted">No tickets yet</p>
      </div>
    </div>
  )
}

function InfoDivider() {
  return <div className="chat-prism-info-divider" />
}

function InfoHeader({ title, action, icon }) {
  return (
    <div className="chat-prism-info-header">
      <h4>{title}</h4>
      <button>{icon}{action}</button>
    </div>
  )
}

function AccordionMini({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button className="chat-prism-accordion-title" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <ChevronDown size={14} className={open ? 'open' : ''} />
      </button>
      {open && children}
    </div>
  )
}

function DetailMini({ label, value, icon, highlight }) {
  return (
    <div className="chat-prism-detail-mini">
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
    <div className="flex items-center gap-2 mb-1.5 select-none">
      <div className="w-5 h-5 rounded-full border border-[var(--ai-200)] text-[var(--ai-700)] flex items-center justify-center text-[10px] font-bold bg-[var(--ai-50)] shadow-sm shrink-0">
        {num}
      </div>
      <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">{title}</h3>
    </div>
  )
}

function CommerceTab({ chat, onOpenOrder }) {
  const ctx = chat.commerceContext || {}
  const outlet = chat.outletName || ctx.outletName || null

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Outlet */}
      <div>
        <OrderStepHeader num="1" title="Outlet" />
        <div className="w-full mt-1.5 relative">
          <select className="w-full appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-[var(--brand-300)] focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)] outline-none cursor-pointer transition-all shadow-sm">
            <option>{outlet || 'Selalu Teh - Senayan City'}</option>
            <option>Selalu Teh - Gandaria City</option>
            <option>Selalu Teh - Grand Indonesia</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* 2. Cart */}
      <div>
        <OrderStepHeader num="2" title="Cart" />
        <div className="mt-1.5 flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <ShoppingCart size={14} className="text-slate-400 shrink-0" />
            <span>3 items</span>
            <span className="text-slate-300">•</span>
            <span>Rp 110.000</span>
          </div>
          <button className="px-3 py-1.5 bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-100)] rounded-lg text-xs font-bold hover:bg-[var(--brand-100)] transition-colors cursor-pointer">
            View cart
          </button>
        </div>
      </div>

      {/* 3. Quick Add */}
      <div>
        <OrderStepHeader num="3" title="Quick add product" />
        <div className="mt-1.5 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search product..." 
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[var(--brand-100)] focus:border-[var(--brand-300)] outline-none transition-all shadow-sm placeholder-slate-400" 
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-gradient-to-r from-[var(--brand-500)] to-[var(--ai-500)] flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer border-none">
              Add item
            </button>
            <button className="flex-1 py-2.5 bg-white text-[var(--brand-600)] border border-[var(--brand-200)] text-xs font-bold rounded-xl hover:bg-[var(--brand-50)] transition-colors shadow-sm cursor-pointer">
              Browse
            </button>
          </div>
        </div>
      </div>

      {/* 4. Order Summary */}
      <div>
        <OrderStepHeader num="4" title="Order summary" />
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mt-1.5 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>Subtotal</span>
            <span className="text-slate-700">Rp 100.000</span>
          </div>
          <div className="flex justify-between text-xs text-[var(--brand-500)] font-semibold">
            <span>Discount</span>
            <span>- Rp 10.000</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>Shipping</span>
            <span className="text-slate-700">Rp 10.000</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>VAT (11%)</span>
            <span className="text-slate-700">Rp 11.000</span>
          </div>
          <div className="h-[1px] bg-slate-100 my-2" />
          <div className="flex justify-between text-sm font-bold text-slate-800">
            <span>Total</span>
            <span className="text-[var(--brand-600)]">Rp 111.000</span>
          </div>
        </div>
      </div>

      {/* 5. Payment */}
      <div>
        <OrderStepHeader num="5" title="Payment" />
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mt-1.5 space-y-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input type="radio" name="payment-type" defaultChecked className="accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer" />
            <span className="text-xs font-bold text-[var(--brand-600)]">Link Payment</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input type="radio" name="payment-type" className="accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer" />
            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Manual Transfer</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input type="radio" name="payment-type" className="accent-[var(--brand-500)] h-4 w-4 border-slate-300 cursor-pointer" />
            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Cash on Delivery</span>
          </label>

          {/* Warning Box */}
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 shadow-sm text-left">
            <div className="text-[11px] font-bold text-amber-700 mb-0.5">No payment gateway connected</div>
            <div className="text-[10px] text-amber-600/80 mb-2 leading-tight">Set up Midtrans or Xendit to send payment link.</div>
            <button className="text-[10px] font-bold text-amber-700 flex items-center gap-1 hover:underline border-none bg-transparent cursor-pointer p-0">
              Set up now <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Actions */}
      <div>
        <OrderStepHeader num="6" title="Actions" />
        <div className="flex flex-col gap-2.5 mt-1.5">
          <button className="bg-gradient-to-r from-[var(--brand-500)] to-[var(--ai-500)] w-full py-3 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer border-none">
            Create Order
          </button>
          <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
            <Bookmark size={14} className="text-slate-400 shrink-0" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* 7. History */}
      <div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mt-1.5">
          <div className="flex items-center justify-between mb-3">
            <OrderStepHeader num="7" title="Conversation orders" />
            <button className="text-[10px] font-bold text-[var(--ai-600)] hover:underline border-none bg-transparent cursor-pointer">View all</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => onOpenOrder && onOpenOrder('ORD-1028')}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-[var(--brand-600)] transition-colors truncate">ORD-1028</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Draft</span>
              <span className="text-[10px] font-bold text-slate-700 text-right">Rp 111.000</span>
              <span className="text-[10px] text-slate-400 text-right">10:15 AM</span>
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => onOpenOrder && onOpenOrder('ORD-1027')}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-[var(--brand-600)] transition-colors truncate">ORD-1027</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">Pending</span>
              <span className="text-[10px] font-bold text-slate-700 text-right">Rp 98.500</span>
              <span className="text-[10px] text-slate-400 text-right">Yesterday</span>
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => onOpenOrder && onOpenOrder('ORD-1026')}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-[var(--brand-600)] transition-colors truncate">ORD-1026</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Paid</span>
              <span className="text-[10px] font-bold text-slate-700 text-right">Rp 85.000</span>
              <span className="text-[10px] text-slate-400 text-right">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
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
        label="Assigned agent"
        value={
          chat.agentName ||
          chat.assignedAgentName ||
          chat.assignedAgent ||
          'No agent assigned'
        }
      />
      <Field
        label="Conversation mode"
        value={isHuman ? 'Human agent' : 'AI managed'}
      />

      {isHuman && (
        <>
          <Divider />
          <SectionTitle>Takeover</SectionTitle>
          <Field
            label="Taken over by"
            value={chat.takenOverBy || chat.takenOverByName || 'Unknown'}
          />
          <Field
            label="Taken over at"
            value={formatTs(chat.takenOverAt)}
          />
          <Field
            label="Escalation reason"
            value={chat.escalationReason || 'Not specified'}
          />
        </>
      )}

      <Divider />
      <SectionTitle>Conversation</SectionTitle>
      <Field
        label="Status"
        value={
          chat.status
            ? chat.status.charAt(0).toUpperCase() + chat.status.slice(1)
            : '—'
        }
      />
      <Field
        label="Last updated"
        value={formatTs(chat.updatedAt)}
      />
      <Field
        label="Created"
        value={formatTs(chat.createdAt)}
      />
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

export default function ChatContextPanel({ chat, onOpenOrder, onResendPaymentLink }) {
  const [activeTab, setActiveTab] = useState('contact')

  if (!chat) return null

  return (
    <div className="chat-prism-context-panel">
      {/* Tabs */}
      <div className="chat-prism-context-tabs">
        <Tab
          label="Info"
          icon={<AlertCircle size={16} />}
          active={activeTab === 'contact'}
          onClick={() => setActiveTab('contact')}
        />
        <Tab
          label="Ticket"
          icon={<Ticket size={16} />}
          active={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        />
        <Tab
          label="Orders"
          icon={<ShoppingBag size={16} />}
          active={activeTab === 'commerce'}
          onClick={() => setActiveTab('commerce')}
        />
      </div>

      {/* Panel content */}
      <div className="chat-prism-context-content">
        {activeTab === 'contact' && <ContactTab chat={chat} />}
        {activeTab === 'commerce' && (
          <CommerceTab
            chat={chat}
            onOpenOrder={onOpenOrder}
            onResendPaymentLink={onResendPaymentLink}
          />
        )}
        {activeTab === 'ai' && <AiTab chat={chat} />}
      </div>
    </div>
  )
}
