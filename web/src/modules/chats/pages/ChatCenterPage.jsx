import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useChats } from '../hooks/useChats'
import { useMessages } from '../hooks/useMessages'
import { chatsApi } from '../api/chatsApi'
import ChatList from '../components/ChatList'
import ChatPanel from '../components/ChatPanel'
import ChatContextPanel from '../components/ChatContextPanel'
import { useToast } from '../../../shared/components/feedback/Toast'

export default function ChatCenterPage() {
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [chatFilters, setChatFilters] = useState({})
  const [contextOpen, setContextOpen] = useState(true)

  const {
    data: chats,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useChats(chatFilters)

  const { messages, isLoading: messagesLoading } = useMessages(selectedChatId)

  const toast = useToast()

  const selectedChat =
    chats.find((c) => (c._id || c.id) === selectedChatId) || null

  // ── actions ────────────────────────────────────────────────────────────

  const handleSendMessage = async (content, replyTo) => {
    if (!selectedChatId) return
    try {
      await chatsApi.send(selectedChatId, { content, replyTo })
    } catch (e) {
      toast.error('Failed to send message')
    }
  }

  const handleTakeover = async () => {
    if (!selectedChatId) return
    try {
      await chatsApi.takeover(selectedChatId)
      toast.success('You took over this conversation')
      refetchChats()
    } catch (e) {
      toast.error((e && e.message) || 'Takeover failed')
    }
  }

  const handleResolve = async () => {
    if (!selectedChatId) return
    try {
      await chatsApi.resolve(selectedChatId)
      const chat = chats.find((c) => (c._id || c.id) === selectedChatId)
      const isResolved =
        chat && (chat.status === 'resolved' || chat.status === 'closed')
      toast.success(isResolved ? 'Conversation reopened' : 'Conversation resolved')
      refetchChats()
    } catch (e) {
      toast.error((e && e.message) || 'Action failed')
    }
  }

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        background: 'var(--app-background)',
        overflow: 'hidden',
      }}
    >
      {/* ── Left: Chat list — 320px ──────────────────────────────────────── */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--surface-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <ChatList
          chats={chats}
          selectedId={selectedChatId}
          onSelect={setSelectedChatId}
          isLoading={chatsLoading}
          filters={chatFilters}
          onFilterChange={setChatFilters}
        />
      </div>

      {/* ── Middle: Conversation panel — flex 1 ──────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          position: 'relative',
        }}
      >
        {/* toggle context panel button (top-right corner of message pane) */}
        {selectedChat && (
          <button
            className="btn ghost"
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              zIndex: 10,
              fontSize: 11,
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={() => setContextOpen((o) => !o)}
            title={contextOpen ? 'Hide context panel' : 'Show context panel'}
          >
            <ChevronDown
              size={12}
              style={{
                transform: contextOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.2s',
              }}
            />
            {contextOpen ? 'Hide info' : 'Show info'}
          </button>
        )}

        <ChatPanel
          chat={selectedChat}
          messages={messages}
          isLoading={messagesLoading}
          onSendMessage={handleSendMessage}
          onTakeover={handleTakeover}
          onResolve={handleResolve}
        />
      </div>

      {/* ── Right: Context panel — 360px, collapsible ────────────────────── */}
      {selectedChat && contextOpen && (
        <div
          style={{
            width: 360,
            flexShrink: 0,
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--surface-primary)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatContextPanel
            chat={selectedChat}
            onOpenOrder={(orderId) =>
              window.open('/app/orders?id=' + orderId, '_blank')
            }
          />
        </div>
      )}
    </div>
  )
}
