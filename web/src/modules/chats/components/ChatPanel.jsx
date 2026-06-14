import React, { useState, useRef, useEffect } from 'react'
import { Send, UserCheck, RotateCcw, Check, MessageCircle } from 'lucide-react'
import BrandIcon from '../../../shared/components/brand/BrandIcon'

// ─── helpers ───────────────────────────────────────────────────────────────

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateLabel(d) {
  if (!d) return ''
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function sameDay(a, b) {
  if (!a || !b) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// ─── message bubble ────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const role = message.role || message.sender || message.from
  const isUser = role === 'user' || role === 'customer'
  const isAi =
    role === 'ai' || role === 'assistant' || role === 'bot' || role === 'agent_ai'
  const isHuman =
    role === 'human' ||
    role === 'agent' ||
    role === 'human_agent' ||
    role === 'staff'
  const isSystem = role === 'system' || role === 'event' || role === 'notification'

  const content = message.content || message.text || message.message || ''

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--surface-secondary)',
            borderRadius: 20,
            padding: '3px 12px',
            display: 'inline-block',
          }}
        >
          {content}
        </span>
      </div>
    )
  }

  const bubbleBg = isUser
    ? 'var(--ai-500)'
    : isHuman
    ? 'var(--brand-500)'
    : 'var(--surface-secondary)'
  const bubbleColor = isUser || isHuman ? '#fff' : 'var(--text-primary)'
  const bubbleRadius = isUser
    ? '16px 4px 16px 16px'
    : '4px 16px 16px 16px'

  const avatarLabel = isHuman ? 'A' : 'AI'
  const avatarBg = isHuman ? 'var(--brand-500)' : 'var(--surface-tertiary)'
  const avatarColor = isHuman ? '#fff' : 'var(--text-muted)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 7,
        marginBottom: 3,
        alignItems: 'flex-end',
        maxWidth: '80%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {/* avatar for non-user */}
      {!isUser && (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: avatarBg,
            color: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {avatarLabel}
        </div>
      )}

      <div>
        <div
          style={{
            background: bubbleBg,
            color: bubbleColor,
            borderRadius: bubbleRadius,
            padding: '8px 12px',
            fontSize: 13,
            lineHeight: 1.5,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 3,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {formatTime(message.createdAt || message.timestamp)}
          {isHuman && message.agentName ? ' · ' + message.agentName : ''}
        </div>
      </div>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

export default function ChatPanel({
  chat,
  messages = [],
  isLoading,
  onSendMessage,
  onTakeover,
  onResolve,
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const userScrolled = useRef(false)
  const textareaRef = useRef(null)

  const isResolved =
    chat && (chat.status === 'resolved' || chat.status === 'closed')
  const isHumanMode =
    chat && (chat.mode === 'human' || !!chat.takenOverAt || !!chat.takenOverBy)

  // auto-scroll to bottom on new messages (unless user scrolled up)
  useEffect(() => {
    if (!userScrolled.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // reset userScrolled when chat changes
  useEffect(() => {
    userScrolled.current = false
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chat && (chat._id || chat.id)])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    userScrolled.current = !atBottom
  }

  const handleSend = async (e) => {
    e && e.preventDefault()
    const content = text.trim()
    if (!content || sending || isResolved) return
    setSending(true)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    try {
      await onSendMessage(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const autoResize = (el) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ── no chat selected ─────────────────────────────────────────────────────

  if (!chat) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          gap: 12,
          background: 'var(--app-background)',
        }}
      >
        <MessageCircle size={42} style={{ opacity: 0.25 }} />
        <p style={{ fontSize: 14, margin: 0 }}>
          Select a conversation to start
        </p>
      </div>
    )
  }

  // ── build timeline with date separators ──────────────────────────────────

  const timeline = []
  messages.forEach((msg, i) => {
    const prev = messages[i - 1]
    const ts = msg.createdAt || msg.timestamp
    const prevTs = prev && (prev.createdAt || prev.timestamp)
    if (!prev || !sameDay(prevTs, ts)) {
      timeline.push({ type: 'date', date: ts, key: 'sep-' + i })
    }
    timeline.push({ type: 'msg', message: msg, key: msg._id || msg.id || 'msg-' + i })
  })

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Conversation header ─────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          background: 'var(--surface-primary)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {chat.contactName || 'Unknown'}
            </span>
            {chat.platform && <BrandIcon name={chat.platform} size={14} />}
            {chat.outletName && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  background: 'var(--surface-secondary)',
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                {chat.outletName}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{isHumanMode ? '🧑 Human agent mode' : '🤖 AI mode'}</span>
            <span>·</span>
            <span
              style={{
                color: isResolved
                  ? 'var(--success-600)'
                  : 'var(--text-muted)',
              }}
            >
              {isResolved ? 'Resolved' : 'Open'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="btn ghost"
            style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={onTakeover}
            title={isHumanMode ? 'Return to AI' : 'Take over conversation from AI'}
          >
            {isHumanMode ? (
              <>
                <RotateCcw size={12} />
                Return to AI
              </>
            ) : (
              <>
                <UserCheck size={12} />
                Take over
              </>
            )}
          </button>
          <button
            className="btn ghost"
            style={{
              fontSize: 12,
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: isResolved
                ? 'var(--text-primary)'
                : 'var(--success-600)',
            }}
            onClick={onResolve}
          >
            <Check size={12} />
            {isResolved ? 'Reopen' : 'Resolve'}
          </button>
        </div>
      </div>

      {/* ── Message timeline ────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              paddingTop: 40,
            }}
          >
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              paddingTop: 40,
            }}
          >
            No messages yet — start the conversation below
          </div>
        ) : (
          timeline.map((item) => {
            if (item.type === 'date') {
              return (
                <div
                  key={item.key}
                  style={{ textAlign: 'center', margin: '12px 0 6px' }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      background: 'var(--surface-secondary)',
                      borderRadius: 20,
                      padding: '3px 12px',
                    }}
                  >
                    {formatDateLabel(item.date)}
                  </span>
                </div>
              )
            }
            return (
              <MessageBubble key={item.key} message={item.message} />
            )
          })
        )}
      </div>

      {/* ── Composer ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-primary)',
          flexShrink: 0,
        }}
      >
        {isResolved ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
              padding: '8px 0',
            }}
          >
            This conversation is resolved.{' '}
            <button
              className="btn ghost"
              style={{ fontSize: 12, padding: '2px 8px' }}
              onClick={onResolve}
            >
              Reopen
            </button>{' '}
            to send messages.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                autoResize(e.target)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              disabled={sending}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                padding: '8px 12px',
                fontSize: 13,
                background: 'var(--surface-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                minHeight: 38,
                maxHeight: 120,
                overflowY: 'auto',
                lineHeight: 1.5,
                fontFamily: 'inherit',
              }}
            />
            <button
              className="btn"
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                padding: '8px 14px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
