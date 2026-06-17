import React, { useState } from 'react'
import { Copy, ExternalLink, Send, AlertCircle, Ticket, ShoppingBag, Filter, ChevronDown, Plus, User, UserPlus, Bot, Shield, CheckCircle, Clock, Calendar, LayoutGrid } from 'lucide-react'
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

function CommerceTab({ chat, onOpenOrder, onResendPaymentLink }) {
  const toast = useToast()

  const ctx = chat.commerceContext || {}
  const outlet = chat.outletName || ctx.outletName || null
  const cartStatus = chat.cartStatus || ctx.cartStatus || null
  const latestOrder = chat.latestOrder || ctx.latestOrder || null
  const paymentLink = chat.paymentLink || ctx.paymentLink || null
  const paymentStatus = chat.paymentStatus || ctx.paymentStatus || null

  const copyLink = () => {
    if (!paymentLink) return
    navigator.clipboard.writeText(paymentLink).then(
      () => toast.success('Payment link copied!'),
      () => toast.error('Copy failed')
    )
  }

  const orderId = latestOrder && (latestOrder._id || latestOrder.id)

  return (
    <div>
      <SectionTitle>Outlet</SectionTitle>
      <Field label="Selected outlet" value={outlet} />

      <Divider />
      <SectionTitle>Cart</SectionTitle>
      <Field label="Cart status" value={cartStatus || 'No active cart'} />
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
          View cart
        </div>
        <span
          style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}
          title="Cart preview is not available in this version"
        >
          Not available
        </span>
      </div>

      {latestOrder && (
        <>
          <Divider />
          <SectionTitle>Latest Order</SectionTitle>
          <Field label="Order ID" value={orderId} />
          <Field label="Order status" value={latestOrder.status} />
          <Field label="Payment status" value={paymentStatus || latestOrder.paymentStatus} />
          {orderId && onOpenOrder && (
            <button
              className="btn ghost"
              style={{
                fontSize: 12,
                padding: '5px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 8,
              }}
              onClick={() => onOpenOrder(orderId)}
            >
              <ExternalLink size={11} />
              View order
            </button>
          )}
        </>
      )}

      {paymentLink && (
        <>
          <Divider />
          <SectionTitle>Payment Link</SectionTitle>
          <div
            style={{
              background: 'var(--surface-secondary)',
              borderRadius: 6,
              padding: '7px 10px',
              marginBottom: 8,
              wordBreak: 'break-all',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {paymentLink}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn ghost"
              style={{
                fontSize: 12,
                padding: '5px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              onClick={copyLink}
            >
              <Copy size={11} />
              Copy link
            </button>
            {onResendPaymentLink && (
              <button
                className="btn ghost"
                style={{
                  fontSize: 12,
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                onClick={() => onResendPaymentLink(chat._id || chat.id)}
              >
                <Send size={11} />
                Resend
              </button>
            )}
          </div>
        </>
      )}
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
