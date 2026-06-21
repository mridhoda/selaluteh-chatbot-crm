import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom'
import Sidebar from '../../../layouts/components/Sidebar'
import Navbar from '../../../layouts/components/Topbar'
import api from '../../../shared/api/httpClient'
import ChatPanel from '../../chats/components/ChatPanel'
import QuickActions from '../../chats/components/QuickActions'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import ContactPanel from '../../contacts/components/ContactPanel'
import FilterPopup from '../../../shared/components/ui/FilterPopup'
import Platforms from '../../platforms/pages/PlatformsPage'
import Complaints from '../../complaints/pages/ComplaintsPage'
import Orders from '../../orders/pages/OrdersPage'
import AgentSales from '../../agents/components/AgentSales'
import AgentDetail from '../../agents/components/AgentDetail'
import * as XLSX from 'xlsx'
import { Line, Pie, Bar } from 'react-chartjs-2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faSliders, faEnvelopeOpen, faCopy, faTrash, faComments, faClock, faGlobe, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import FileInput from '../../../shared/components/ui/FileInput'
import ProductsPage from '../../products/pages/ProductsPage'
import OutletsPage from '../../outlets/pages/OutletsPage'
import PaymentsPage from '../../payments/pages/PaymentsPage'
import SettingsPage from '../../settings/pages/SettingsPage'
import ChatCenterPage from '../../chats/pages/ChatCenterPage'
import ReportsPage from '../../reports/pages/ReportsPage'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from 'chart.js'
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
)

function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })
  return { user, setUser }
}

/* ========================= INBOX ========================= */
function Inbox() {
  const [chats, setChats] = useState([])
  const [agents, setAgents] = useState([])
  const [selected, setSelected] = useState(null)
  const [platforms, setPlatforms] = useState([]) // New state for platforms
  const [replyingTo, setReplyingTo] = useState(null)

  // Clear reply state when chat selection changes
  useEffect(() => {
    if (selected) {
      setReplyingTo(null);
    }
  }, [selected?._id]);

  // Filter state
  const [showFilterPopup, setShowFilterPopup] = useState(false)
  const [showSearch, setShowSearch] = useState(true)
  const [filters, setFilters] = useState({
    agentId: '',
    search: '',
    from: '',
    to: '',
    tags: [],
    unreadOnly: false,
    assignment: 'all',
  })
  const panelHeight = 'calc(100vh - 58px - 20px)'
  const hasAdvancedFilters = Boolean(filters.from || filters.to || filters.tags.length)
  const searchActive = Boolean(showSearch || filters.search)

  // Load agents and platforms for filter dropdown and icon mapping
  useEffect(() => {
    Promise.all([
      api.get('/agents'),
      api.get('/platforms'), // Fetch platforms
    ]).then(([agentsRes, platformsRes]) => {
      const normalizedAgents = (agentsRes.data || []).map(a => ({
        ...a,
        _id: a._id || a.id,
        id: a.id || a._id
      }));
      const normalizedPlatforms = (platformsRes.data || []).map(p => ({
        ...p,
        _id: p._id || p.id,
        id: p.id || p._id
      }));
      setAgents(normalizedAgents)
      setPlatforms(normalizedPlatforms)
    }).catch(console.error)
  }, [])

  const pfById = useMemo(() => {
    return platforms.reduce((acc, p) => {
      acc[p._id] = p
      return acc
    }, {})
  }, [platforms])

  const load = useCallback(async () => {
    const params = {
      ...filters,
      search: filters.search.trim() || undefined,
      tags: filters.tags.length ? filters.tags.join(',') : undefined,
    }

    const currentAssignment = filters.assignment;

    // For assigned/unassigned, we fetch all non-resolved and filter client-side.
    // For resolved, we use the backend filter.
    // For 'all', we don't send any assignment filter.
    if (currentAssignment === 'assigned' || currentAssignment === 'unassigned') {
      delete params.assignment;
    }

    if (!filters.agentId) delete params.agentId
    if (!filters.from) delete params.from
    if (!filters.to) delete params.to
    if (!filters.unreadOnly) delete params.unreadOnly

    const r = await api.get('/chats', { params })
    let chatsData = (r.data || []).map(chat => ({
      ...chat,
      _id: chat._id || chat.id,
      id: chat.id || chat._id,
      contactId: chat.contactId ? {
        ...chat.contactId,
        _id: chat.contactId._id || chat.contactId.id,
        id: chat.contactId.id || chat.contactId._id
      } : null
    }));

    // Apply client-side filtering for assigned/unassigned
    if (currentAssignment === 'assigned') {
      chatsData = chatsData.filter(c => c.takeoverBy || c.isEscalated);
    } else if (currentAssignment === 'unassigned') {
      chatsData = chatsData.filter(c => !c.takeoverBy && !c.isEscalated && c.status !== 'resolved');
    } else if (currentAssignment === 'resolved') {
      chatsData = chatsData.filter(c => c.status === 'resolved');
    }

    setChats(chatsData)
    setSelected((prev) => {
      if (!prev?._id) return prev
      const updated = chatsData.find((chat) => chat._id === prev._id)
      return updated || prev
    })
  }, [filters])


  useEffect(() => {
    load()
  }, [load])

  // Optimistically clear unread count when chat is selected
  useEffect(() => {
    if (selected?._id && selected.unread > 0) {
      const updatedChat = { ...selected, unread: 0 };
      handleChatUpdate(updatedChat);
    }
  }, [selected?._id]);

  useEffect(() => {
    const interval = setInterval(() => {
      load()
    }, 4000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const handleFocus = () => load()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [load])

  const handleContactUpdate = (updatedContact) => {
    const newChats = chats.map((c) => {
      if (c.contactId?._id === updatedContact._id) {
        return { ...c, contactId: updatedContact }
      }
      return c
    })
    setChats(newChats)
    if (selected?.contactId?._id === updatedContact._id) {
      setSelected((prev) => ({ ...prev, contactId: updatedContact }))
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleChatUpdate = (updatedChat) => {
    const newChats = chats.map((c) =>
      c._id === updatedChat._id ? updatedChat : c
    )
    setChats(newChats)
    setSelected(updatedChat)
  }

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`)
      setChats((prev) => prev.filter((c) => c._id !== chatId))
      if (selected?._id === chatId) setSelected(null)
    } catch (err) {
      console.error('Failed to delete chat:', err)
      alert('Failed to delete chat')
    }
  }

  const handleResolve = async (chatId) => {
    try {
      const chat = chats.find((c) => c._id === chatId)
      const newStatus = chat.status === 'resolved' ? 'open' : 'resolved'
      await api.put(`/chats/${chatId}`, { status: newStatus })

      const updatedChat = { ...chat, status: newStatus }
      handleChatUpdate(updatedChat)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleSendMessage = async (content, attachment) => {
    if (!selected) return
    const chatId = selected._id || selected.id
    try {
      const res = await api.post(`/chats/${chatId}/send`, { content, attachment })
      const sentMsg = res.data
      const updatedChat = {
        ...selected,
        messages: [...(selected.messages || []), sentMsg],
      }
      handleChatUpdate(updatedChat)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleTakeover = async () => {
    if (!selected) return
    const chatId = selected._id || selected.id
    const isAIActive = selected.aiEnabled !== false
    try {
      const endpoint = isAIActive ? 'takeover' : 'release'
      const res = await api.post(`/chats/${chatId}/${endpoint}`)
      const updatedChat = res.data?.data || res.data
      if (!updatedChat.messages && selected.messages) {
        updatedChat.messages = selected.messages
      }
      handleChatUpdate(updatedChat)
    } catch (err) {
      console.error('Takeover action failed:', err)
    }
  }

  return (
    <>
      <div className='inbox-modern-container' style={{ height: panelHeight, gridTemplateColumns: selected ? '280px 1fr 300px' : '280px 1fr' }}>
        {/* LEFT COLUMN: Chat List */}
        <div className='inbox-modern-sidebar'>
          <div className='inbox-modern-header'>
            <div className='inbox-header-top'>
              <h2>Message</h2>
              <div className='inbox-header-actions'>
                <button
                  className={`btn-icon ${showSearch ? 'active' : ''}`}
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <button
                  className={`btn-icon ${filters.unreadOnly ? 'active' : ''}`}
                  onClick={() => handleFilterChange({ unreadOnly: !filters.unreadOnly })}
                  title="Toggle Unread Only"
                >
                  <FontAwesomeIcon icon={faEnvelopeOpen} />
                </button>
                <button
                  className={`btn-icon ${hasAdvancedFilters ? 'active' : ''}`}
                  onClick={() => setShowFilterPopup(true)}
                  title="Filter"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </button>
              </div>
            </div>

            {searchActive && (
              <div className='inbox-search-bar'>
                <input
                  placeholder='Search messages...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  autoFocus
                />
              </div>
            )}
            <div className='inbox-filter-tabs'>
              <button
                className={`filter-btn ${filters.assignment === 'assigned' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ assignment: 'assigned' })}
              >
                Assigned
              </button>
              <button
                className={`filter-btn ${filters.assignment === 'unassigned' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ assignment: 'unassigned' })}
              >
                Unassigned
              </button>
              <button
                className={`filter-btn ${filters.assignment === 'resolved' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ assignment: 'resolved' })}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className='inbox-chat-list'>
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={`inbox-chat-item ${selected?._id === chat._id ? 'active' : ''} ${chat.unread > 0 ? 'unread' : ''}`}
                onClick={() => setSelected(chat)}
              >
                <div className='chat-item-avatar'>
                  <BrandIcon type={chat.platformType || 'custom'} size={20} />
                </div>
                <div className='chat-item-content'>
                  <div className='chat-item-top'>
                    <span className='chat-item-name'>{chat.contactId?.name || chat.from}</span>
                    <span className='chat-item-time'>
                      {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className='chat-item-preview'>
                    {chat.lastMessage || 'No messages yet'}
                  </div>
                  <div className='chat-item-footer'>
                    {chat.unread > 0 && (
                      <span className='unread-badge'>{chat.unread}</span>
                    )}
                    {chat.status === 'resolved' && (
                      <span className='status-badge resolved'>Resolved</span>
                    )}
                    {chat.status !== 'resolved' && chat.takeoverBy && (
                      <span className='status-badge assigned'>Assigned</span>
                    )}
                    {chat.status !== 'resolved' && !chat.takeoverBy && chat.isEscalated && (
                      <span className='status-badge pending' style={{ backgroundColor: '#F97316', color: 'white' }}>Pending Human</span>
                    )}
                    {chat.status !== 'resolved' && !chat.takeoverBy && !chat.isEscalated && chat.agentId && (
                      <span className='status-badge open'>Open</span>
                    )}
                    {chat.status !== 'resolved' && !chat.takeoverBy && !chat.isEscalated && !chat.agentId && (
                      <span className='status-badge pending'>Pending</span>
                    )}
                    {chat.contactId?.tags?.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className='contact-tag-badge'>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {chats.length === 0 && (
              <div className='empty-state'>
                No chats found
              </div>
            )}
          </div>
        </div>


        {/* MIDDLE COLUMN: Chat Area */}
        <div className='inbox-modern-main'>
          {selected ? (
            <ChatPanel
              selected={selected}
              onChatUpdate={handleChatUpdate}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onSendMessage={handleSendMessage}
              onTakeover={handleTakeover}
              onResolve={() => handleResolve(selected._id || selected.id)}
              onDeleteChat={handleDeleteChat}
            />
          ) : (
            <div className='empty-chat-panel'>
              <QuickActions />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Contact Info */}
        {selected && (
          <div className='inbox-modern-details'>
            <ContactPanel
              selected={selected}
              onUpdate={handleContactUpdate}
            />
          </div>
        )}
      </div>

      {showFilterPopup && (
        <FilterPopup
          isOpen={showFilterPopup}
          onClose={() => setShowFilterPopup(false)}
          filters={filters}
          onApply={handleFilterChange}
        />
      )}
    </>
  )
}

/* ========================= AGENTS (grid + platform icon + settings) ========================= */
function Agents() {
  const [rows, setRows] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [q, setQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  // form create
  const [name, setName] = useState('')
  const [platformId, setPlatformId] = useState('')
  const [prompt, setPrompt] = useState(
    'Kamu adalah bot yang siap membantu pelanggan.'
  )
  const [behavior, setBehavior] = useState('You are a helpful assistant.')
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Halo! Ada yang bisa saya bantu?'
  )
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const ps = await api.get('/platforms')
    setPlatforms(ps.data)
    const r = await api.get('/agents')
    setRows(r.data)
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = rows.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) ||
      (a.prompt || '').toLowerCase().includes(q.toLowerCase())
  )
  const initials = (s = '') =>
    s
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() || '')
      .join('') || 'AI'

  const del = async (id) => {
    if (!confirm('Hapus agent ini?')) return
    await api.delete(`/agents/${id}`)
    setRows(rows.filter((r) => (r.id || r._id) !== id))
  }
  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt)
      alert('Copied!')
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const openCreate = () => {
    setName('')
    setPlatformId('')
    setPrompt('Kamu adalah bot yang siap membantu pelanggan.')
    setBehavior('You are a helpful assistant.')
    setWelcomeMessage('Halo! Ada yang bisa saya bantu?')
    setShowCreate(true)
  }

  const create = async (e) => {
    e?.preventDefault?.()
    if (!name) return alert('Nama wajib diisi')
    setSaving(true)
    try {
      const r = await api.post('/agents', {
        name,
        platformId: platformId || null,
        prompt,
        behavior,
        welcomeMessage,
        knowledge: [],
      })
      setShowCreate(false)
      setRows([r.data, ...rows])
    } finally {
      setSaving(false)
    }
  }

  const pfById = {}
  platforms.forEach((p) => (pfById[p.id || p._id] = p))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

      {/* Header */}
      <div className='agents-page-header'>
        <h2>AI Agents</h2>
        <p>
          Ini adalah halaman di mana Anda dapat mengunjungi AI yang telah Anda buat sebelumnya.
          <br />
          Jangan ragu untuk membuat perubahan dan membuat chatbot sebanyak yang Anda inginkan kapan saja!
        </p>
      </div>

      {/* Search */}
      <div className='agents-search-container'>
        <div className='agents-search-box'>
          <input
            className='input'
            placeholder='Search AI agents...'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className='btn ghost' title='History'>
          🕒
        </button>
      </div>

      {/* Grid */}
      <div className='agents-grid'>
        {filtered.map((a) => {
          const agentId = a.id || a._id;
          return (
            <div key={agentId} className='agent-card'>
              <div className='agent-name'>{a.name}</div>
              <div className='agent-avatar'>{initials(a.name)}</div>
              <div className='agent-sub'>
                {(a.prompt || a.welcomeMessage || '-').slice(0, 60) || '-'}
              </div>

              <div className='agent-actions'>
                <button
                  className='agent-action-btn'
                  onClick={() => navigate(`/app/agents/${agentId}`)}
                >
                  Settings
                </button>
                <button
                  className='agent-action-btn icon-only'
                  title='Copy ID'
                  onClick={() => copy(agentId)}
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                <button
                  className='agent-action-btn icon-only'
                  title='Delete'
                  onClick={() => del(agentId)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Create New Card */}
        <div className='agent-card create-new' onClick={openCreate}>
          <div className='create-new-icon'>＋</div>
          <div className='create-new-text'>Create New</div>
        </div>
      </div>

      {/* Modal Create */}
      {showCreate && (
        <div className='modal'>
          <div className='modal-card'>
            <div
              className='row'
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <h3 style={{ margin: 0 }}>Create AI Agent</h3>
              <button
                className='btn ghost'
                onClick={() => setShowCreate(false)}
              >
                Close
              </button>
            </div>
            <form className='col' onSubmit={create}>
              <input
                className='input'
                placeholder='Nama agent'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className='row' style={{ gap: 8, alignItems: 'center' }}>
                <BrandIcon
                  type={pfById[platformId]?.type || 'custom'}
                  size={18}
                />
                <select
                  className='select'
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                >
                  <option value=''>Pilih Platform (opsional)</option>
                  {platforms.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.label} ({p.type})
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className='textarea'
                rows={3}
                placeholder='Prompt AI'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <textarea
                className='textarea'
                rows={3}
                placeholder='Agent Behavior (system)'
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
              />
              <input
                className='input'
                placeholder='Welcome Message'
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
              <div
                className='row'
                style={{ justifyContent: 'flex-end', gap: 8 }}
              >
                <button
                  type='button'
                  className='btn ghost'
                  onClick={() => setShowCreate(false)}
                >
                  Batal
                </button>
                <button className='btn' disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )
      }
    </div >
  )
}

/* ========================= HUMAN AGENTS ========================= */
function Humans() {
  const { user: currentUser } = useAuth() // For role checking
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  // form create
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('agent')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const r = await api.get('/users')
      setRows(r.data)
    } catch (error) {
      console.error('Failed to load users', error)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = rows.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
  )
  const initials = (s = '') =>
    s
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() || '')
      .join('') || 'U'

  const del = async (id) => {
    if (!confirm('Hapus pengguna ini?')) return
    try {
      await api.delete(`/users/${id}`)
      setRows(rows.filter((r) => (r.id || r._id) !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus pengguna')
    }
  }

  const openCreate = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('agent')
    setShowCreate(true)
  }

  const create = async (e) => {
    e?.preventDefault?.()
    if (!name || !email || !password)
      return alert('Nama, Email, dan Password wajib diisi')
    setSaving(true)
    try {
      await api.post('/users/human', { name, email, password, role })
      setShowCreate(false)
      load() // Reload the list
      alert(`Pengguna baru (${email}) telah berhasil dibuat!`)
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat pengguna')
    } finally {
      setSaving(false)
    }
  }

  const canManage =
    currentUser?.role === 'owner' || currentUser?.role === 'super'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

      {/* Header */}
      <div className='agents-page-header'>
        <h2>Human Agents</h2>
        <p>
          Ini adalah halaman di mana Anda dapat mengunjungi human yang telah Anda buat sebelumnya.
          <br />
          Jangan ragu untuk membuat perubahan dan membuat human sebanyak yang Anda inginkan kapan saja!
        </p>
      </div>

      {/* Search */}
      <div className='agents-search-container'>
        <div className='agents-search-box'>
          <input
            className='input'
            placeholder='Search human agents...'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className='btn ghost' title='History'>
          🕒
        </button>
      </div>

      {/* Grid */}
      <div className='agents-grid'>
        {filtered.map((u) => {
          const userId = u.id || u._id;
          return (
            <div key={userId} className='agent-card'>
              <div className='agent-name'>{u.name}</div>
              <div className='agent-avatar'>{initials(u.name)}</div>
              <div className='agent-sub'>
                {(u.email || '-').slice(0, 60) || '-'}
              </div>

              {/* Role Badge */}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: u.role === 'owner' ? '#EF4444' : u.role === 'super' ? '#F59E0B' : '#3B82F6',
                  color: 'white'
                }}>
                  {u.role || 'agent'}
                </span>
              </div>

              <div className='agent-actions'>
                <button
                  className='btn ghost'
                  title='Delete'
                  onClick={() => del(userId)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Create New Card */}
        {canManage && (
          <div className='agent-card create-new' onClick={openCreate}>
            <div className='create-new-icon'>＋</div>
            <div className='create-new-text'>Create New</div>
          </div>
        )}
      </div>

      {/* Modal Create */}
      {showCreate && (
        <div className='modal'>
          <div className='modal-card'>
            <div
              className='row'
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <h3 style={{ margin: 0 }}>Create Human Agent</h3>
              <button
                className='btn ghost'
                onClick={() => setShowCreate(false)}
              >
                Close
              </button>
            </div>
            <form className='col' onSubmit={create}>
              <input
                className='input'
                placeholder='Nama Lengkap'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type='email'
                className='input'
                placeholder='Alamat Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type='password'
                className='input'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <select
                className='select'
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value='agent'>Agent (Admin)</option>
                <option value='super'>Super Admin</option>
              </select>
              <div
                className='row'
                style={{ justifyContent: 'flex-end', gap: 8 }}
              >
                <button
                  type='button'
                  className='btn ghost'
                  onClick={() => setShowCreate(false)}
                >
                  Batal
                </button>
                <button className='btn' disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div >
  )
}

/* ========================= ANALYTICS PAGE ========================= */
function AnalyticsPage() {
  const [traffic, setTraffic] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [agents, setAgents] = useState([])
  const [peakHours, setPeakHours] = useState({ labels: [], data: [] })

  useEffect(() => {
    api.get('/analytics/traffic').then((r) => setTraffic(r.data))
    api.get('/analytics/platforms').then((r) => setPlatforms(r.data))
    api.get('/analytics/agents').then((r) => setAgents(r.data))
    api.get('/analytics/peak-hours').then((r) => setPeakHours(r.data))
  }, [])

  const totalChats = traffic.reduce((sum, t) => sum + t.count, 0)
  const totalContacts = new Set(traffic.map((t) => t._id)).size
  const avgResponseTime = '2.3 min'

  const trafficData = {
    labels: traffic.map((t) => new Date(t._id).toLocaleDateString()),
    datasets: [
      {
        label: 'Messages',
        data: traffic.map((t) => t.count),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const platformData = {
    labels: platforms.map((p) => p._id || 'Unknown'),
    datasets: [
      {
        data: platforms.map((p) => p.count),
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',   // Brand Orange
          'rgba(251, 146, 60, 0.8)',   // Existing complementary orange
          'rgba(156, 163, 175, 0.8)',  // Neutral gray
          'rgba(249, 115, 22, 0.6)',   // Lighter Brand Orange
        ],
      },
    ],
  }

  const agentData = {
    labels: agents.map((a) => a._id || 'No Agent'),
    datasets: [
      {
        label: 'Chats Handled',
        data: agents.map((a) => a.count),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
      },
    ],
  }

  const peakHoursData = {
    labels: peakHours.labels || [],
    datasets: [
      {
        label: 'Messages',
        data: peakHours.data || [],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  return (
    <div className='analytics-container'>
      <div className='analytics-header'>
        <h2>Analytics</h2>
      </div>

      <div className='analytics-stats-row'>
        <div className='analytics-stat-card'>
          <div className='analytics-stat-value'>{totalChats}</div>
          <div className='analytics-stat-label'>Total Messages</div>
        </div>
        <div className='analytics-stat-card'>
          <div className='analytics-stat-value'>{totalContacts}</div>
          <div className='analytics-stat-label'>Active Contacts</div>
        </div>
        <div className='analytics-stat-card'>
          <div className='analytics-stat-value'>{avgResponseTime}</div>
          <div className='analytics-stat-label'>Avg Response Time</div>
        </div>
      </div>

      <div className='analytics-charts-grid'>
        <div className='analytics-chart-card'>
          <h3>Message Traffic</h3>
          <div className='analytics-chart-wrapper'>
            <Line data={trafficData} options={chartOptions} />
          </div>
        </div>

        <div className='analytics-chart-card'>
          <h3>Messages by Platform</h3>
          <div className='analytics-chart-wrapper'>
            <Pie data={platformData} options={chartOptions} />
          </div>
        </div>

        <div className='analytics-chart-card'>
          <h3>Chats by Agent</h3>
          <div className='analytics-chart-wrapper'>
            <Bar data={agentData} options={chartOptions} />
          </div>
        </div>

        <div className='analytics-chart-card'>
          <h3>Peak Chat Hours</h3>
          <div className='analytics-chart-wrapper'>
            <Bar data={peakHoursData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========================= CONTACTS ========================= */
/* ========================= CONTACTS ========================= */
function Contacts() {
  const [contacts, setContacts] = useState([])
  const [q, setQ] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    api.get('/contacts').then((r) => setContacts(r.data.data || r.data || []))
  }, [])

  // Filter contacts
  const filtered = Array.isArray(contacts) ? contacts.filter((c) =>
    c.name?.toLowerCase().includes(q.toLowerCase())
  ) : []

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [q, itemsPerPage])

  const paginatedContacts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p)
    }
  }

  // Generate page numbers
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }
    if (currentPage - delta > 2) {
      range.unshift('...')
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...')
    }
    range.unshift(1)
    if (totalPages > 1) {
      range.push(totalPages)
    }
    return range
  }


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      (Array.isArray(contacts) ? contacts : []).map((c) => ({
        'Name': c.name,
        'ID / Phone': c.platformAccountId || c.phone || '-',
        'Waktu Awal Chat': new Date(c.createdAt).toLocaleString(),
        'Waktu Akhir Chat': new Date(c.lastMessageAt).toLocaleString(),
        'Pesan Terakhir': c.lastMessage || '-',
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, 'contacts.xlsx')
  }

  return (
    <div className='contacts-container'>
      {/* Header */}
      <div className='contacts-header'>
        <h1>Contacts</h1>
        <div className='contacts-actions'>
          <button className='contacts-export-btn' onClick={exportToExcel}>
            <span style={{ fontSize: 16 }}>⬇</span> Export to Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className='contacts-search-wrapper'>
        <input
          className='contacts-search-input'
          placeholder='Search contacts by name...'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <svg className="contacts-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      {/* Grid */}
      <div className='contacts-grid'>
        {paginatedContacts.map((c) => (
          <div key={c.id || c._id} className='contact-card'>
            <div className='contact-header'>
              <div className='contact-avatar'>
                {c.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className='contact-info'>
                <div className='contact-name' title={c.name}>{c.name}</div>
                <div className='contact-phone'>{c.platformAccountId || c.phone || '-'}</div>
              </div>
            </div>

            <div className='contact-body'>
              <div className='contact-message-label'>Last Message</div>
              <div className='contact-message-text'>
                {c.lastMessage ? `"${c.lastMessage}"` : <span style={{ opacity: 0.5 }}>No messages yet</span>}
              </div>
            </div>

            <div className='contact-footer'>
              <div className='contact-date'>
                <span>Started</span>
                {new Date(c.createdAt).toLocaleDateString()}
              </div>
              <div className='contact-date' style={{ alignItems: 'flex-end' }}>
                <span>Last Active</span>
                {new Date(c.lastMessageAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='contacts-empty'>
          <div className='contacts-empty-icon'>📭</div>
          <p>No contacts found matching &quot;{q}&quot;</p>
        </div>
      )}

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className='contacts-footer-bar'>
          <div>Total Data: <strong>{filtered.length.toLocaleString()}</strong></div>

          <div className='pagination-controls'>
            <button
              className='page-btn'
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              &lt;
            </button>

            {getPageNumbers().map((p, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => p !== '...' && handlePageChange(p)}
                disabled={p === '...'}
              >
                {p}
              </button>
            ))}

            <button
              className='page-btn'
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              &gt;
            </button>
          </div>

          <div className='rows-per-page-selector'>
            <button className="btn ghost small" style={{ marginRight: 8 }}>Show per Page</button>
            <select
              className='rows-select'
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

/* ========================= PROFILE ========================= */
function Profile() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/users/profile', { name, email })
      alert('Profile updated successfully!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='card' style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Profile</h2>
      <div className='col' style={{ gap: 16 }}>
        <div>
          <div className='muted'>Name</div>
          <input
            className='input'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <div className='muted'>Email</div>
          <input
            className='input'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button className='btn' onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

/* ========================= SETTINGS/BILLING/PROFILE ========================= */
function Settings() {
  return <SettingsPage />
}
function Billing() {
  const [data, setData] = useState(null)
  useEffect(() => {
    api.get('/billing').then((r) => setData(r.data))
  }, [])
  return (
    <div className='card'>
      <div style={{ fontWeight: 700 }}>Info Paket</div>
      <div className='badge'>Plan: {data?.plan}</div>
      <div className='badge'>Maks Agent: {data?.limits?.maxAgents}</div>
      <div className='badge'>
        Berlaku sampai:{' '}
        {data?.expiry ? new Date(data.expiry).toLocaleDateString() : '-'}
      </div>
    </div>
  )
}


/* ========================= MAIN LAYOUT ========================= */
export default function Dashboard() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) navigate('/login')
    api
      .get('/billing')
      .then((r) => setPlan(r.data))
      .catch((error) => console.error('Error fetching billing info:', error))
  }, [user, navigate])

  const isProductsPage = location.pathname.replace(/\/+$/, '') === '/app/products'

  return (
    <div className='dashboard-layout'>
      <div className='sidebar-container'>
        <Sidebar />
      </div>
      <Navbar authed user={user} plan={plan} />
      <div className={`main ${isProductsPage ? 'main--products' : ''}`}>
        <div className={`main-body ${isProductsPage ? 'main-body--products' : ''}`}>
          <Routes>
            <Route index element={<Inbox />} />
            <Route path='chats' element={<ChatCenterPage />} />
            <Route path='analytics' element={<AnalyticsPage />} />
            <Route path='contacts' element={<Contacts />} />
            <Route path='contacts' element={<Contacts />} />
            <Route path='complaints' element={<Complaints />} />
            <Route path='orders' element={<Orders />} />
            <Route path='products' element={<ProductsPage />} />
            <Route path='outlets' element={<OutletsPage />} />
            <Route path='payments' element={<PaymentsPage />} />
            <Route path='platforms' element={<Platforms />} />
            <Route path='agents' element={<Agents />} />
            <Route path='agents/:id' element={<Navigate to='general' replace />} />
            <Route path='agents/:id/:tab' element={<AgentDetail />} />
            <Route path='humans' element={<Humans />} />
            <Route path='human-agents' element={<Humans />} />
            <Route path='reports' element={<ReportsPage />} />
            <Route path='settings' element={<Settings />} />
            <Route path='billing' element={<Billing />} />
            <Route path='profile' element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
