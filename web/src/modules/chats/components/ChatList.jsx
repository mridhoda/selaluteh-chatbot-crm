import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
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
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const AVATAR_COLORS = [
  '#7c3aed', '#db2777', '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#0891b2',
]

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ─── skeleton ──────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div
      style={{
        padding: '10px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--surface-tertiary)',
          flexShrink: 0,
        }}
      />
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Chats
            {chats.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                  marginLeft: 6,
                }}
              >
                {chats.length}
              </span>
            )}
          </span>
          <button
            className="btn ghost"
            style={{ padding: '3px 8px', fontSize: 12, position: 'relative' }}
            onClick={() => setFiltersOpen((f) => !f)}
          >
            Filter
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: 'var(--brand-500)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 4,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30, fontSize: 13 }}
          />
        </div>

        {/* Expandable filters */}
        {filtersOpen && (
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <select
              className="input"
              style={{ fontSize: 12 }}
              value={filters.status || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: e.target.value || undefined,
                })
              }
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="waiting">Waiting</option>
            </select>

            <select
              className="input"
              style={{ fontSize: 12 }}
              value={filters.assignment || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  assignment: e.target.value || undefined,
                })
              }
            >
              <option value="">All assignments</option>
              <option value="ai">AI managed</option>
              <option value="human">Human agent</option>
            </select>

            <select
              className="input"
              style={{ fontSize: 12 }}
              value={filters.platform || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  platform: e.target.value || undefined,
                })
              }
            >
              <option value="">All channels</option>
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                className="btn ghost"
                style={{ fontSize: 12 }}
                onClick={() => onFilterChange({})}
              >
                <X size={11} style={{ marginRight: 4 }} />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
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

            return (
              <div
                key={cid}
                onClick={() => onSelect(cid)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(cid)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'var(--surface-secondary)'
                    : 'transparent',
                  borderLeft: isSelected
                    ? '3px solid var(--brand-500)'
                    : '3px solid transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.1s',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = 'var(--surface-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: avatarColor(chat.contactName),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitial(chat.contactName)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: name + timestamp + unread */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 2,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: unread > 0 ? 700 : 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chat.contactName || 'Unknown'}
                      </span>
                      {chat.platform && (
                        <BrandIcon name={chat.platform} size={11} />
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                        marginLeft: 6,
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {timeAgo(chat.lastMessageAt || chat.updatedAt)}
                      </span>
                      {unread > 0 && (
                        <span
                          style={{
                            background: 'var(--brand-500)',
                            color: '#fff',
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            fontSize: 10,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                          }}
                        >
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: outlet */}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    {chat.outletName || 'Outlet not selected'}
                  </div>

                  {/* Row 3: last message */}
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lastText}
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
