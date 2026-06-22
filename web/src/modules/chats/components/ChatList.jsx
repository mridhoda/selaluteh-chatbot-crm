import React, { useEffect, useState } from 'react'
import { Filter, Plus, Search, X, Bot } from 'lucide-react'
import BrandIcon from '../../../shared/components/brand/BrandIcon'

// ─── helpers ───────────────────────────────────────────────────────────────

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return mins + 'm'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── skeleton ──────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className='chat-prism-list-skeleton'>
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 11,
            background: 'var(--surface-tertiary)',
            borderRadius: 4,
            width: '55%',
            marginBottom: 7,
          }}
        />
        <div
          style={{
            height: 9,
            background: 'var(--surface-tertiary)',
            borderRadius: 4,
            width: '85%',
            marginBottom: 5,
          }}
        />
        <div
          style={{
            height: 9,
            background: 'var(--surface-tertiary)',
            borderRadius: 4,
            width: '40%',
          }}
        />
      </div>
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────

export default function ChatList({
  chats,
  selectedId,
  onSelect,
  isLoading,
  filters = {},
  onFilterChange,
}) {
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [assignmentTab, setAssignmentTab] = useState(
    filters.assignment || 'all'
  )

  useEffect(() => {
    setAssignmentTab(filters.assignment || 'all')
  }, [filters.assignment])

  const sorted = [...chats].sort((a, b) => {
    const ta = new Date(a.lastMessageAt || a.updatedAt || 0).getTime()
    const tb = new Date(b.lastMessageAt || b.updatedAt || 0).getTime()
    return tb - ta
  })

  const filtered = sorted.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.contactName || '').toLowerCase().includes(q) ||
      (c.platform || '').toLowerCase().includes(q) ||
      (c.outletName || '').toLowerCase().includes(q)
    )
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const setAssignmentFilter = (value) => {
    setAssignmentTab(value)
    onFilterChange?.({
      ...filters,
      assignment: ['all', 'assigned', 'unassigned'].includes(value)
        ? value
        : undefined,
    })
  }

  return (
    <div className='chat-prism-list'>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className='chat-prism-list-header'>
        <div className='chat-prism-list-title-row'>
          <div className='chat-prism-list-title-wrap'>
            <h1 className='chat-prism-list-title'>Messages</h1>
            {chats.length > 0 && (
              <span className='chat-prism-count-badge'>{chats.length} New</span>
            )}
          </div>
          <div className='chat-prism-list-actions'>
            <button
              className='chat-prism-icon-button'
              onClick={() => setFiltersOpen((f) => !f)}
              title='Filter'
            >
              <Filter size={18} />
              {activeFilterCount > 0 && (
                <span className='chat-prism-filter-dot'>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              className='chat-prism-icon-button brand-action'
              title='New conversation'
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className='chat-prism-search-wrap'>
          <Search className='chat-prism-search-icon' size={16} />
          <input
            className='chat-prism-search-input'
            placeholder='Search chats...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className='chat-prism-tabs'>
          <button
            className={`chat-prism-tab ${assignmentTab === 'all' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('all')}
          >
            All
          </button>
          <button
            className={`chat-prism-tab ${assignmentTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('assigned')}
          >
            Assigned
            <span className='chat-prism-tab-count'>120</span>
          </button>
          <button
            className={`chat-prism-tab ${assignmentTab === 'unassigned' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('unassigned')}
          >
            Unassigned
          </button>
          <button
            className={`chat-prism-tab ${assignmentTab === 'mentions' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('mentions')}
          >
            Mentions
          </button>
        </div>

        {/* Expandable filters */}
        {filtersOpen && (
          <div className='chat-prism-filters'>
            <select
              className='chat-prism-filter-select'
              value={filters.status || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: e.target.value || undefined,
                })
              }
            >
              <option value=''>All statuses</option>
              <option value='open'>Open</option>
              <option value='resolved'>Resolved</option>
              <option value='waiting'>Waiting</option>
            </select>

            <select
              className='chat-prism-filter-select'
              value={filters.platform || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  platform: e.target.value || undefined,
                })
              }
            >
              <option value=''>All channels</option>
              <option value='telegram'>Telegram</option>
              <option value='whatsapp'>WhatsApp</option>
              <option value='instagram'>Instagram</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                className='chat-prism-clear-filter'
                onClick={() => {
                  setAssignmentTab('')
                  onFilterChange({})
                }}
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      <div className='chat-prism-list-scroll'>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 ? (
          <div className='chat-prism-empty-list'>
            {chats.length === 0
              ? 'No conversations yet'
              : 'No conversations match your search'}
          </div>
        ) : (
          filtered.map((chat) => {
            const cid = chat._id || chat.id
            const isSelected = cid === selectedId
            const unread = chat.unreadCount || 0
            const lastText =
              chat.lastMessage ||
              chat.lastMessageText ||
              chat.lastMessagePreview ||
              'No messages yet'
            const status =
              chat.status === 'resolved' || chat.status === 'closed'
                ? 'Resolved'
                : chat.mode === 'human' || chat.takenOverAt
                  ? 'Assigned'
                  : 'Pending'
            const agentName =
              chat.agentName || chat.assignedAgentName || chat.assignedAgent

            const hasUnread = unread > 0
            return (
              <div
                key={cid}
                onClick={() => onSelect(cid)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(cid)}
                className={`chat-prism-list-item ${isSelected ? 'active' : ''}`}
              >
                {/* Left: Styled Platform Circle Avatar */}
                <div
                  className={`chat-prism-avatar-wrap ${chat.platform || 'custom'}`}
                >
                  {chat.platform ? (
                    <BrandIcon type={chat.platform} size={14} color='#ffffff' />
                  ) : (
                    <Bot size={14} color='#ffffff' />
                  )}
                </div>

                {/* Right: Item Body */}
                <div className='chat-prism-item-body'>
                  <div className='chat-prism-list-item-top'>
                    <h4 className='chat-prism-list-name'>
                      {chat.contactName || 'Unknown'}
                    </h4>
                    <div
                      className={`chat-prism-list-meta-right ${hasUnread ? 'has-unread' : ''}`}
                    >
                      <span>
                        {timeAgo(chat.lastMessageAt || chat.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <p className='chat-prism-last-message'>{lastText}</p>

                  <div className='chat-prism-list-footer'>
                    <span
                      className={`chat-prism-status ${status.toLowerCase()}`}
                    >
                      {status}
                    </span>
                    {agentName && (
                      <span className='chat-prism-agent-chip'>
                        <Bot size={10} />
                        {agentName}
                      </span>
                    )}
                    {!agentName && chat.outletName && (
                      <span className='chat-prism-agent-chip muted'>
                        {chat.outletName}
                      </span>
                    )}
                    {unread > 0 && (
                      <span
                        className='chat-prism-unread'
                        style={{ marginLeft: 'auto' }}
                      >
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
