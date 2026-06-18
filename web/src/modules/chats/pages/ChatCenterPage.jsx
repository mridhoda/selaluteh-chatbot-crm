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
  const [chatFilters, setChatFilters] = useState({ assignment: 'assigned' })
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

  const handleSendMessage = async (content, attachment, replyTo) => {
    if (!selectedChatId) return
    try {
      await chatsApi.send(selectedChatId, { content, attachment, replyTo })
    } catch (e) {
      toast.error('Failed to send message')
    }
  }

  const handleTakeover = async () => {
    if (!selectedChatId) return
    const isAIActive = selectedChat && selectedChat.aiEnabled !== false
    try {
      if (isAIActive) {
        await chatsApi.takeover(selectedChatId)
        toast.success('You took over this conversation')
      } else {
        await chatsApi.release(selectedChatId)
        toast.success('AI Agent is now active')
      }
      refetchChats()
    } catch (e) {
      toast.error((e && e.message) || 'Action failed')
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

  const handleDeleteChat = async (chatId) => {
    try {
      await chatsApi.delete(chatId)
      toast.success('Chat berhasil dihapus')
      setSelectedChatId(null)
      refetchChats()
    } catch (e) {
      toast.error((e && e.message) || 'Gagal menghapus chat')
    }
  }

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="chat-prism-shell">
      {/* ── Left: Chat list — 320px ──────────────────────────────────────── */}
      <div className="chat-prism-list-column">
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
      <div className="chat-prism-main-column">
        {/* toggle context panel button (top-right corner of message pane) */}
        {selectedChat && (
          <button
            className="chat-prism-info-toggle"
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
          onDeleteChat={handleDeleteChat}
        />
      </div>

      {/* ── Right: Context panel — 360px, collapsible ────────────────────── */}
      {selectedChat && contextOpen && (
        <div className="chat-prism-context-column">
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
