import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Check,
  MessageCircle,
  Bot,
  Search,
  MoreVertical,
  Plus,
  Image as ImageIcon,
  Smile,
  Keyboard,
  AlertCircle,
  Zap,
  FileText,
  Video,
  ShoppingBag,
  Mic,
  X,
  Loader2,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import api from '../../../shared/api/httpClient'
import {
  fetchProtectedFileObjectUrl,
  resolveAttachmentUrl,
} from '../../../shared/utils/fileAccess'

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

function useAuthenticatedAttachmentUrl(url) {
  const [resolvedUrl, setResolvedUrl] = useState(() => resolveAttachmentUrl(url))

  useEffect(() => {
    let objectUrl = null
    let cancelled = false
    const rawUrl = url || ''

    if (!rawUrl.startsWith('/files/')) {
      setResolvedUrl(resolveAttachmentUrl(rawUrl))
      return () => {}
    }

    ;(async () => {
      const result = await fetchProtectedFileObjectUrl({
        rawUrl,
        apiGet: api.get,
        fallbackBuilder: resolveAttachmentUrl,
      })
      if (cancelled) {
        result.revoke?.()
        return
      }
      objectUrl = result.viaBlob ? result.resolvedUrl : null
      setResolvedUrl(result.resolvedUrl)
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  return resolvedUrl
}

function normalizeMessageAttachment(message) {
  const attachment =
    message.rawPayload?.attachment ||
    message.raw_payload?.attachment ||
    message.attachment ||
    null
  if (!attachment) return null
  const normalized = { ...attachment }
  if (!normalized.url && normalized.storedName)
    normalized.url = `/files/${normalized.storedName}`
  if (normalized.type === 'location') return normalized
  if (!normalized.type) {
    const filename = normalized.filename || normalized.url || ''
    normalized.type =
      message.messageType === 'image' ||
      message.message_type === 'image' ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
        ? 'image'
        : 'document'
  }
  return normalized
}

function normalizeMessageActionButtons(message) {
  const rawPayload = message.rawPayload || message.raw_payload || {}
  const actionButtons = rawPayload.actionButtons || []
  if (actionButtons.length) {
    return actionButtons
      .filter((button) => button?.title || button?.text)
      .map((button) => ({
        id: button.id || button.callback_data,
        title: button.title || button.text,
      }))
  }

  const rows = rawPayload.replyMarkup?.inline_keyboard || rawPayload.reply_markup?.inline_keyboard || []
  return rows
    .flat()
    .filter((button) => button?.text)
    .map((button) => ({
      id: button.callback_data || button.id,
      title: button.text,
    }))
}

// ─── message bubble ────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const [imageShape, setImageShape] = useState('standard')
  const role =
    message.senderType || message.role || message.sender || message.from
  const isUser =
    message.direction === 'inbound' || role === 'user' || role === 'customer'
  const isAi =
    role === 'ai' ||
    role === 'assistant' ||
    role === 'bot' ||
    role === 'agent_ai'
  const isHuman =
    role === 'human' ||
    role === 'agent' ||
    role === 'human_agent' ||
    role === 'staff' ||
    role === 'admin'
  const isSystem =
    role === 'system' || role === 'event' || role === 'notification'

  const content = message.content || message.text || message.message || ''

  if (isSystem) {
    const isError =
      content.toLowerCase().includes('error') ||
      content.toLowerCase().includes('failed')
    if (isError) {
      return (
        <div className='chat-prism-error-row'>
          <span className='chat-prism-error-pill'>
            <AlertCircle size={12} className='chat-prism-error-icon' />
            <span>{content}</span>
            <span className='chat-prism-error-divider'>|</span>
            <span className='chat-prism-error-time'>
              {formatTime(message.createdAt || message.timestamp)}
            </span>
          </span>
        </div>
      )
    }
    return (
      <div className='chat-prism-system-row'>
        <span className='chat-prism-system-pill'>
          <Zap size={11} className='chat-prism-system-icon' />
          <span>{content}</span>
          <span className='chat-prism-system-divider'>|</span>
          <span className='chat-prism-system-time'>
            {formatTime(message.createdAt || message.timestamp)}
          </span>
        </span>
      </div>
    )
  }

  const attachment = normalizeMessageAttachment(message)
  const attachmentUrl = useAuthenticatedAttachmentUrl(attachment?.url)
  const isImage =
    attachment &&
    (attachment.type === 'image' ||
      (attachment.filename &&
        attachment.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)))
  const isLocation = attachment?.type === 'location'
  const displayContent = isLocation && content.trim() === '[Lokasi dibagikan]' ? '' : content
  const hasCaption = !!displayContent
  const actionButtons = normalizeMessageActionButtons(message)

  const handleImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (!naturalWidth || !naturalHeight) return
    const ratio = naturalWidth / naturalHeight
    if (ratio >= 1.45) {
      setImageShape('landscape')
    } else if (ratio <= 0.8) {
      setImageShape('portrait')
    } else {
      setImageShape('standard')
    }
  }

  return (
    <div className={`chat-prism-message-row ${isUser ? 'user' : 'agent'}`}>
      <div className='chat-prism-message-stack'>
        <div
          className={`chat-prism-bubble ${isUser ? 'user' : isHuman ? 'human' : 'ai'} ${isImage ? 'chat-prism-bubble-image-container' : ''} ${isLocation ? 'chat-prism-bubble-location-container' : ''} flex flex-col`}
        >
          {attachment &&
            (isLocation ? (
              <a
                href={attachment.url || `https://www.google.com/maps/search/?api=1&query=${attachment.latitude},${attachment.longitude}`}
                target='_blank'
                rel='noopener noreferrer'
                className={`chat-prism-location-card no-underline block ${isUser ? 'text-slate-900' : 'text-slate-900'}`}
              >
                <div className='chat-prism-location-map'>
                  <iframe
                    title='Location preview'
                    src={`https://maps.google.com/maps?q=${attachment.latitude},${attachment.longitude}&z=15&output=embed`}
                    className='chat-prism-location-map-frame'
                    loading='lazy'
                  />
                  <div className='chat-prism-location-map-overlay' />
                </div>
                <div className='chat-prism-location-body'>
                  <div className='chat-prism-location-title'>
                    {attachment.name || 'Shared location'}
                  </div>
                  {attachment.address && (
                    <div className='chat-prism-location-address'>
                      {attachment.address}
                    </div>
                  )}
                  <div className='chat-prism-location-link'>
                    Buka di Google Maps
                  </div>
                </div>
              </a>
            ) : isImage ? (
              <div className={`chat-prism-image-preview ${imageShape}`}>
                <img
                  src={attachmentUrl}
                  alt={attachment.filename || 'Attached image'}
                  className='chat-prism-image-preview-img'
                  onLoad={handleImageLoad}
                  onClick={() =>
                    window.open(attachmentUrl, '_blank')
                  }
                />
                {!hasCaption && (
                  <div className='absolute bottom-2 right-2 bg-black/55 backdrop-blur-[2px] px-2 py-0.5 rounded-full text-[9px] text-white flex items-center gap-1 font-semibold pointer-events-none select-none'>
                    <span>
                      {formatTime(message.createdAt || message.timestamp)}
                    </span>
                    {!isUser && <Check size={10} className='text-white/80' />}
                  </div>
                )}
              </div>
            ) : (
              <a
                href={attachmentUrl}
                target='_blank'
                rel='noopener noreferrer'
                className={`flex items-center gap-2 p-2.5 m-2 border rounded-xl decoration-none no-underline text-xs max-w-[280px] ${isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              >
                <FileText
                  size={16}
                  className={
                    isUser
                      ? 'text-white/80 shrink-0'
                      : 'text-slate-500 shrink-0'
                  }
                />
                <span className='truncate flex-1 font-semibold'>
                  {attachment.filename || 'Download File'}
                </span>
              </a>
            ))}
          {displayContent && (
            <div
              className={
                isImage
                  ? 'px-4 py-2.5 text-[13px] leading-relaxed break-words'
                  : ''
              }
            >
              {displayContent}
            </div>
          )}
          {actionButtons.length > 0 && (
            <div className='mt-3 flex flex-col gap-2'>
              {actionButtons.map((button) => (
                <button
                  key={button.id || button.title}
                  type='button'
                  className={`text-left rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${isUser ? 'border-white/30 bg-white/10 text-white' : 'border-white/30 bg-white/15 text-white hover:bg-white/25'}`}
                >
                  {button.title}
                </button>
              ))}
            </div>
          )}
        </div>
        {(!isImage || hasCaption) && (
          <div
            className={`chat-prism-message-meta ${isUser ? 'user' : 'agent'}`}
          >
            {isUser ? (
              <span>{formatTime(message.createdAt || message.timestamp)}</span>
            ) : (
              <>
                <span>
                  {(() => {
                    if (message.platformMessageId) return 'Sent'
                    const ageMs =
                      Date.now() -
                      new Date(message.createdAt || message.timestamp).getTime()
                    return ageMs < 8000 ? 'Sending...' : 'Sent'
                  })()}
                </span>
                <span className='chat-prism-meta-dot'>•</span>
                <span>
                  {formatTime(message.createdAt || message.timestamp)}
                </span>
                <span
                  className={
                    isHuman
                      ? 'chat-prism-agent-chip-badge human'
                      : 'chat-prism-agent-chip-badge ai'
                  }
                >
                  <Bot size={10} />
                  <span>
                    {isHuman ? message.agentName || 'Human Agent' : 'AI Agent'}
                  </span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

export default function ChatPanel({
  // New API
  chat: _chatNew,
  messages: _messagesNew,
  isLoading: _isLoadingNew,
  onSendMessage,
  onTakeover,
  onResolve,
  onDeleteChat,
  // Old API (DashboardPage Inbox)
  selected,
  onChatUpdate,
  replyingTo: _replyingTo,
  setReplyingTo: _setReplyingTo,
}) {
  const chat = _chatNew || selected || null
  const chatId = chat?._id || chat?.id || null

  const [localMessages, setLocalMessages] = useState([])
  const [localLoading, setLocalLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const userScrolled = useRef(false)
  const textareaRef = useRef(null)

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showEmojiMenu, setShowEmojiMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const attachmentMenuRef = useRef(null)
  const emojiMenuRef = useRef(null)
  const moreMenuRef = useRef(null)
  const imageInputRef = useRef(null)
  const docInputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target)
      ) {
        setShowAttachmentMenu(false)
      }
      if (
        emojiMenuRef.current &&
        !emojiMenuRef.current.contains(event.target)
      ) {
        setShowEmojiMenu(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFileUpload = async (file, type) => {
    if (!file) return
    setUploading(true)
    setShowAttachmentMenu(false)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('/agents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { filePath, originalName } = response.data
      setAttachment({
        url: filePath,
        filename: originalName,
        type: type || (file.type.startsWith('image/') ? 'image' : 'document'),
      })
    } catch (error) {
      console.error('File upload error:', error)
      alert('Gagal mengunggah file. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  useEffect(() => {
    if (_messagesNew !== undefined) {
      setLocalMessages(_messagesNew || [])
      return
    }
    if (!chatId) {
      setLocalMessages([])
      return
    }
    setLocalLoading(true)
    api
      .get(`/chats/${chatId}/messages`)
      .then((res) => {
        setLocalMessages(res.data || [])
      })
      .catch(console.error)
      .finally(() => setLocalLoading(false))
  }, [chatId, _messagesNew])

  const messages = localMessages
  const isLoading = _isLoadingNew !== undefined ? _isLoadingNew : localLoading

  const isResolved =
    chat && (chat.status === 'resolved' || chat.status === 'closed')
  const isHumanMode = chat && chat.aiEnabled === false

  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      })
    }
  }

  // Auto scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && !userScrolled.current) {
      setTimeout(() => scrollToBottom('smooth'), 50)
    }
  }, [messages])

  // Instant scroll on chat switch
  useEffect(() => {
    userScrolled.current = false
    setShowScrollButton(false)
    setTimeout(() => scrollToBottom('auto'), 50)
  }, [chatId])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    userScrolled.current = !atBottom
    setShowScrollButton(!atBottom)
  }

  const handleSend = async (e) => {
    e && e.preventDefault()
    const content = text.trim()
    if (!content && !attachment) return
    if (sending || isResolved) return
    setSending(true)
    setText('')
    const currentAttachment = attachment
    setAttachment(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    try {
      if (onSendMessage) {
        await onSendMessage(content, currentAttachment)
      } else if (chatId) {
        const res = await api.post(`/chats/${chatId}/send`, {
          text: content,
          attachment: currentAttachment,
        })
        setLocalMessages((prev) => [...prev, res.data])
        if (onChatUpdate) {
          onChatUpdate({
            ...chat,
            lastMessage: content || '[Lampiran]',
            lastMessageAt: new Date().toISOString(),
          })
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
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

  const handleTakeoverClick = async () => {
    if (onTakeover) {
      await onTakeover()
    } else if (chatId) {
      try {
        const isAIActive = chat && chat.aiEnabled !== false
        const endpoint = isAIActive ? 'takeover' : 'release'
        const res = await api.post(`/chats/${chatId}/${endpoint}`)
        const updatedChat = res.data?.data || res.data
        if (onChatUpdate) {
          onChatUpdate(updatedChat)
        }
      } catch (err) {
        console.error('Takeover action failed:', err)
      }
    }
  }

  if (!chat) {
    return (
      <div className='chat-prism-empty-panel'>
        <MessageCircle size={42} style={{ opacity: 0.25 }} />
        <p>Select a conversation to start</p>
      </div>
    )
  }

  const timeline = []
  messages.forEach((msg, i) => {
    const prev = messages[i - 1]
    const ts = msg.createdAt || msg.timestamp
    const prevTs = prev && (prev.createdAt || prev.timestamp)
    if (!prev || !sameDay(prevTs, ts)) {
      timeline.push({ type: 'date', date: ts, key: 'sep-' + i })
    }
    timeline.push({
      type: 'msg',
      message: msg,
      key: msg._id || msg.id || 'msg-' + i,
    })
  })

  return (
    <div className='chat-prism-panel'>
      <div className='chat-prism-pattern' />
      {/* ── Conversation header ─────────────────────────────────────────── */}
      <div className='chat-prism-chat-header'>
        {/* Left: Contact Info */}
        <div className='chat-prism-header-left'>
          <div className='chat-prism-contact-avatar'>
            {(chat.contactName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className='chat-prism-chat-title-area'>
            <span className='chat-prism-chat-name'>
              {chat.contactName || 'Unknown'}
            </span>
            <div className='chat-prism-chat-subtitle'>
              <span className='chat-prism-platform-badge'>
                {chat.platform && <BrandIcon type={chat.platform} size={10} />}
                <span>{chat.outletName || 'selaluteh.id'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Switch Action */}
        <div className='chat-prism-header-center flex items-center gap-3'>
          {chat.aiEnabled !== false ? (
            <div className='px-4 py-2 bg-[var(--ai-50)] text-[var(--ai-600)] border border-[var(--ai-100)] rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse'>
              <Bot size={16} /> AI Active
            </div>
          ) : (
            <button
              onClick={handleTakeoverClick}
              className='bg-gradient-to-r from-[var(--ai-500)] to-[var(--brand-500)] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-[var(--brand-500)]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-none cursor-pointer'
            >
              <Bot size={16} /> Switch to AI Agent
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className='chat-prism-header-right'>
          <button className='chat-prism-header-icon' title='Search in chat'>
            <Search size={18} />
          </button>
          <div className='chat-prism-header-divider' />

          <div className='chat-prism-more-menu-container' ref={moreMenuRef}>
            <button
              className={`chat-prism-header-icon ${showMoreMenu ? 'active' : ''}`}
              title='More options'
              onClick={() => setShowMoreMenu((prev) => !prev)}
            >
              <MoreVertical size={18} />
            </button>

            {showMoreMenu && (
              <div className='chat-prism-more-menu'>
                <button
                  type='button'
                  onClick={() => {
                    setShowMoreMenu(false)
                    if (onResolve) onResolve()
                  }}
                  className='chat-prism-more-menu-item'
                >
                  <Check size={14} className='text-emerald-500 shrink-0' />
                  <span>
                    {isResolved ? 'Buka Kembali Chat' : 'Selesaikan Chat'}
                  </span>
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowMoreMenu(false)
                    setShowDeleteConfirm(true)
                  }}
                  className='chat-prism-more-menu-item danger'
                >
                  <Trash2 size={14} className='shrink-0' />
                  <span>Hapus Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Message timeline ────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className='chat-prism-timeline'
      >
        {isLoading && messages.length === 0 ? (
          <div className='chat-prism-empty-messages'>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className='chat-prism-empty-messages'>
            No messages yet — start the conversation below
          </div>
        ) : (
          timeline.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className='chat-prism-date-row'>
                  <span>{formatDateLabel(item.date)}</span>
                </div>
              )
            }
            return <MessageBubble key={item.key} message={item.message} />
          })
        )}
      </div>

      {/* Scroll to Bottom Button Overlay */}
      {showScrollButton && (
        <button
          onClick={() => {
            userScrolled.current = false
            setShowScrollButton(false)
            scrollToBottom('smooth')
          }}
          className='absolute bottom-28 left-1/2 -translate-x-1/2 z-30 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer'
          title='Scroll to bottom'
        >
          <ChevronDown size={16} />
        </button>
      )}

      {/* ── Composer ────────────────────────────────────────────────────── */}
      <div className='p-5 z-20 bg-gradient-to-t from-white via-white/80 to-transparent'>
        {isResolved ? (
          <div className='chat-prism-resolved-note text-center py-2 text-slate-500 text-sm'>
            This conversation is resolved.{' '}
            <button
              className='chat-prism-inline-button text-[var(--brand-500)] border-none bg-transparent underline cursor-pointer font-bold'
              onClick={onResolve}
            >
              Reopen
            </button>{' '}
            to send messages.
          </div>
        ) : chat.aiEnabled !== false ? (
          // Takeover Button Mode
          <div className='flex justify-center py-2.5'>
            <button
              onClick={handleTakeoverClick}
              className='flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-[var(--ai-500)] to-[var(--brand-500)] text-white border-none rounded-full shadow-lg shadow-[var(--brand-500)]/20 hover:scale-105 active:scale-95 transition-all group cursor-pointer'
            >
              <div className='w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-[var(--brand-500)] transition-colors shrink-0'>
                <Keyboard size={15} />
              </div>
              <div className='text-left'>
                <div className='text-xs font-extrabold leading-tight'>
                  Takeover Chat
                </div>
                <div className='text-[10px] text-white/80 font-medium leading-none mt-0.5'>
                  Switch to manual typing
                </div>
              </div>
            </button>
          </div>
        ) : (
          // Standard Input Mode
          <div className='relative flex flex-col gap-2 p-3 bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 ring-1 ring-slate-50 focus-within:ring-2 focus-within:ring-[var(--brand-100)] focus-within:border-[var(--brand-200)] transition-all'>
            {/* Hidden Input Files */}
            <input
              type='file'
              ref={imageInputRef}
              style={{ display: 'none' }}
              accept='image/*'
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'image')
                }
                e.target.value = ''
              }}
            />
            <input
              type='file'
              ref={docInputRef}
              style={{ display: 'none' }}
              accept='.pdf,.doc,.docx,.xls,.xlsx,.txt'
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'document')
                }
                e.target.value = ''
              }}
            />

            {/* Plus / Attachment Menu */}
            {showAttachmentMenu && (
              <div
                ref={attachmentMenuRef}
                className='absolute left-2 bottom-full mb-3 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/30 p-2 flex flex-col gap-1 w-48 animate-in fade-in slide-in-from-bottom-2 duration-200 z-30'
              >
                <button
                  type='button'
                  onClick={() => imageInputRef.current.click()}
                  className='flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:text-[var(--brand-500)] hover:bg-[var(--brand-50)]/50 rounded-xl border-none bg-transparent text-left cursor-pointer transition-all'
                >
                  <ImageIcon size={16} className='text-[var(--brand-500)]' />
                  <span className='text-xs font-semibold'>Image & Video</span>
                </button>
                <button
                  type='button'
                  onClick={() => docInputRef.current.click()}
                  className='flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:text-[var(--brand-500)] hover:bg-[var(--brand-50)]/50 rounded-xl border-none bg-transparent text-left cursor-pointer transition-all'
                >
                  <FileText size={16} className='text-blue-500' />
                  <span className='text-xs font-semibold'>Document</span>
                </button>
                <button
                  type='button'
                  onClick={() => {
                    alert('Menautkan produk toko sedang dalam pengembangan!')
                    setShowAttachmentMenu(false)
                  }}
                  className='flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:text-[var(--brand-500)] hover:bg-[var(--brand-50)]/50 rounded-xl border-none bg-transparent text-left cursor-pointer transition-all'
                >
                  <ShoppingBag size={16} className='text-emerald-500' />
                  <span className='text-xs font-semibold'>Product Link</span>
                </button>
                <button
                  type='button'
                  onClick={() => {
                    alert('Perekam suara sedang dalam pengembangan!')
                    setShowAttachmentMenu(false)
                  }}
                  className='flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:text-[var(--brand-500)] hover:bg-[var(--brand-50)]/50 rounded-xl border-none bg-transparent text-left cursor-pointer transition-all'
                >
                  <Mic size={16} className='text-amber-500' />
                  <span className='text-xs font-semibold'>Audio File</span>
                </button>
              </div>
            )}

            {/* Emoji Menu */}
            {showEmojiMenu && (
              <div
                ref={emojiMenuRef}
                className='absolute right-12 bottom-full mb-3 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl shadow-slate-100/30 p-3 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200 z-30'
              >
                <div className='text-[10px] font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider'>
                  Popular Emojis
                </div>
                <div className='grid grid-cols-8 gap-1 max-h-40 overflow-y-auto pr-1 select-none'>
                  {[
                    '😀',
                    '😃',
                    '😄',
                    '😁',
                    '😆',
                    '😅',
                    '😂',
                    '🤣',
                    '😊',
                    '😇',
                    '🙂',
                    '🙃',
                    '😉',
                    '😌',
                    '😍',
                    '🥰',
                    '😘',
                    '😗',
                    '😙',
                    '😚',
                    '😋',
                    '😛',
                    '😝',
                    '😜',
                    '🤪',
                    '🤨',
                    '🧐',
                    '🤓',
                    '😎',
                    '🤩',
                    '🥳',
                    '😏',
                    '😒',
                    '😞',
                    '😔',
                    '😟',
                    '😕',
                    '🙁',
                    '☹️',
                    '😣',
                    '😖',
                    '😫',
                    '😩',
                    '🥺',
                    '😢',
                    '😭',
                    '😤',
                    '😠',
                    '😡',
                    '🤬',
                    '🤯',
                    '😳',
                    '🥵',
                    '🥶',
                    '😱',
                    '😨',
                    '😰',
                    '😥',
                    '😓',
                    '🤗',
                    '🤔',
                    '🤭',
                    '🤫',
                    '🤥',
                    '😶',
                    '😐',
                    '😑',
                    '😬',
                    '🙄',
                    '😯',
                    '😦',
                    '😧',
                    '😮',
                    '😲',
                    '🥱',
                    '😴',
                    '🤤',
                    '😪',
                    '😵',
                    '🤐',
                    '🥴',
                    '🤢',
                    '🤮',
                    '🤧',
                    '😷',
                    '🤒',
                    '🤕',
                    '👍',
                    '👎',
                    '👏',
                    '🙌',
                    '🙏',
                    '❤️',
                    '🔥',
                    '✨',
                    '🎉',
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type='button'
                      onClick={() => handleEmojiSelect(emoji)}
                      className='text-lg p-1 hover:bg-slate-100 active:scale-90 rounded transition-all cursor-pointer border-none bg-transparent flex items-center justify-center'
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Uploading indicator */}
            {uploading && (
              <div className='flex items-center gap-2 pl-2 mb-2 text-slate-500 animate-pulse'>
                <Loader2
                  size={16}
                  className='animate-spin text-[var(--brand-500)]'
                />
                <span className='text-xs font-semibold'>Uploading file...</span>
              </div>
            )}

            {/* Attachment Preview (Inside the border) */}
            {attachment && (
              <div className='flex pl-1 mb-2 animate-in fade-in zoom-in-95 duration-200'>
                {attachment.type === 'image' ? (
                  <div className='relative w-20 h-20 group'>
                    <img
                      src={getAttachmentUrl(attachment.url)}
                      alt='preview'
                      className='w-full h-full object-cover rounded-xl border border-slate-100 animate-fade-in'
                    />
                    <button
                      type='button'
                      onClick={() => setAttachment(null)}
                      className='absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full flex items-center justify-center border border-white cursor-pointer shadow-sm transition-all hover:scale-110'
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className='relative flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl pr-8 max-w-[240px]'>
                    <div className='w-8 h-8 bg-[var(--brand-50)] text-[var(--brand-500)] rounded-lg flex items-center justify-center flex-shrink-0'>
                      <FileText size={16} />
                    </div>
                    <div className='min-w-0 text-left flex flex-col justify-center'>
                      <p className='text-xs font-bold text-slate-800 truncate m-0 leading-tight'>
                        {attachment.filename}
                      </p>
                      <p className='text-[10px] text-slate-400 capitalize m-0 mt-0.5 leading-none'>
                        {attachment.type}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => setAttachment(null)}
                      className='absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors'
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input Row */}
            <div className='flex items-end gap-2 w-full'>
              <button
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className='p-2.5 text-slate-400 hover:text-[var(--brand-500)] hover:bg-[var(--brand-50)] rounded-full border-none bg-transparent cursor-pointer transition-colors'
                type='button'
              >
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
                placeholder='Type your message...'
                className='w-full bg-transparent border-none px-2 py-2.5 text-sm focus:ring-0 outline-none resize-none min-h-[36px] max-h-32 text-slate-700 placeholder-slate-400 font-medium self-center'
                rows={1}
                disabled={sending}
              />

              <div className='flex items-center gap-1 pb-0.5 pr-0.5'>
                <button
                  onClick={() => imageInputRef.current.click()}
                  className='p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-none bg-transparent cursor-pointer rounded-full transition-colors'
                  type='button'
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                  className='p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-none bg-transparent cursor-pointer rounded-full transition-colors'
                  type='button'
                >
                  <Smile size={18} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={
                    (!text.trim() && !attachment) || sending || uploading
                  }
                  className={`${(text.trim() || attachment) && !uploading ? 'bg-gradient-to-r from-[var(--brand-500)] to-[var(--ai-500)] shadow-md cursor-pointer' : 'bg-slate-100 text-slate-300 cursor-not-allowed'} w-10 h-10 border-none rounded-full flex items-center justify-center transition-all duration-300 ml-1`}
                >
                  <Send
                    size={18}
                    className={
                      (text.trim() || attachment) && !uploading
                        ? 'text-white ml-0.5'
                        : 'ml-0.5'
                    }
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className='chat-prism-modal-overlay'
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className='chat-prism-modal-dialog'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='chat-prism-modal-icon-wrap'>
              <AlertTriangle size={28} />
            </div>
            <h3 className='chat-prism-modal-title'>Hapus Chat?</h3>
            <p className='chat-prism-modal-body text-center'>
              Apakah Anda yakin ingin menghapus chat dengan{' '}
              <strong>{chat.contactName || 'Unknown'}</strong> secara permanen?
              Semua riwayat chat di database akan ikut terhapus dan tidak dapat
              dikembalikan.
            </p>
            <div className='chat-prism-modal-actions'>
              <button
                type='button'
                className='chat-prism-modal-btn cancel'
                onClick={() => setShowDeleteConfirm(false)}
              >
                Batal
              </button>
              <button
                type='button'
                className='chat-prism-modal-btn danger'
                onClick={async () => {
                  setShowDeleteConfirm(false)
                  if (onDeleteChat) {
                    await onDeleteChat(chatId)
                  }
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
