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
import * as XLSX from 'xlsx'
import { Line, Pie, Bar } from 'react-chartjs-2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faSliders, faEnvelopeOpen, faCopy, faTrash, faComments, faClock, faGlobe, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import FileInput from '../../../shared/components/ui/FileInput'
import ProductsPage from '../../products/pages/ProductsPage'
import OutletsPage from '../../outlets/pages/OutletsPage'
import PaymentsPage from '../../payments/pages/PaymentsPage'
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
      setAgents(agentsRes.data)
      setPlatforms(platformsRes.data)
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
    let chatsData = r.data;

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
    if (!confirm('Are you sure you want to delete this chat?')) return
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
                    {chat.contactId?.tags?.map((tag) => (
                      <span key={tag} className='contact-tag-badge'>
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
    setRows(rows.filter((r) => r._id !== id))
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
  platforms.forEach((p) => (pfById[p._id] = p))

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
        {filtered.map((a) => (
          <div key={a._id} className='agent-card'>
            <div className='agent-name'>{a.name}</div>
            <div className='agent-avatar'>{initials(a.name)}</div>
            <div className='agent-sub'>
              {(a.prompt || a.welcomeMessage || '-').slice(0, 60) || '-'}
            </div>

            <div className='agent-actions'>
              <button
                className='agent-action-btn'
                onClick={() => navigate(`/app/agents/${a._id}`)}
              >
                Settings
              </button>
              <button
                className='agent-action-btn icon-only'
                title='Copy ID'
                onClick={() => copy(a._id)}
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
              <button
                className='agent-action-btn icon-only'
                title='Delete'
                onClick={() => del(a._id)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}

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
      setRows(rows.filter((r) => r._id !== id))
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
        {filtered.map((u) => (
          <div key={u._id} className='agent-card'>
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
                onClick={() => del(u._id)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}

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
    api.get('/contacts').then((r) => setContacts(r.data))
  }, [])

  // Filter contacts
  const filtered = contacts.filter((c) =>
    c.name?.toLowerCase().includes(q.toLowerCase())
  )

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
      contacts.map((c) => ({
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
          <div key={c._id} className='contact-card'>
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
  return <div className='card'>Pengaturan umum (placeholder).</div>
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

/* ========================= AGENT DETAIL ========================= */
function AgentDetail() {
  const { id, tab = 'general' } = useParams()
  const localDbStorageKey = useMemo(() => `agent-db-${id}`, [id])
  const navigate = useNavigate()

  const setTab = (newTab) => {
    navigate(`/app/agents/${id}/${newTab}`);
  };
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [platforms, setPlatforms] = useState([])

  const [agent, setAgent] = useState(null)
  const [name, setName] = useState('')
  const [platformId, setPlatformId] = useState('')
  const [behavior, setBehavior] = useState('')
  const [prompt, setPrompt] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [stickerUrl, setStickerUrl] = useState('')
  const [tools, setTools] = useState([])
  const [knowledge, setKnowledge] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [database, setDatabase] = useState([])
  const [complaintFields, setComplaintFields] = useState([]) // Dynamic complaint fields
  const [complaintNotification, setComplaintNotification] = useState({ enabled: false, platformId: '', destination: '' })
  const [knowledgeTab, setKnowledgeTab] = useState('url')
  const [localDatabase, setLocalDatabase] = useState([])
  const [dbUploadStatus, setDbUploadStatus] = useState({
    status: 'idle',
    message: '',
  })
  const [activeLinkId, setActiveLinkId] = useState(null)

  const [messages, setMessages] = useState([])
  const [testMsg, setTestMsg] = useState('')
  const [testAttachment, setTestAttachment] = useState(null)
  const [testing, setTesting] = useState(false)
  const combinedDatabase = useMemo(
    () => [
      ...database.map((f) => ({ ...f, source: 'remote' })),
      ...localDatabase.map((f) => ({ ...f, source: 'local' })),
    ],
    [database, localDatabase]
  )

  const getFileLink = (file) => {
    if (file.source === 'remote' && file.storedName) {
      return `${api.defaults.baseURL}/files/${file.storedName}`
    }
    if (file.source === 'local' && file.dataUrl) {
      return file.dataUrl
    }
    return ''
  }

  const toggleLinkPanel = (fileKey, file) => {
    const link = getFileLink(file)
    if (!link) {
      alert('Link tidak tersedia untuk file ini.')
      return
    }
    setActiveLinkId((prev) => (prev === fileKey ? null : fileKey))
  }

  const copyLink = async (link) => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Gagal menyalin link.')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const raw = window.localStorage.getItem(localDbStorageKey)
      setLocalDatabase(raw ? JSON.parse(raw) : [])
    } catch (error) {
      console.error('Failed to load local database files:', error)
      setLocalDatabase([])
    }
  }, [localDbStorageKey])

  const persistLocalDatabase = (updater) => {
    setLocalDatabase((prev) => {
      const next =
        typeof updater === 'function'
          ? updater(prev)
          : Array.isArray(updater)
            ? updater
            : prev
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(localDbStorageKey, JSON.stringify(next))
        } catch (error) {
          console.error('Failed to persist local database files:', error)
        }
      }
      return next
    })
  }

  const readFileAsDataUrl = (file, entryId) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const entry = {
          id: entryId,
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: reader.result,
        }
        persistLocalDatabase((prev) => {
          const filtered = prev.filter((item) => item.id !== entryId)
          return [...filtered, entry]
        })
        resolve(entry)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const generateLocalId = () =>
    typeof window !== 'undefined' &&
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  useEffect(() => {
    ; (async () => {
      try {
        const [a, p] = await Promise.all([
          api.get(`/agents/${id}`),
          api.get('/platforms'),
        ])
        setAgent(a.data)
        setName(a.data.name || '')
        setPlatformId(a.data.platformId || '')
        setBehavior(a.data.behavior || '')
        setPrompt(a.data.prompt || '')
        setWelcomeMessage(a.data.welcomeMessage || '')
        setStickerUrl(a.data.stickerUrl || '')
        setTools(a.data.tools || [])
        setKnowledge(Array.isArray(a.data.knowledge) ? a.data.knowledge : [])
        setFollowUps(Array.isArray(a.data.followUps) ? a.data.followUps : [])
        setDatabase(Array.isArray(a.data.database) ? a.data.database : [])
        setComplaintFields(Array.isArray(a.data.complaintFields) ? a.data.complaintFields : [])
        setComplaintNotification(a.data.complaintNotification || { enabled: false, platformId: '', destination: '' })
        setPlatforms(p.data)
      } catch (error) {
        console.error('Error fetching agent data:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name,
        platformId: platformId || null,
        behavior,
        prompt,
        welcomeMessage,
        stickerUrl,
        tools,
        knowledge,
        followUps,
        database,
        complaintFields,
        complaintNotification,
      }
      const r = await api.put(`/agents/${id}`, payload)
      setAgent(r.data)
    } finally {
      setSaving(false)
    }
  }

  const addKnowledge = (k = { kind: 'url', value: '' }) =>
    setKnowledge([...knowledge, k])
  const updKnowledge = (i, patch) => {
    const arr = [...knowledge]
    arr[i] = { ...arr[i], ...patch }
    setKnowledge(arr)
  }
  const delKnowledge = (i) =>
    setKnowledge(knowledge.filter((_, idx) => idx !== i))

  const addFollowUp = () =>
    setFollowUps([...followUps, { prompt: '', delay: 60 }])
  const updFollowUp = (i, patch) => {
    const arr = [...followUps]
    arr[i] = { ...arr[i], ...patch }
    setFollowUps(arr)
  }
  const delFollowUp = (i) =>
    setFollowUps(followUps.filter((_, idx) => idx !== i))

  const handleStickerSelect = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('/agents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setStickerUrl(response.data.filePath)
    } catch (error) {
      console.error('Sticker upload error:', error)
      alert('Sticker upload failed.')
    }
  }

  const handleFileSelect = async (file, i) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('/agents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const { filePath, originalName } = response.data;
      updKnowledge(i, { value: filePath, originalName: originalName });
    } catch (error) {
      console.error('File upload error:', error)
      alert('File upload failed.')
    }
  }

  const handleDatabaseFileSelect = async (file) => {
    if (!file) return
    const entryId = generateLocalId()

    // Skip localStorage for large files (>5MB) to avoid quota exceeded errors
    const MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const skipLocalStorage = file.size > MAX_LOCAL_STORAGE_SIZE;

    setDbUploadStatus({
      status: 'loading',
      message: `Processing ${file.name}...`,
    })

    // Only store in localStorage if file is small enough
    if (!skipLocalStorage) {
      try {
        await readFileAsDataUrl(file, entryId)
        setDbUploadStatus({
          status: 'loading',
          message: 'Stored locally. Uploading to server...',
        })
      } catch (error) {
        console.error('Failed to store database file locally:', error)
        setDbUploadStatus({
          status: 'error',
          message: 'Cannot store file locally. Please try another file.',
        })
        return
      }
    } else {
      setDbUploadStatus({
        status: 'loading',
        message: 'File is large, uploading directly to server...',
      })
    }

    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post(`/agents/${id}/database`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setDatabase((prev) => [...prev, response.data])
      if (!skipLocalStorage) {
        persistLocalDatabase((prev) => prev.filter((item) => item.id !== entryId))
      }
      setDbUploadStatus({
        status: 'success',
        message: `${file.name} uploaded successfully.`,
      })
    } catch (error) {
      console.error('Database file upload error:', error)
      setDbUploadStatus({
        status: 'error',
        message: skipLocalStorage
          ? 'Upload failed. Please try again.'
          : 'Upload failed, file saved locally on this device.',
      })
    }
  }

  const deleteDatabaseFile = async (file) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    if (file.source === 'local') {
      persistLocalDatabase((prev) => prev.filter((f) => f.id !== file.id))
      setDbUploadStatus({
        status: 'idle',
        message: '',
      })
      return
    }
    try {
      await api.delete(`/agents/${id}/database/${file.id}`)
      setDatabase((prev) => prev.filter((f) => f.id !== file.id))
    } catch (error) {
      console.error('Database file delete error:', error)
      alert('Database file delete failed.')
    }
  }

  const sendTest = async () => {
    if (!testMsg.trim() && !testAttachment) return
    setTesting(true)

    const historyPayload = messages
      .filter((m) => typeof m.text === 'string' && m.text.trim().length > 0)
      .slice(-10)
      .map((m) => ({ from: m.from, text: m.text }));

    const userMessage = { from: 'user', text: testMsg }
    if (testAttachment) {
      userMessage.attachment = testAttachment
    }
    let newMessages = [...messages, userMessage]

    if (messages.length === 0) {
      // First message from user
      const welcomeMsg = { from: 'ai', text: welcomeMessage || 'Halo!' }
      newMessages.push(welcomeMsg)
      if (stickerUrl) {
        const stickerMsg = { from: 'ai', sticker: stickerUrl }
        newMessages.push(stickerMsg)
      }
    }

    setMessages(newMessages)
    setTestMsg('')
    setTestAttachment(null)

    try {
      let payload = { message: testMsg, history: historyPayload }

      // If there's an attachment, upload it first
      if (testAttachment && testAttachment.file) {
        const formData = new FormData()
        formData.append('file', testAttachment.file)
        const uploadRes = await api.post('/agents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        payload.attachment = {
          url: uploadRes.data.filePath,
          filename: uploadRes.data.originalName
        }
      }

      const r = await api.post(`/agents/${id}/test`, payload)

      const reply = r.data.reply;

      if (typeof reply === 'object' && reply.attachment) {

        setMessages((prev) => [...prev, { from: 'ai', text: reply.text, attachment: reply.attachment }])

      } else {

        setMessages((prev) => [...prev, { from: 'ai', text: reply }])

      }

    } catch (error) {
      console.error('Test message error:', error)
      setMessages((prev) => [...prev, { from: 'ai', text: 'Error: Failed to send message' }])
    } finally {

      setTesting(false)

    }

  }



  if (loading) return <div className='card'>Loading…</div>

  if (!agent) return <div className='card'>Agent tidak ditemukan</div>



  return (

    <div className='detail-wrap'>

      <div

        className='row'

        style={{

          alignItems: 'center',

          justifyContent: 'space-between',

          marginBottom: 10,

        }}

      >

        <div className='row' style={{ alignItems: 'center', gap: 8 }}>

          <button className='btn ghost' onClick={() => navigate(-1)}>

            ← Back

          </button>

          <h2 style={{ margin: 0 }}>{name || agent.name}</h2>

        </div>

        <div className='row' style={{ gap: 8 }}>

          <button

            className='btn ghost'

            onClick={() => window.location.reload()}

          >

            ↻

          </button>

          <button className='btn' disabled={saving} onClick={save}>

            {saving ? 'Saving…' : 'Save'}

          </button>

        </div>

      </div>



      <div className='tabs'>

        {[

          'general',

          'knowledge',

          'integrations',

          'followups',

          'evaluation',

          'database',
          'complaints',
          'sales',

        ].map((t) => (

          <div

            key={t}

            className={`tab ${tab === t ? 'active' : ''}`}

            onClick={() => setTab(t)}

          >

            {t[0].toUpperCase() + t.slice(1)}

          </div>

        ))}

      </div>



      <div className='split' style={{ gridTemplateColumns: tab === 'general' ? '1fr 400px' : '1fr' }}>

        {/* LEFT */}

        <div
          className='left col'
          style={{
            borderRight: tab === 'general' ? '1px solid var(--border)' : 'none',
            paddingRight: tab === 'general' ? '32px' : '0',
            maxWidth: tab === 'general' ? undefined : '100%'
          }}
        >

          {tab === 'general' && (

            <div className='col'>

              <div className='muted'>AI Agent Behavior</div>

              <textarea

                className='textarea'

                rows={6}

                value={behavior}

                onChange={(e) => setBehavior(e.target.value)}

              />



              <div className='muted'>Welcome Message</div>

              <div

                className='muted'

                style={{ color: 'blue', cursor: 'pointer' }}

                onClick={() => document.getElementById('sticker-input').click()}

              >

                upload gambar

              </div>

              <input

                type='file'

                id='sticker-input'

                style={{ display: 'none' }}

                onChange={(e) => handleStickerSelect(e.target.files[0])}

                accept='image/*'

              />

              {stickerUrl && (

                <div className='row' style={{ gap: 8, alignItems: 'center' }}>

                  <img

                    src={`${api.defaults.baseURL}${stickerUrl}`}

                    alt='sticker'

                    style={{ width: 50, height: 50 }}

                  />

                  <button

                    className='btn ghost'

                    onClick={() => setStickerUrl('')}

                  >

                    Remove

                  </button>

                </div>

              )}

              <textarea

                className='textarea'

                rows={3}

                placeholder="Welcome message. You can use {{name}} to insert the user's name."

                value={welcomeMessage}

                onChange={(e) => setWelcomeMessage(e.target.value)}

              />



              <div className='muted'>Prompt AI</div>

              <textarea

                className='textarea'

                rows={4}

                value={prompt}

                onChange={(e) => setPrompt(e.target.value)}

              />

            </div>

          )}



          {tab === 'knowledge' && (



            <div className='col'>



              <div className='tabs'>



                <div className={`tab ${knowledgeTab === 'url' ? 'active' : ''}`} onClick={() => setKnowledgeTab('url')}>URL</div>



                <div className={`tab ${knowledgeTab === 'text' ? 'active' : ''}`} onClick={() => setKnowledgeTab('text')}>Text</div>



                <div className={`tab ${knowledgeTab === 'file' ? 'active' : ''}`} onClick={() => setKnowledgeTab('file')}>File</div>



                <div className={`tab ${knowledgeTab === 'qna' ? 'active' : ''}`} onClick={() => setKnowledgeTab('qna')}>Q&A</div>



              </div>







              <div



                className='row'



                style={{



                  justifyContent: 'space-between',



                  alignItems: 'center',



                  paddingTop: '16px'



                }}



              >



                <h3 style={{ margin: 0 }}>



                  Knowledge Sources: {knowledgeTab.toUpperCase()}



                </h3>



                <button



                  className='btn ghost'



                  onClick={() => addKnowledge(knowledgeTab === 'qna' ? { kind: 'qna', question: '', answer: '' } : { kind: knowledgeTab, value: '' })}



                >



                  + Add



                </button>



              </div>







              <div className='list'>



                {knowledge



                  .map((k, i) => ({ ...k, originalIndex: i })) // Keep original index



                  .filter((k) => k.kind === knowledgeTab)



                  .map((k) => (



                    <div key={k.originalIndex} className='rowi'>



                      <div className='col' style={{ gap: 8, flex: 1 }}>



                        {k.kind === 'qna' ? (



                          <div className='col' style={{ gap: 8, flex: 1 }}>



                            <input



                              className='input'



                              placeholder='Question'



                              value={k.question}



                              onChange={(e) =>



                                updKnowledge(k.originalIndex, { question: e.target.value })



                              }



                            />



                            <textarea



                              className='textarea'



                              placeholder='Answer'



                              value={k.answer}



                              onChange={(e) =>



                                updKnowledge(k.originalIndex, { answer: e.target.value })



                              }



                            />



                          </div>



                        ) : k.kind === 'file' ? (



                          k.value ? (



                            <div



                              className='row'



                              style={{ gap: 8, alignItems: 'center' }}



                            >



                              <span>{k.originalName || k.value.split('/').pop()}</span>



                              <a



                                href={`${api.defaults.baseURL}${k.value}`}



                                target='_blank'



                                rel='noreferrer'



                              >



                                Open



                              </a>



                              <button



                                className='btn ghost'



                                onClick={() => updKnowledge(k.originalIndex, { value: '' })}



                              >



                                Remove



                              </button>



                            </div>



                          ) : (



                            <FileInput



                              onFileSelect={(file) => handleFileSelect(file, k.originalIndex)}



                            />



                          )



                        ) : (



                          <textarea



                            className='textarea'



                            placeholder={



                              k.kind === 'text'



                                ? 'Enter text…'



                                : 'Paste URL or file path…'



                            }



                            value={k.value}



                            onChange={(e) =>



                              updKnowledge(k.originalIndex, { value: e.target.value })



                            }



                          />



                        )}



                      </div>



                      <button



                        className='btn ghost'



                        onClick={() => delKnowledge(k.originalIndex)}



                      >



                        🗑️



                      </button>



                    </div>



                  ))}



                {!knowledge.filter((k) => k.kind === knowledgeTab).length && (



                  <div className='muted'>Belum ada sumber pengetahuan.</div>



                )}



              </div>



            </div>



          )}




          {tab === 'complaints' && (
            <div className='col'>
              <div className='card'>
                <h3>Complaint Form Configuration</h3>
                <p className="muted">Define the specific fields or questions the AI should ask when a user wants to file a complaint. The AI will collect this information before filing the report.</p>

                <div className='col' style={{ gap: 8, marginTop: 16 }}>
                  {complaintFields.map((field, i) => (
                    <div key={i} className='row' style={{ gap: 8 }}>
                      <input
                        className='input'
                        value={field}
                        onChange={(e) => {
                          const next = [...complaintFields];
                          next[i] = e.target.value;
                          setComplaintFields(next);
                        }}
                        placeholder="e.g. Nama Lengkap"
                      />
                      <button className='btn ghost' onClick={() => {
                        const next = [...complaintFields];
                        next.splice(i, 1);
                        setComplaintFields(next);
                      }}>🗑️</button>
                    </div>
                  ))}
                  <button className='btn ghost' onClick={() => setComplaintFields([...complaintFields, ''])}>+ Add Field</button>
                </div>

                <hr style={{ margin: '24px 0', borderTop: '1px solid var(--border)' }} />

                <h3>Complaint Notifications</h3>
                <p className="muted">Automatically forward complaints to a manager or specific account.</p>

                <div className='row' style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <label className="switch">
                    <input
                      type='checkbox'
                      checked={complaintNotification.enabled}
                      onChange={(e) => setComplaintNotification({ ...complaintNotification, enabled: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                  <span onClick={() => setComplaintNotification({ ...complaintNotification, enabled: !complaintNotification.enabled })} style={{ cursor: 'pointer' }}>Enable Notifications</span>
                </div>

                {complaintNotification.enabled && (
                  <div className='col' style={{ gap: 16 }}>
                    <div className='col'>
                      <div className='muted'>Notification Platform</div>
                      <select
                        className='input'
                        value={complaintNotification.platformId || ''}
                        onChange={(e) => setComplaintNotification({ ...complaintNotification, platformId: e.target.value })}
                      >
                        <option value="">Select Platform</option>
                        {platforms.map(p => (
                          <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                        ))}
                      </select>
                    </div>
                    <div className='col'>
                      <div className='muted'>Destination (Phone Number or Chat ID)</div>
                      <input
                        className='input'
                        placeholder="e.g. 628123456789 (WA) or 123456789 (Telegram ID)"
                        value={complaintNotification.destination || ''}
                        onChange={(e) => setComplaintNotification({ ...complaintNotification, destination: e.target.value })}
                      />
                      <p className="muted" style={{ fontSize: '0.8em', marginTop: 4 }}>
                        Ensure the destination is valid for the selected platform. For WhatsApp, use the country code (e.g., 62...).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className='col'>
              <div className='row' style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Connected Apps</h3>
                  <div className='muted' style={{ marginTop: 4 }}>
                    Connect your chatbot with third-party applications to extend its functionality.
                  </div>
                </div>
              </div>

              <div className='integration-grid'>
                {/* Messaging Platform (Existing) */}
                <div className={`integration-card ${platformId ? 'active' : ''}`}>
                  <div className='integration-header'>
                    <div className='integration-icon' style={{ background: '#e0f2fe', color: '#0284c7' }}>
                      <FontAwesomeIcon icon={faComments} />
                    </div>
                    <div className='integration-status'>
                      {platformId ? <span className='status-dot active'></span> : <span className='status-dot'></span>}
                    </div>
                  </div>
                  <div className='integration-body'>
                    <h4>Messaging Platform</h4>
                    <p>Hubungkan agent ke platform messaging seperti Telegram atau WhatsApp.</p>
                  </div>
                  <div className='integration-footer'>
                    <div className='row' style={{ gap: 8, alignItems: 'center', width: '100%' }}>
                      <select
                        className='select'
                        style={{ flex: 1, fontSize: 12 }}
                        value={platformId || ''}
                        onChange={(e) => setPlatformId(e.target.value)}
                      >
                        <option value=''>Select Platform</option>
                        {platforms.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.label} ({p.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    {platformId && (
                      <div className='muted' style={{ fontSize: 10, marginTop: 4 }}>
                        Webhook: <code>{`<BASE>/webhook/<platform>`}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto Reminder (New) */}
                <div className={`integration-card ${tools.includes('time') ? 'active' : ''}`}>
                  <div className='integration-header'>
                    <div className='integration-icon' style={{ background: '#fce7f3', color: '#db2777' }}>
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className='integration-status'>
                      {tools.includes('time') ? <span className='status-dot active'></span> : <span className='status-dot'></span>}
                    </div>
                  </div>
                  <div className='integration-body'>
                    <h4>Auto Reminder</h4>
                    <p>Buat reminder untuk melakukan tugas tertentu pada waktu tertentu. (Uses Time API)</p>
                  </div>
                  <div className='integration-footer'>
                    <button className='btn ghost small'>Settings</button>
                    <button
                      className={`btn small ${tools.includes('time') ? 'active' : ''}`}
                      onClick={() => {
                        const newTools = tools.includes('time')
                          ? tools.filter(t => t !== 'time')
                          : [...tools, 'time'];
                        setTools(newTools);
                      }}
                    >
                      {tools.includes('time') ? 'Active' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Web Search (Placeholder) */}
                <div className='integration-card'>
                  <div className='integration-header'>
                    <div className='integration-icon' style={{ background: '#dbeafe', color: '#2563eb' }}>
                      <FontAwesomeIcon icon={faGlobe} />
                    </div>
                    <div className='integration-status'>
                      <span className='status-dot'></span>
                    </div>
                  </div>
                  <div className='integration-body'>
                    <h4>Web Search</h4>
                    <p>Cari informasi terkini dari web untuk menjawab pertanyaan pelanggan.</p>
                  </div>
                  <div className='integration-footer'>
                    <button className='btn ghost small'>Settings</button>
                    <button className='btn small'>Activate</button>
                  </div>
                </div>

                {/* Google Sheets (Placeholder) */}
                <div className='integration-card'>
                  <div className='integration-header'>
                    <div className='integration-icon' style={{ background: '#dcfce7', color: '#16a34a' }}>
                      <FontAwesomeIcon icon={faFileExcel} />
                    </div>
                    <div className='integration-status'>
                      <span className='status-dot'></span>
                    </div>
                  </div>
                  <div className='integration-body'>
                    <h4>Google Sheets</h4>
                    <p>Hubungkan ke Google Sheets untuk membaca dan menulis data.</p>
                  </div>
                  <div className='integration-footer'>
                    <button className='btn ghost small'>Settings</button>
                    <button className='btn small'>Activate</button>
                  </div>
                </div>

              </div>
            </div>
          )}



          {tab === 'followups' && (

            <div className='col'>

              <div

                className='row'

                style={{

                  justifyContent: 'space-between',

                  alignItems: 'center',

                }}

              >

                <h3 style={{ margin: 0 }}>Follow-ups</h3>

                <button className='btn ghost' onClick={addFollowUp}>

                  + Add

                </button>

              </div>

              <div className='list'>

                {followUps.map((f, i) => (

                  <div key={i} className='rowi'>

                    <div className='col' style={{ gap: 8, flex: 1 }}>

                      <textarea

                        className='textarea'

                        placeholder='Follow-up instruction'

                        value={f.prompt}

                        onChange={(e) =>

                          updFollowUp(i, { prompt: e.target.value })

                        }

                      />

                      <div

                        className='row'

                        style={{ gap: 8, alignItems: 'center' }}

                      >

                        <input

                          type='number'

                          className='input'

                          style={{ width: 100 }}

                          value={f.delay}

                          onChange={(e) =>

                            updFollowUp(i, { delay: e.target.value })

                          }

                        />

                        <div className='muted'>minutes after trigger</div>

                      </div>

                    </div>

                    <button

                      className='btn ghost'

                      onClick={() => delFollowUp(i)}

                    >

                      🗑️

                    </button>

                  </div>

                ))}

                {!followUps.length && (

                  <div className='muted'>No follow-ups configured.</div>

                )}

              </div>

            </div>

          )}



          {tab === 'evaluation' && (

            <div className='col'>

              <h3>Evaluation</h3>

              <div className='muted'>Placeholder metrik evaluasi.</div>

            </div>

          )}



          {tab === 'database' && (
            <div className='col'>
              <div
                className='row'
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <h3 style={{ margin: 0 }}>Database Files</h3>
                <div
                  className='col'
                  style={{
                    gap: 8,
                    minWidth: 260,
                    maxWidth: 340,
                    flex: '0 0 auto',
                  }}
                >
                  <FileInput onFileSelect={handleDatabaseFileSelect} />
                  {dbUploadStatus.status !== 'idle' && (
                    <div className={`upload-status ${dbUploadStatus.status}`}>
                      {dbUploadStatus.message}
                    </div>
                  )}
                </div>
              </div>

              <div className='list'>
                {combinedDatabase.map((f, i) => {
                  const fileKey = f.id || f.storedName || `${f.originalName}-${i}`
                  const link = getFileLink(f)
                  return (
                    <div key={fileKey} className='rowi' style={{ flexDirection: 'column', gap: 8 }}>
                      <div className='row' style={{ width: '100%', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div className='col' style={{ gap: 4, flex: 1 }}>
                          <div
                            className='row'
                            style={{
                              gap: 8,
                              alignItems: 'center',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>{f.originalName}</span>
                            {f.source === 'remote' && f.storedName ? (
                              <a
                                href={`${api.defaults.baseURL}/files/${f.storedName}`}
                                target='_blank'
                                rel='noreferrer'
                              >
                                Open
                              </a>
                            ) : (
                              f.dataUrl && (
                                <a href={f.dataUrl} download={f.originalName}>
                                  Download
                                </a>
                              )
                            )}
                            <span
                              className='badge'
                              style={{
                                background:
                                  f.source === 'remote' ? '#ecfdf3' : '#e0f2fe',
                                color:
                                  f.source === 'remote' ? '#047857' : '#0369a1',
                              }}
                            >
                              {f.source === 'remote' ? 'Server' : 'Local only'}
                            </span>
                          </div>
                          {f.size && (
                            <div className='muted' style={{ fontSize: 12 }}>
                              {(f.size / 1024).toFixed(1)} KB
                            </div>
                          )}
                        </div>

                        <div className='row' style={{ gap: 6 }}>
                          <button
                            className='btn ghost'
                            onClick={() => toggleLinkPanel(fileKey, f)}
                          >
                            Link
                          </button>
                          <button
                            className='btn ghost'
                            onClick={() => deleteDatabaseFile(f)}
                            title='Delete'
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>

                      {activeLinkId === fileKey && link && (
                        <div
                          className='row'
                          style={{
                            width: '100%',
                            gap: 8,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <input
                            className='input'
                            readOnly
                            value={link}
                            style={{ flex: 1 }}
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            className='btn ghost'
                            title='Copy link'
                            onClick={() => copyLink(link)}
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {!combinedDatabase.length && (
                  <div className='muted'>No database files yet.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'sales' && (
            <div className='col'>
              <AgentSales agent={agent} onUpdate={setAgent} />
            </div>
          )}

        </div>



        {/* RIGHT */}

        {tab === 'general' ? (

          <div className='right'>

            <div className='card testbox'>

              <div className='testhead'>

                <div className='avatar'>AI</div>

                <div style={{ fontWeight: 700 }}>{name || agent.name}</div>

                <button

                  className='btn ghost'

                  style={{ marginLeft: 'auto' }}

                  onClick={() => setMessages([])}

                >

                  ↻

                </button>

              </div>

              <div className='testmsgs'>

                {messages.map((m, idx) => (

                  <div key={idx} className={`bbl ${m.from}`}>

                    {m.text}

                    {m.sticker && (

                      <img

                        src={`${api.defaults.baseURL}${m.sticker}`}

                        alt='sticker'

                        style={{ width: 100, height: 100 }}

                      />

                    )}

                    {m.attachment && (

                      <div style={{ marginTop: 8 }}>

                        {(() => {

                          const filename = m.attachment.filename || '';

                          const url =

                            m.attachment.url && (m.attachment.url.startsWith('http://') || m.attachment.url.startsWith('https://'))

                              ? m.attachment.url

                              : `${api.defaults.baseURL}${m.attachment.url || ''}`;

                          const isImage = /\.(png|jpe?g|gif|webp)$/i.test(filename);

                          if (isImage) {

                            return (

                              <img

                                src={url}

                                alt={filename || 'attachment'}

                                style={{ maxWidth: 220, borderRadius: 8, display: 'block' }}

                              />

                            );

                          }

                          return (

                            <a

                              href={url}

                              target="_blank"

                              rel="noopener noreferrer"

                              className='btn ghost'

                            >

                              Download {filename || 'file'}

                            </a>

                          );

                        })()}

                      </div>

                    )}

                  </div>

                ))}

                {testing && (
                  <div className='bbl ai' style={{ opacity: 0.7 }}>
                    <div className='typing-indicator'>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}

              </div>

              <div className='col' style={{ gap: 8 }}>
                {testAttachment && (
                  <div className='row' style={{ gap: 8, alignItems: 'center', padding: 8, background: '#f3f4f6', borderRadius: 8 }}>
                    <img
                      src={testAttachment.preview}
                      alt='Preview'
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <span style={{ flex: 1, fontSize: 12 }}>{testAttachment.file?.name}</span>
                    <button
                      className='btn ghost'
                      onClick={() => setTestAttachment(null)}
                      style={{ padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className='row'>

                  <input

                    className='input'

                    placeholder='Ketik pesan uji…'

                    value={testMsg}

                    onChange={(e) => setTestMsg(e.target.value)}

                    onKeyDown={(e) => e.key === 'Enter' && sendTest()}

                  />

                  <input
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    id='test-photo-input'
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                          setTestAttachment({
                            file,
                            preview: reader.result
                          })
                        }
                        reader.readAsDataURL(file)
                      }
                      e.target.value = ''
                    }}
                  />

                  <button
                    className='btn ghost'
                    onClick={() => document.getElementById('test-photo-input')?.click()}
                    title='Attach photo'
                  >
                    📎
                  </button>

                  <button className='btn' onClick={sendTest} disabled={testing}>

                    {testing ? '...' : 'Kirim'}

                  </button>

                </div>
              </div>

              <div className='muted' style={{ marginTop: 6 }}>

                Tanpa API key, balasan akan berupa “Echo: &lt;pesan&gt;”.

              </div>

            </div>

          </div>

        ) : (

          <div className='right'></div>

        )}

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
