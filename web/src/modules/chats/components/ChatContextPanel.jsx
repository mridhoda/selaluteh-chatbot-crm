import React, { useState } from 'react'
import { Copy, ExternalLink, Send } from 'lucide-react'
import { useToast } from '../../../shared/components/feedback/Toast'

// ─── small helpers ─────────────────────────────────────────────────────────

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--brand-500)' : 'var(--text-muted)',
        background: 'none',
        border: 'none',
        borderBottom: active
          ? '2px solid var(--brand-500)'
          : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
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

  return (
    <div>
      <SectionTitle>Contact Info</SectionTitle>
      <Field label="Name" value={chat.contactName} />
      <Field
        label="Phone / Handle"
        value={phone}
        copyText
        onCopy={() => copy(phone)}
      />
      <Field
        label="First contact"
        value={
          firstContact
            ? new Date(firstContact).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : null
        }
      />

      {tags.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Tags</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((tag) => (
              <span
                key={tag}
                className="badge"
                style={{ fontSize: 11 }}
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        <Tab
          label="Contact"
          active={activeTab === 'contact'}
          onClick={() => setActiveTab('contact')}
        />
        <Tab
          label="Commerce"
          active={activeTab === 'commerce'}
          onClick={() => setActiveTab('commerce')}
        />
        <Tab
          label="AI & Assignment"
          active={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
        />
      </div>

      {/* Panel content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
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
