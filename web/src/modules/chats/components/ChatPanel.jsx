import React, { useState, useRef, useEffect } from 'react'
import { Send, Check, MessageCircle, Bot, Search, MoreVertical, Plus, Image as ImageIcon, Smile, Keyboard, AlertCircle, Zap } from 'lucide-react'
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
    const isError = content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')
    if (isError) {
      return (
        <div className="chat-prism-error-row">
          <span className="chat-prism-error-pill">
            <AlertCircle size={12} className="chat-prism-error-icon" />
            <span>{content}</span>
            <span className="chat-prism-error-divider">|</span>
            <span className="chat-prism-error-time">{formatTime(message.createdAt || message.timestamp)}</span>
          </span>
        </div>
      )
    }
    return (
      <div className="chat-prism-system-row">
        <span className="chat-prism-system-pill">
          <Zap size={11} className="chat-prism-system-icon" />
          <span>{content}</span>
          <span className="chat-prism-system-divider">|</span>
          <span className="chat-prism-system-time">{formatTime(message.createdAt || message.timestamp)}</span>
        </span>
      </div>
    )
  }

  return (
    <div className={`chat-prism-message-row ${isUser ? 'user' : 'agent'}`}>
      <div className="chat-prism-message-stack">
        <div className={`chat-prism-bubble ${isUser ? 'user' : isHuman ? 'human' : 'ai'}`}>
          {content}
        </div>
        <div className={`chat-prism-message-meta ${isUser ? 'user' : 'agent'}`}>
          {isUser ? (
            <>
              <span>{formatTime(message.createdAt || message.timestamp)}</span>
              <span className="chat-prism-meta-dot">•</span>
              <span>Sent</span>
            </>
          ) : (
            <>
              <span>Read</span>
              <span className="chat-prism-meta-dot">•</span>
              <span>{formatTime(message.createdAt || message.timestamp)}</span>
              <span className={isHuman ? 'chat-prism-agent-chip-badge human' : 'chat-prism-agent-chip-badge ai'}>
                <Bot size={10} />
                <span>{isHuman ? (message.agentName || 'Human Agent') : 'AI Agent'}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

// Backward-compatible ChatPanel — supports both old DashboardPage Inbox API
// (selected, onChatUpdate, replyingTo, setReplyingTo)
// and new ChatCenterPage API (chat, messages, isLoading, onSendMessage, onTakeover, onResolve)

export default function ChatPanel({ 
  // New API
  chat: _chatNew, messages: _messagesNew, isLoading,
  onSendMessage, onTakeover, onResolve,
  // Old API (DashboardPage Inbox)
  selected, onChatUpdate, replyingTo: _replyingTo, setReplyingTo: _setReplyingTo
}) {
  // ─── Backward-compat: normalize old (DashboardPage selected) and new (ChatCenterPage chat) API
  const chat = _chatNew || selected || null
  const messages = Array.isArray(_messagesNew) ? _messagesNew : (selected?.messages || [])

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
      <div className="chat-prism-empty-panel">
        <MessageCircle size={42} style={{ opacity: 0.25 }} />
        <p>
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
    <div className="chat-prism-panel">
      <div className="chat-prism-pattern" />
      {/* ── Conversation header ─────────────────────────────────────────── */}
      <div className="chat-prism-chat-header">
        {/* Left: Contact Info */}
        <div className="chat-prism-header-left">
          <div className="chat-prism-contact-avatar">
            {(chat.contactName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="chat-prism-chat-title-area">
            <span className="chat-prism-chat-name">
              {chat.contactName || 'Unknown'}
            </span>
            <div className="chat-prism-chat-subtitle">
              <span className="chat-prism-platform-badge">
                {chat.platform && <BrandIcon type={chat.platform} size={10} />}
                <span>{chat.outletName || 'selaluteh.id'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Switch Action */}
        <div className="chat-prism-header-center">
          <button
            className={isHumanMode ? 'chat-prism-ai-button active' : 'chat-prism-ai-button'}
            onClick={onTakeover}
            title={isHumanMode ? 'Return to AI' : 'Take over conversation from AI'}
          >
            <Bot size={16} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 700, lineHeight: 1 }}>Switch to</span>
              <span style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.1, marginTop: '2px' }}>{isHumanMode ? 'AI Agent' : 'Human Mode'}</span>
            </span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="chat-prism-header-right">
          <button
            className="chat-prism-header-icon"
            title="Search in chat"
          >
            <Search size={18} />
          </button>
          <div className="chat-prism-header-divider" />
          <button className="chat-prism-header-icon" title="More options">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* ── Message timeline ────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-prism-timeline"
      >
        {isLoading && messages.length === 0 ? (
          <div className="chat-prism-empty-messages">
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-prism-empty-messages">
            No messages yet — start the conversation below
          </div>
        ) : (
          timeline.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="chat-prism-date-row">
                  <span>
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
        className="chat-prism-composer-zone"
      >
        {isResolved ? (
          <div className="chat-prism-resolved-note">
            This conversation is resolved.{' '}
            <button
              className="chat-prism-inline-button"
              onClick={onResolve}
            >
              Reopen
            </button>{' '}
            to send messages.
          </div>
        ) : !isHumanMode ? (
          <div className="chat-prism-takeover-wrap">
            <button className="chat-prism-takeover-button" onClick={onTakeover}>
              <span className="chat-prism-takeover-icon"><Keyboard size={20} /></span>
              <span>
                <strong>Takeover Chat</strong>
                <small>Switch to manual typing</small>
              </span>
            </button>
          </div>
        ) : (
          <div className="chat-prism-composer">
            <button className="chat-prism-composer-icon" type="button">
              <Plus size={20} />
            </button>
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
              className="chat-prism-textarea"
            />
            <div className="chat-prism-composer-tools">
              <button className="chat-prism-tool-button" type="button"><ImageIcon size={18} /></button>
              <button className="chat-prism-tool-button" type="button"><Smile size={18} /></button>
            <button
              className={`chat-prism-send-button ${text.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!text.trim() || sending}
            >
              <Send size={18} />
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
