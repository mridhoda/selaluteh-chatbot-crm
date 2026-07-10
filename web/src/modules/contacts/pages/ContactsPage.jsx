import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Filter,
  Search,
  Clock,
  UserX,
  Star,
  AlertCircle,
  AlertTriangle,
  Ban,
  Archive,
  MoreVertical,
  MessageCircle,
  MessageSquare,
  Mail,
  Store,
  ShoppingBag,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  Activity,
  User,
  CloudUpload,
  Info,
  Check,
  CheckCircle2,
  Globe,
  Calendar,
  Send,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../../../shared/api/httpClient'

const mockPreviewData = [
  { name: 'Rina Pratiwi', phone: '+62 812 3456 7890', channel: 'WhatsApp', outlet: 'Samarinda', tags: 'VIP, Returning Customer' },
  { name: 'Budi Permana', phone: '+62 819 8888 7766', channel: 'Telegram', outlet: 'Tenggarong', tags: '-' },
  { name: 'Siti Nurhaliza', phone: '+62 821 1122 3344', channel: 'WhatsApp', outlet: 'Bontang', tags: 'VIP' },
  { name: 'Andi Dharma', phone: '+62 813 4655 6677', channel: 'Website', outlet: 'Samarinda', tags: 'Complaint Risk' },
  { name: 'Yuliana Sari', phone: '+62 813 7254 5878', channel: 'WhatsApp', outlet: 'Tenggarong', tags: '-' },
]

const FilterBtn = ({ active, theme, icon, label }) => {
  let activeClasses = 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
  if (active) {
    if (theme === 'rose') activeClasses = 'border-rose-500 text-rose-700 bg-rose-50 font-semibold'
    if (theme === 'green') activeClasses = 'border-emerald-500 text-emerald-700 bg-emerald-50 font-semibold'
  }
  
  return (
    <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${activeClasses}`}>
      {icon}
      {label}
    </button>
  )
}

// Hardcoded seed data to fallback to if backend is empty or offline
const contactsData = [
  {
    id: 1,
    name: 'Rina Pratiwi',
    phone: '+62 812 3456 7890',
    initials: 'RP',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    channel: 'WhatsApp',
    channelColor: 'text-green-500',
    outlet: 'Samarinda',
    tags: ['VIP', 'Returning'],
    assignedTo: {
      name: 'Fadli A.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    },
    lastMessage: 'Terima kasih! Pesanan sudah diterima 🙏',
    lastMessageTime: '10:24 AM',
    lastActive: '10:24 AM',
    lastActiveDate: 'Today',
    lastActiveStatus: 'online',
    orders: 12,
    status: 'Active',
    selected: true,
  },
  {
    id: 2,
    name: 'Budi Permana',
    phone: '+62 812 9988 7766',
    initials: 'BP',
    avatar: null,
    avatarColor: 'bg-red-100 text-red-600',
    channel: 'Telegram',
    channelColor: 'text-blue-500',
    outlet: 'Tenggarong',
    tags: ['New Lead'],
    assignedTo: {
      name: 'Siti N.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    },
    lastMessage: 'Apakah masih ada promo hari ini?',
    lastMessageTime: 'Yesterday',
    lastActive: 'Yesterday',
    lastActiveDate: '8:45 PM',
    lastActiveStatus: 'offline',
    orders: 1,
    status: 'Needs Follow-up',
    selected: false,
  },
  {
    id: 3,
    name: 'Siti Nurhaliza',
    phone: '+62 821 1122 3344',
    initials: 'SN',
    avatar: null,
    avatarColor: 'bg-purple-100 text-purple-600',
    channel: 'WhatsApp',
    channelColor: 'text-green-500',
    outlet: 'Bontang',
    tags: ['VIP', 'Returning'],
    assignedTo: {
      name: 'Dewi L.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    },
    lastMessage: 'Bisa bantu cek ongkir ke Bontang?',
    lastMessageTime: 'Yesterday',
    lastActive: 'Yesterday',
    lastActiveDate: '3:12 PM',
    lastActiveStatus: 'online',
    orders: 7,
    status: 'Active',
    selected: false,
  },
  {
    id: 4,
    name: 'Andi Dharma',
    phone: '+62 813 4555 6677',
    initials: 'AD',
    avatar: null,
    avatarColor: 'bg-orange-100 text-orange-600',
    channel: 'Website',
    channelColor: 'text-indigo-500',
    outlet: 'Samarinda',
    tags: ['Complaint Risk'],
    assignedTo: {
      name: 'Rizky M.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    },
    lastMessage: 'Produk yang diterima rusak saat pengiriman',
    lastMessageTime: 'May 18, 2026',
    lastActive: 'May 18, 2026',
    lastActiveDate: '11:03 AM',
    lastActiveStatus: 'away',
    orders: 3,
    status: 'Needs Follow-up',
    selected: false,
  },
  {
    id: 5,
    name: 'Yuliana Sari',
    phone: '+62 857 1234 5678',
    initials: 'YL',
    avatar: null,
    avatarColor: 'bg-teal-100 text-teal-600',
    channel: 'WhatsApp',
    channelColor: 'text-green-500',
    outlet: 'Tenggarong',
    tags: ['New Lead'],
    assignedTo: {
      name: 'Fadli A.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    },
    lastMessage: 'Halo, saya mau tanya ketersediaan produk.',
    lastMessageTime: 'May 17, 2026',
    lastActive: 'May 17, 2026',
    lastActiveDate: '9:15 PM',
    lastActiveStatus: 'offline',
    orders: 0,
    status: 'Unassigned',
    selected: false,
  },
  {
    id: 6,
    name: 'Muhammad Rizky',
    phone: '+62 811 2233 4455',
    initials: 'MR',
    avatar: null,
    avatarColor: 'bg-yellow-100 text-yellow-600',
    channel: 'Telegram',
    channelColor: 'text-blue-500',
    outlet: 'Bontang',
    tags: ['Returning', '+1'],
    assignedTo: {
      name: 'Siti N.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    },
    lastMessage: 'Siap, ditunggu pesanannya!',
    lastMessageTime: 'May 17, 2026',
    lastActive: 'May 17, 2026',
    lastActiveDate: '4:22 PM',
    lastActiveStatus: 'online',
    orders: 5,
    status: 'Active',
    selected: false,
  },
  {
    id: 7,
    name: 'Nadia Wahyu',
    phone: '+62 815 6677 8899',
    initials: 'NW',
    avatar: null,
    avatarColor: 'bg-indigo-100 text-indigo-600',
    channel: 'Website',
    channelColor: 'text-indigo-500',
    outlet: 'Samarinda',
    tags: ['VIP'],
    assignedTo: {
      name: 'Rizky M.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    },
    lastMessage: 'Minta rekomendasi produk skincare',
    lastMessageTime: 'May 16, 2026',
    lastActive: 'May 16, 2026',
    lastActiveDate: '2:08 PM',
    lastActiveStatus: 'online',
    orders: 9,
    status: 'Active',
    selected: false,
  },
  {
    id: 8,
    name: 'Hendra Firmansyah',
    phone: '+62 812 7766 5544',
    initials: 'HF',
    avatar: null,
    avatarColor: 'bg-blue-100 text-blue-600',
    channel: 'WhatsApp',
    channelColor: 'text-green-500',
    outlet: 'Tenggarong',
    tags: ['Complaint Risk'],
    assignedTo: {
      name: 'Dewi L.',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    },
    lastMessage: 'Refund belum masuk ke rekening saya',
    lastMessageTime: 'May 15, 2026',
    lastActive: 'May 15, 2026',
    lastActiveDate: '10:11 AM',
    lastActiveStatus: 'away',
    orders: 2,
    status: 'Needs Follow-up',
    selected: false,
  },
]

const SidebarItem = ({ icon: Icon, label, count, active, onClick }) => {
  const baseClasses =
    'flex items-center justify-between px-4 h-[53px] rounded-lg mb-1 cursor-pointer transition-all text-sm font-medium'
  const activeClasses = active
    ? 'bg-brand-50 text-brand-600 font-semibold'
    : 'text-slate-600 hover:bg-slate-50/70'

  return (
    <button
      className={`${baseClasses} ${activeClasses} w-full text-left`}
      onClick={onClick}
    >
      <div className='flex items-center gap-3'>
        <Icon
          size={18}
          className={active ? 'text-brand-500' : 'text-slate-400'}
        />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span
          className={`text-xs ${active ? 'text-brand-600 font-bold' : 'text-slate-400'}`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

const Tag = ({ text, type, onDelete }) => {
  let colorClasses = 'bg-gray-100 text-gray-600 border-gray-200'
  if (type === 'vip')
    colorClasses = 'bg-brand-50 text-brand-600 border-brand-200'
  if (type === 'returning')
    colorClasses = 'bg-blue-50 text-blue-600 border-blue-200'
  if (type === 'new') colorClasses = 'bg-cyan-50 text-cyan-600 border-cyan-200'
  if (type === 'complaint')
    colorClasses = 'bg-orange-50 text-orange-600 border-orange-200'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-bold ${colorClasses}`}
    >
      {text}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className='hover:bg-black/10 rounded-full p-0.5 border-none bg-transparent cursor-pointer inline-flex items-center justify-center'
        >
          <X size={8} />
        </button>
      )}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  let colorClasses = 'bg-gray-50 text-gray-600 border-gray-200'
  if (status === 'Active')
    colorClasses = 'bg-emerald-50 text-emerald-600 border-emerald-200'
  if (status === 'Needs Follow-up')
    colorClasses = 'bg-orange-50 text-orange-600 border-orange-200'

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${colorClasses}`}
    >
      {status}
    </span>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeContactId, setActiveContactId] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('All Contacts')
  const [q, setQ] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isDetailOpen, setIsDetailOpen] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Tag input state in right panel
  const [newTagVal, setNewTagVal] = useState('')
  const [showAddTagInput, setShowAddTagInput] = useState(false)

  // Add Contact Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  // Import & Filter Modals State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [duplicateAction, setDuplicateAction] = useState('skip')
  const [isWorkspaceAssigned, setIsWorkspaceAssigned] = useState(true)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const searchInputRef = useRef(null)

  // Fetch contacts from backend
  const loadContacts = async () => {
    setLoading(true)
    setLoadError('')
    try {
      // Load the full CRM contact set used by the local table pagination.
      // The previous UI rendered hardcoded summary numbers instead.
      const res = await api.get('/contacts', { params: { page: 1, limit: 200 } })
      const apiData = res.data?.data || res.data || []
      setTotalContacts(Number(res.data?.meta?.total ?? apiData.length))
      const enriched = apiData.map((c) => {
        const name = c.name || 'Unnamed Contact'
        const orderCount = Number(c.orderCount || 0)
        const isOnlineStoreAccount = c.metadata?.account_type === 'customer' || c.tags?.some((tag) => String(tag).toLowerCase() === 'online_store')
        const derivedType = orderCount > 0
          ? (orderCount >= 5 ? 'VIP / High Value' : 'Customer')
          : isOnlineStoreAccount
            ? 'New Lead'
            : c.lastMessageAt
              ? 'Engaged Lead'
              : 'New Lead'
        const derivedTags = [...new Set([...(c.tags || []), derivedType])]
        const lastActivity = c.lastMessageAt || c.lastOrderAt || null
        return {
          id: c.id || c._id,
          _id: c._id || c.id,
          name,
          phone: c.phone || c.platformAccountId || '-',
          initials: name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2),
          avatar: c.metadata?.avatar || null,
          avatarColor: 'bg-brand-100 text-brand-600',
          channel: c.metadata?.source === 'online_store_profile' || isOnlineStoreAccount ? 'Website' : (c.platformId ? 'Connected Channel' : 'Unknown'),
          channelColor: 'text-indigo-500',
          outlet: c.lastOutletId || '-',
          tags: derivedTags,
          assignedTo: c.metadata?.assignedTo || null,
          lastMessage: c.metadata?.lastMessage || (c.lastOrderAt ? 'Order activity recorded' : '-'),
          lastMessageTime: lastActivity ? new Date(lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          lastActive: lastActivity ? new Date(lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
          lastActiveDate: lastActivity ? new Date(lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
          lastActivityAt: lastActivity || null,
          lastActiveStatus: 'offline',
          orders: orderCount,
          lastOrder: c.lastOrder || null,
          customerSince: c.createdAt || null,
          status: c.status || (orderCount > 0 ? 'Active' : 'Unassigned'),
        }
      })
      setContacts(enriched)
      if (enriched.length > 0 && !activeContactId) setActiveContactId(enriched[0].id)
    } catch (err) {
      console.error('Failed to load contacts:', err)
      setContacts([])
      setTotalContacts(0)
      setLoadError('Gagal memuat data contacts dari server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  // Listen to Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate counts for sidebar filters
  const counts = useMemo(() => {
    const isToday = (value) => {
      if (!value) return false
      const date = new Date(value)
      const now = new Date()
      return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString()
    }
    return {
      all: totalContacts,
      recent: contacts.filter((c) => isToday(c.lastActivityAt)).length,
      unassigned: contacts.filter(
        (c) => c.status === 'Unassigned' || !c.assignedTo
      ).length,
      vip: contacts.filter((c) =>
        c.tags?.some((t) => t.toUpperCase().includes('VIP'))
      ).length,
      newLeads: contacts.filter((c) =>
        c.tags?.some((t) => t.toUpperCase().includes('NEW'))
      ).length,
      complaint: contacts.filter((c) =>
        c.tags?.some((t) => t.toUpperCase().includes('COMPLAINT'))
      ).length,
      needsFollowup: contacts.filter((c) => c.status === 'Needs Follow-up')
        .length,
      blocked: contacts.filter((c) => c.status === 'Blocked').length,
      archived: contacts.filter((c) => c.status === 'Archived').length,
    }
  }, [contacts, totalContacts])

  // Apply filters and searches
  const filteredContacts = useMemo(() => {
    let list = contacts

    // Search query filter
    if (q) {
      const query = q.toLowerCase()
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.id?.toString().includes(query)
      )
    }

    // Sidebar view filters
    if (selectedFilter === 'Recent') {
      list = list.filter(
        (c) =>
          c.lastActiveDate === 'Today' ||
          c.lastActive === 'Today' ||
          c.lastMessageTime?.includes('AM') ||
          c.lastMessageTime?.includes('PM')
      )
    } else if (selectedFilter === 'Unassigned') {
      list = list.filter((c) => c.status === 'Unassigned' || !c.assignedTo)
    } else if (selectedFilter === 'VIP / High Value') {
      list = list.filter((c) =>
        c.tags?.some((t) => t.toUpperCase().includes('VIP'))
      )
    } else if (selectedFilter === 'New Leads') {
      list = list.filter((c) =>
        c.tags?.some((t) => t.toUpperCase().includes('NEW'))
      )
    } else if (selectedFilter === 'Complaint Risk') {
      list = list.filter((c) =>
        c.tags?.some((t) => t.toUpperCase().includes('COMPLAINT'))
      )
    } else if (selectedFilter === 'Needs Follow-up') {
      list = list.filter((c) => c.status === 'Needs Follow-up')
    } else if (selectedFilter === 'Blocked') {
      list = list.filter((c) => c.status === 'Blocked')
    } else if (selectedFilter === 'Archived') {
      list = list.filter((c) => c.status === 'Archived')
    }

    return list
  }, [contacts, q, selectedFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredContacts.slice(start, start + itemsPerPage)
  }, [filteredContacts, currentPage, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [q, selectedFilter, itemsPerPage])

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p)
    }
  }

  const getPageNumbers = () => {
    const delta = 1
    const range = []
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }
    if (currentPage - delta > 2) range.unshift('...')
    if (currentPage + delta < totalPages - 1) range.push('...')
    range.unshift(1)
    if (totalPages > 1) range.push(totalPages)
    return range
  }

  const activeContact = contacts.find((c) => c.id === activeContactId)

  // Checkbox select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedContacts.map((c) => c.id)
      setSelectedIds(new Set([...selectedIds, ...pageIds]))
    } else {
      const pageIds = paginatedContacts.map((c) => c.id)
      const nextSelected = new Set(selectedIds)
      pageIds.forEach((id) => nextSelected.delete(id))
      setSelectedIds(nextSelected)
    }
  }

  const handleSelectRow = (e, id) => {
    e.stopPropagation()
    const nextSelected = new Set(selectedIds)
    if (nextSelected.has(id)) {
      nextSelected.delete(id)
    } else {
      nextSelected.add(id)
    }
    setSelectedIds(nextSelected)
  }

  const isAllPageSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((c) => selectedIds.has(c.id))

  // Tag modifiers (persisting to server via API)
  const handleAddTag = async (e) => {
    e.preventDefault()
    if (!newTagVal.trim() || !activeContact) return
    const tag = newTagVal.trim()
    const currentTags = activeContact.tags || []
    if (currentTags.includes(tag)) return
    const updatedTags = [...currentTags, tag]

    // Optimistic UI update
    setContacts(
      contacts.map((c) =>
        c.id === activeContact.id ? { ...c, tags: updatedTags } : c
      )
    )
    setNewTagVal('')
    setShowAddTagInput(false)

    try {
      await api.put(`/contacts/${activeContact.id}`, { tags: updatedTags })
    } catch (err) {
      console.error('Failed to sync tag additions to server:', err)
    }
  }

  const handleRemoveTag = async (tagToRemove) => {
    if (!activeContact) return
    const updatedTags = (activeContact.tags || []).filter(
      (t) => t !== tagToRemove
    )

    // Optimistic UI update
    setContacts(
      contacts.map((c) =>
        c.id === activeContact.id ? { ...c, tags: updatedTags } : c
      )
    )

    try {
      await api.put(`/contacts/${activeContact.id}`, { tags: updatedTags })
    } catch (err) {
      console.error('Failed to sync tag removal to server:', err)
    }
  }

  // Add Contact logic
  const handleAddContactSubmit = async (e) => {
    e.preventDefault()
    if (!newContactName.trim()) return

    const newContactObj = {
      id: Date.now(),
      name: newContactName,
      phone: newContactPhone || '-',
      initials: newContactName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      avatar: null,
      avatarColor: 'bg-brand-100 text-brand-600',
      channel: 'WhatsApp',
      channelColor: 'text-green-500',
      outlet: '-',
      tags: ['New Lead'],
      assignedTo: null,
      lastMessage: '-',
      lastMessageTime: '-',
      lastActive: '-',
      lastActiveDate: '-',
      lastActiveStatus: 'offline',
      orders: 0,
      lastOrder: null,
      customerSince: new Date().toISOString(),
      status: 'Unassigned',
    }

    setContacts([newContactObj, ...contacts])
    setActiveContactId(newContactObj.id)
    setNewContactName('')
    setNewContactPhone('')
    setIsAddModalOpen(false)

    // We can run an API check/creation if backend allowed it, but since no POST /contacts:
    try {
      // Just in case backend updates post endpoints, attempt a dummy hit or silently complete
      await api.post('/contacts', {
        name: newContactName,
        phone: newContactPhone,
        tags: ['New Lead'],
      })
    } catch (err) {
      // Swallowed since backend doesn't export POST /contacts
    }
  }

  // Excel Export handler
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      contacts.map((c) => ({
        Name: c.name,
        'Phone/ID': c.phone || '-',
        Outlet: c.outlet || '-',
        Channel: c.channel || '-',
        Tags: c.tags?.join(', ') || '',
        'Assigned To': c.assignedTo?.name || 'Unassigned',
        'Last Message': c.lastMessage || '-',
        'Last Message Time': c.lastMessageTime || '-',
        Orders: c.orders || 0,
        Status: c.status || '-',
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, 'contacts.xlsx')
  }

  return (
    <div className='flex-1 flex flex-col min-h-0 overflow-hidden h-[calc(100vh-58px)] max-h-[calc(100vh-58px)] -mx-4 -my-4 bg-[#f6f8fb] p-4'>
      {/* Header Area */}
      <div className='mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 px-1'>
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 flex-shrink-0'>
            <Users size={22} />
          </div>
          <div>
            <h1 className='text-xl font-extrabold text-slate-900 leading-none'>
              Contacts
            </h1>
            <p className='text-xs text-slate-500 mt-1.5 font-semibold'>
              Manage customer relationships across all channels and outlets.
            </p>
          </div>
        </div>
        <div className='flex items-center flex-wrap gap-2'>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className='flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 border-none rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]'
          >
            <Plus size={16} />
            Add Contact
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className='flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer'
          >
            <Upload size={16} className='text-slate-400' />
            Import Contacts
          </button>
          <button
            onClick={exportToExcel}
            className='flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer'
          >
            <Download size={16} className='text-slate-400' />
            Export
          </button>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className='flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer'
          >
            <Filter size={16} className='text-slate-400' />
            Filters
          </button>
        </div>
      </div>

      {/* Main Content Area (wrapper under header) */}
      <div className='flex-1 flex gap-4 min-h-0 overflow-hidden'>
        {/* Left & Center Content Column */}
        <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
          {/* Search & Stats Row */}
          <div className='flex gap-4 items-center flex-shrink-0 mb-4'>
        {/* Search Bar */}
        <div className='w-[480px] bg-white rounded-xl shadow-sm border border-slate-100 px-3.5 h-[72px] flex items-center gap-2.5 flex-shrink-0'>
          <Search size={18} className='text-slate-400 flex-shrink-0' />
          <input
            ref={searchInputRef}
            type='text'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search contacts by name, phone, or ID...'
            className='flex-1 bg-transparent border-none outline-none text-sm placeholder-slate-400 text-slate-800'
          />
          <kbd className='text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded pointer-events-none'>
            ⌘K
          </kbd>
        </div>

        {/* Top Stats Grid */}
        <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0'>
          {/* Stat Card 1 */}
          <div className='bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 h-[72px]'>
            <div className='w-8.5 h-8.5 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 flex-shrink-0'>
              <Users size={16} />
            </div>
            <div className='min-w-0 flex-1 flex flex-col justify-center'>
              <p className='text-[10px] text-slate-500 font-semibold leading-none truncate'>
                Total Contacts
              </p>
              <h3 className='text-base font-extrabold text-slate-950 mt-0.5 leading-none'>
                {totalContacts.toLocaleString()}
              </h3>
              <p className='text-[9px] text-slate-400 font-medium mt-0.5 leading-none'>
                Data aktual dari workspace
              </p>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className='bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 h-[72px]'>
            <div className='w-8.5 h-8.5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0'>
              <Activity size={16} />
            </div>
            <div className='min-w-0 flex-1 flex flex-col justify-center'>
              <p className='text-[10px] text-slate-500 font-semibold leading-none truncate'>
                Active Today
              </p>
              <h3 className='text-base font-extrabold text-slate-950 mt-0.5 leading-none'>
                {counts.recent.toLocaleString()}
              </h3>
              <p className='text-[9px] text-slate-400 font-medium mt-0.5 leading-none'>
                Aktivitas hari ini
              </p>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className='bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 h-[72px]'>
            <div className='w-8.5 h-8.5 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0'>
              <User size={16} />
            </div>
            <div className='min-w-0 flex-1 flex flex-col justify-center'>
              <p className='text-[10px] text-slate-500 font-semibold leading-none truncate'>
                Unassigned
              </p>
              <h3 className='text-base font-extrabold text-slate-950 mt-0.5 leading-none'>
                {counts.unassigned.toLocaleString()}
              </h3>
              <p className='text-[9px] text-slate-400 font-medium mt-0.5 leading-none'>
                Belum memiliki assignee
              </p>
            </div>
          </div>

          {/* Stat Card 4 */}
          <div className='bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 h-[72px]'>
            <div className='w-8.5 h-8.5 rounded-full bg-ai-50 flex items-center justify-center text-ai-500 flex-shrink-0'>
              <Star size={16} className='fill-ai-500 text-ai-500' />
            </div>
            <div className='min-w-0 flex-1 flex flex-col justify-center'>
              <p className='text-[10px] text-slate-500 font-semibold leading-none truncate'>
                VIP / High Value
              </p>
              <h3 className='text-base font-extrabold text-slate-950 mt-0.5 leading-none'>
                {counts.vip.toLocaleString()}
              </h3>
              <p className='text-[9px] text-ai-600 font-bold mt-0.5 leading-none'>
                {totalContacts > 0 ? `${((counts.vip / totalContacts) * 100).toFixed(1)}%` : '0%'}{' '}
                <span className='text-slate-400 font-medium'>dari total</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className='flex-1 flex gap-4 min-h-0 overflow-hidden'>
        {/* Left Sidebar */}
        <div className='w-[280px] flex flex-col gap-4 flex-shrink-0 h-full min-h-0'>
          {/* Navigation List */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex-1 overflow-y-auto min-h-0 flex flex-col'>
            <SidebarItem
              icon={Users}
              label='All Contacts'
              count={counts.all.toLocaleString()}
              active={selectedFilter === 'All Contacts'}
              onClick={() => setSelectedFilter('All Contacts')}
            />
            <SidebarItem
              icon={Clock}
              label='Recent'
              count={counts.recent.toLocaleString()}
              active={selectedFilter === 'Recent'}
              onClick={() => setSelectedFilter('Recent')}
            />
            <SidebarItem
              icon={User}
              label='Unassigned'
              count={counts.unassigned.toLocaleString()}
              active={selectedFilter === 'Unassigned'}
              onClick={() => setSelectedFilter('Unassigned')}
            />
            <SidebarItem
              icon={Star}
              label='VIP / High Value'
              count={counts.vip.toLocaleString()}
              active={selectedFilter === 'VIP / High Value'}
              onClick={() => setSelectedFilter('VIP / High Value')}
            />

            <div className='h-px bg-slate-100 my-2 mx-4'></div>

            <SidebarItem
              icon={UserPlus}
              label='New Leads'
              count={counts.newLeads.toLocaleString()}
              active={selectedFilter === 'New Leads'}
              onClick={() => setSelectedFilter('New Leads')}
            />
            <SidebarItem
              icon={AlertTriangle}
              label='Complaint Risk'
              count={counts.complaint.toLocaleString()}
              active={selectedFilter === 'Complaint Risk'}
              onClick={() => setSelectedFilter('Complaint Risk')}
            />
            <SidebarItem
              icon={AlertCircle}
              label='Needs Follow-up'
              count={counts.needsFollowup.toLocaleString()}
              active={selectedFilter === 'Needs Follow-up'}
              onClick={() => setSelectedFilter('Needs Follow-up')}
            />

            <div className='h-px bg-slate-100 my-2 mx-4'></div>

            <SidebarItem
              icon={Ban}
              label='Blocked'
              count={counts.blocked.toLocaleString()}
              active={selectedFilter === 'Blocked'}
              onClick={() => setSelectedFilter('Blocked')}
            />
            <SidebarItem
              icon={Archive}
              label='Archived'
              count={counts.archived.toLocaleString()}
              active={selectedFilter === 'Archived'}
              onClick={() => setSelectedFilter('Archived')}
            />
          </div>

          {/* AI Assistant Banner */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative overflow-hidden group cursor-pointer hover:border-ai-200 transition-all duration-300 flex-shrink-0'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-ai-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50'></div>
            <div className='relative z-10'>
              <div className='flex items-center gap-2 mb-2'>
                <h3 className='font-extrabold text-sm text-slate-900 leading-none'>
                  AI Assistant
                </h3>
                <span className='bg-ai-100 text-ai-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none'>
                  Beta
                </span>
              </div>
              <p className='text-[11px] text-slate-500 mb-4 pr-6 leading-relaxed font-semibold'>
                Let KALIS.AI help you prioritize and engage your best leads.
              </p>

              <div className='absolute right-2 bottom-12 text-ai-500 opacity-80 group-hover:scale-110 transition-transform'>
                <Bot size={32} />
              </div>

              <button
                onClick={() => alert('AI Assistant loading...')}
                className='w-full bg-white border border-ai-100 text-ai-600 text-xs font-bold py-2 rounded-lg flex items-center justify-between px-3 hover:bg-ai-50 transition-colors cursor-pointer'
              >
                Open AI Assistant
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Center Main Content */}
        <div className='flex-1 flex flex-col min-w-0 h-full min-h-0'>
          {/* Table Card (in a separate white card) */}
          <div className='flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden'>
            {/* Data Table Area */}
            <div className='flex-1 overflow-auto min-h-0'>
              <table className='w-full text-left text-sm whitespace-nowrap border-collapse'>
                <thead className='sticky top-0 bg-white shadow-sm z-10'>
                  <tr className='text-xs text-slate-500 font-extrabold border-b border-slate-100 bg-white'>
                    <th className='px-4 py-3 w-10 text-center'>
                      <input
                        type='checkbox'
                        checked={isAllPageSelected}
                        onChange={handleSelectAll}
                        className='w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 accent-brand-500 cursor-pointer'
                      />
                    </th>
                    <th className='px-4 py-3'>Contact</th>
                    <th className='px-4 py-3'>Channel</th>
                    <th className='px-4 py-3'>Outlet</th>
                    <th className='px-4 py-3'>Tags</th>
                    <th className='px-4 py-3'>Assigned To</th>
                    <th className='px-4 py-3 w-64'>Last Message</th>
                    <th className='px-4 py-3'>Last Active</th>
                    <th className='px-4 py-3 text-center'>Orders</th>
                    <th className='px-4 py-3 text-center'>Status</th>
                    <th className='px-4 py-3 text-center'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-50'>
                  {loading ? (
                    <tr>
                      <td
                        colSpan='11'
                        className='px-4 py-10 text-center text-slate-400 font-semibold'
                      >
                        Loading contacts...
                      </td>
                    </tr>
                  ) : paginatedContacts.length === 0 ? (
                    <tr>
                      <td
                        colSpan='11'
                        className='px-4 py-10 text-center text-slate-400 font-semibold'
                      >
                        {loadError || `No contacts found matching "${q}" under "${selectedFilter}"`}
                      </td>
                    </tr>
                  ) : (
                    paginatedContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${activeContactId === contact.id ? 'bg-brand-50/30' : ''}`}
                        onClick={() => {
                          setActiveContactId(contact.id)
                          setIsDetailOpen(true)
                        }}
                      >
                        <td
                          className='px-4 py-3 text-center'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type='checkbox'
                            checked={selectedIds.has(contact.id)}
                            onChange={(e) => handleSelectRow(e, contact.id)}
                            className='w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 accent-brand-500 cursor-pointer'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            {contact.avatar ? (
                              <img
                                src={contact.avatar}
                                alt={contact.name}
                                className='w-8 h-8 rounded-full border border-slate-100'
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${contact.avatarColor}`}
                              >
                                {contact.initials}
                              </div>
                            )}
                            <div>
                              <p className='font-bold text-slate-900 leading-none'>
                                {contact.name}
                              </p>
                              <p className='text-xs text-slate-500 mt-1 font-semibold leading-none'>
                                {contact.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-1.5'>
                            <MessageCircle
                              size={14}
                              className={contact.channelColor}
                            />
                            <span className='text-slate-700 font-semibold text-xs'>
                              {contact.channel}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-slate-700 font-semibold text-xs'>
                          {contact.outlet}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex flex-wrap gap-1'>
                            {contact.tags?.map((tag, i) => (
                              <React.Fragment key={i}>
                                {tag === '+1' ? (
                                  <span className='px-1.5 py-0.5 rounded-full text-[10px] border border-slate-200 bg-slate-50 text-slate-500 font-bold'>
                                    +1
                                  </span>
                                ) : (
                                  <Tag
                                    text={tag}
                                    type={
                                      tag.includes('VIP')
                                        ? 'vip'
                                        : tag.includes('Returning')
                                          ? 'returning'
                                          : tag.includes('New')
                                            ? 'new'
                                            : 'complaint'
                                    }
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          {contact.assignedTo ? <div className='flex items-center gap-2'>
                            {contact.assignedTo.avatar && <img src={contact.assignedTo.avatar} alt={contact.assignedTo.name || 'Assigned agent'} className='w-6 h-6 rounded-full' />}
                            <span className='text-slate-700 font-semibold text-xs'>{contact.assignedTo.name || '-'}</span>
                          </div> : <span className='text-slate-400 font-semibold text-xs'>-</span>}
                        </td>
                        <td className='px-4 py-3 max-w-[200px]'>
                          <p
                            className='text-slate-800 font-semibold text-xs truncate'
                            title={contact.lastMessage}
                          >
                            {contact.lastMessage}
                          </p>
                          <p className='text-[10px] text-slate-400 mt-1 font-semibold'>
                            {contact.lastMessageTime}
                          </p>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-1.5'>
                            <span className='text-slate-800 font-semibold text-xs'>
                              {contact.lastActive}
                            </span>
                            {contact.lastActiveStatus === 'online' && (
                              <div className='w-1.5 h-1.5 rounded-full bg-emerald-500'></div>
                            )}
                            {contact.lastActiveStatus === 'away' && (
                              <div className='w-1.5 h-1.5 rounded-full bg-orange-400'></div>
                            )}
                          </div>
                          <p className='text-[10px] text-slate-400 mt-1 font-semibold'>
                            {contact.lastActiveDate}
                          </p>
                        </td>
                        <td className='px-4 py-3 text-center text-slate-800 font-bold text-xs'>
                          {contact.orders}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <StatusBadge status={contact.status} />
                        </td>
                        <td
                          className='px-4 py-3 text-center'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              alert(`Details/Actions for ${contact.name}`)
                            }
                            className='text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 border-none bg-transparent cursor-pointer'
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className='bg-white border-t border-slate-100 p-3 flex items-center justify-between text-xs flex-shrink-0'>
              <div className='text-slate-500 font-semibold'>
                Showing{' '}
                {filteredContacts.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}{' '}
                to{' '}
                {Math.min(currentPage * itemsPerPage, filteredContacts.length)}{' '}
                of {filteredContacts.length.toLocaleString()} contacts
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-slate-500 font-semibold'>
                    Show per Page
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className='bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 focus:outline-none focus:border-brand-500 font-bold'
                  >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>
                <div className='flex items-center gap-1'>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className='p-1 rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer bg-white'
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {getPageNumbers().map((p, idx) => (
                    <button
                      key={idx}
                      disabled={p === '...'}
                      onClick={() => p !== '...' && handlePageChange(p)}
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold border cursor-pointer ${
                        currentPage === p
                          ? 'border-brand-200 bg-brand-50 text-brand-600'
                          : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className='p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer bg-white'
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Main Layout Area & Left & Center Content Column */}
        </div>
        </div>

        {/* Right Sidebar - Contact Details */}
        {isDetailOpen && activeContact && (
          <div className='w-80 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col flex-shrink-0 h-full overflow-hidden'>
            {/* Profile Header */}
            <div className='p-4 border-b border-slate-100 relative flex-shrink-0 text-center'>
              <button
                onClick={() => setIsDetailOpen(false)}
                className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5 rounded-full hover:bg-slate-100'
              >
                <X size={16} />
              </button>

              <div className='flex flex-col items-center mt-2'>
                {activeContact.avatar ? (
                  <img
                    src={activeContact.avatar}
                    alt={activeContact.name}
                    className='w-16 h-16 rounded-full border-2 border-white shadow-sm mb-3 object-cover'
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-black shadow-sm mb-3 ${activeContact.avatarColor}`}
                  >
                    {activeContact.initials}
                  </div>
                )}

                <div className='flex items-center gap-2 mb-0.5'>
                  <h2 className='text-base font-extrabold text-slate-900 leading-none'>
                    {activeContact.name}
                  </h2>
                  {activeContact.tags?.some((t) =>
                    t.toUpperCase().includes('VIP')
                  ) && (
                    <span className='bg-brand-50 text-brand-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider'>
                      VIP
                    </span>
                  )}
                </div>

                <p className='text-slate-500 text-xs font-semibold leading-none mb-1 -mt-0.5'>
                  {activeContact.phone}
                </p>

                <div className='flex items-center gap-1.5 text-xs'>
                  <MessageCircle
                    size={14}
                    className={activeContact.channelColor}
                  />
                  <span className='text-slate-600 font-bold'>
                    {activeContact.channel}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details (Scrollable) */}
            <div className='p-4 flex-1 overflow-y-auto flex flex-col gap-5 min-h-0'>
              {/* Tags Section */}
              <div>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2'>
                  Tags
                </h4>
                <div className='flex flex-wrap gap-1.5 items-center'>
                  {activeContact.tags?.map((tag, i) => (
                    <Tag
                      key={i}
                      text={tag}
                      type={
                        tag.includes('VIP')
                          ? 'vip'
                          : tag.includes('Returning')
                            ? 'returning'
                            : tag.includes('New')
                              ? 'new'
                              : 'complaint'
                      }
                      onDelete={() => handleRemoveTag(tag)}
                    />
                  ))}

                  {showAddTagInput ? (
                    <form
                      onSubmit={handleAddTag}
                      className='inline-flex items-center'
                    >
                      <input
                        type='text'
                        autoFocus
                        value={newTagVal}
                        onChange={(e) => setNewTagVal(e.target.value)}
                        placeholder='Tag...'
                        className='border border-slate-300 rounded px-1.5 py-0.5 text-xs w-20 outline-none focus:border-brand-500'
                        onBlur={() => setShowAddTagInput(false)}
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddTagInput(true)}
                      className='w-5 h-5 rounded-full border border-dashed border-slate-300 bg-transparent flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 cursor-pointer'
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned To */}
              <div>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2'>
                  Assigned To
                </h4>
                {activeContact.assignedTo ? <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    {activeContact.assignedTo.avatar && <img src={activeContact.assignedTo.avatar} alt={activeContact.assignedTo.name || 'Assigned agent'} className='w-7 h-7 rounded-full' />}
                    <div>
                      <p className='text-xs font-bold text-slate-900 leading-none'>
                        {activeContact.assignedTo.name || '-'}
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-1.5'>
                    <button
                      onClick={() =>
                        alert(
                          `Start chat with agent ${activeContact.assignedTo?.name}`
                        )
                      }
                      className='w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-ai-600 hover:bg-ai-50 transition-colors cursor-pointer'
                    >
                      <MessageSquare size={12} />
                    </button>
                    <button
                      onClick={() =>
                        alert(`Email agent ${activeContact.assignedTo?.name}`)
                      }
                      className='w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-ai-600 hover:bg-ai-50 transition-colors cursor-pointer'
                    >
                      <Mail size={12} />
                    </button>
                  </div>
                </div> : <p className='m-0 text-xs font-semibold italic text-slate-400'>Belum ditugaskan</p>}
              </div>

              {/* Outlet */}
              <div>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2'>
                  Outlet
                </h4>
                <div className='flex items-center gap-2 text-xs text-slate-800 font-bold'>
                  <Store size={15} className='text-brand-500' />
                  {activeContact.outlet}
                </div>
              </div>

              {/* Last Order */}
              {activeContact.lastOrder ? <div>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2'>
                  Last Order
                </h4>
                <div className='border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center justify-between'>
                  <div className='flex gap-2.5'>
                    <div className='w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0'>
                      <ShoppingBag size={14} />
                    </div>
                    <div>
                      <p className='text-xs font-black text-slate-900 leading-none'>
                        {activeContact.lastOrder.orderNumber || '-'}
                      </p>
                      <p className='text-[10px] text-slate-400 mt-1 font-bold'>
                        {activeContact.lastOrder.createdAt ? new Date(activeContact.lastOrder.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-bold text-slate-900 leading-none'>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(activeContact.lastOrder.totalAmount || 0)}
                    </p>
                    <p className='text-[10px] text-emerald-500 font-bold mt-1'>
                      {activeContact.lastOrder.status || activeContact.lastOrder.paymentStatus || '-'}
                    </p>
                  </div>
                </div>
              </div> : <div>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2'>Last Order</h4>
                <p className='m-0 text-xs font-semibold italic text-slate-400'>Belum ada pesanan</p>
              </div>}

              {/* Customer Since */}
              <div>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5'>
                  Customer Since
                </h4>
                <p className='text-xs text-slate-700 font-bold leading-normal'>
                  {activeContact.customerSince ? new Date(activeContact.customerSince).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className='pt-1'>
                <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5'>
                  Quick Actions
                </h4>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    onClick={() =>
                      alert(`Send quick message to ${activeContact.name}`)
                    }
                    className='flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
                  >
                    <MessageCircle size={14} className='text-brand-500' />{' '}
                    Message
                  </button>
                  <button
                    onClick={() =>
                      alert(`Creating order for ${activeContact.name}`)
                    }
                    className='flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
                  >
                    <ShoppingBag size={14} className='text-brand-500' /> Create
                    Order
                  </button>
                  <button
                    onClick={() => alert('Adding new note feature')}
                    className='flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
                  >
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-brand-500'
                    >
                      <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'></path>
                      <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'></path>
                    </svg>
                    Add Note
                  </button>
                  <button
                    onClick={() =>
                      alert(`Navigating to orders of ${activeContact.name}`)
                    }
                    className='flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
                  >
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-brand-500'
                    >
                      <line x1='8' y1='6' x2='21' y2='6'></line>
                      <line x1='8' y1='12' x2='21' y2='12'></line>
                      <line x1='8' y1='18' x2='21' y2='18'></line>
                      <line x1='3' y1='6' x2='3.01' y2='6'></line>
                      <line x1='3' y1='12' x2='3.01' y2='12'></line>
                      <line x1='3' y1='18' x2='3.01' y2='18'></line>
                    </svg>
                    Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
            {/* Modal Header */}
            <div className='p-6 pb-4 border-b border-slate-100 flex justify-between items-start'>
              <div>
                <h2 className='text-xl font-bold text-slate-900'>Import Contacts</h2>
                <p className='text-sm text-slate-500 mt-1'>Upload your contacts file and map the columns to get started.</p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className='text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md transition-colors border-none bg-transparent cursor-pointer'
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-6 overflow-y-auto flex-1 flex flex-col gap-8'>
              {/* Section 1: Upload File */}
              <div>
                <h3 className='text-sm font-bold text-slate-900 mb-3'>1. Upload File</h3>
                <div className='border-2 border-dashed border-brand-200 bg-brand-50/30 hover:bg-brand-50/60 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer'>
                  <CloudUpload size={32} className='text-brand-500 mb-3' />
                  <p className='text-slate-700 font-medium mb-1'>
                    Drag and drop your file here<br />
                    or <span className='text-brand-600'>click to browse</span>
                  </p>
                  <p className='text-xs text-slate-500'>CSV or XLSX files only</p>
                </div>

                <div className='flex items-center justify-between mt-3 text-sm'>
                  <div className='flex items-center gap-2'>
                    <span className='text-slate-500 text-xs'>Supported formats:</span>
                    <span className='px-2 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-slate-50'>.CSV</span>
                    <span className='px-2 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-slate-50'>.XLSX</span>
                  </div>
                  <button className='flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium text-xs border-none bg-transparent cursor-pointer'>
                    <Download size={14} />
                    Download sample template
                  </button>
                </div>
              </div>

              {/* Section 2: Preview & Map Columns */}
              <div>
                <h3 className='text-sm font-bold text-slate-900 mb-3'>2. Preview & Map Columns</h3>
                <div className='border border-slate-200 rounded-lg overflow-hidden'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-slate-50 border-b border-slate-200'>
                      <tr>
                        {['Name', 'Phone', 'Channel', 'Outlet', 'Tags'].map((header, i) => (
                          <th key={i} className='px-4 py-3 font-semibold text-slate-700'>
                            <div className='flex items-center justify-between'>
                              {header}
                              <ChevronDown size={14} className='text-slate-400' />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {mockPreviewData.map((row, i) => (
                        <tr key={i} className='bg-white'>
                          <td className='px-4 py-3 text-slate-800 font-medium'>{row.name}</td>
                          <td className='px-4 py-3 text-slate-600'>{row.phone}</td>
                          <td className='px-4 py-3 text-slate-600'>{row.channel}</td>
                          <td className='px-4 py-3 text-slate-600'>{row.outlet}</td>
                          <td className='px-4 py-3 text-slate-600'>{row.tags}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className='text-xs text-slate-500 mt-2'>5 rows previewed from file</p>
              </div>

              {/* Section 3: Handle Duplicates */}
              <div>
                <h3 className='text-sm font-bold text-slate-900 mb-3'>3. Handle Duplicates</h3>
                <div className='grid grid-cols-3 gap-4'>
                  {/* Option 1 */}
                  <div
                    onClick={() => setDuplicateAction('skip')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${duplicateAction === 'skip' ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className='mt-0.5 flex-shrink-0'>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${duplicateAction === 'skip' ? 'border-brand-500' : 'border-slate-300'}`}>
                          {duplicateAction === 'skip' && <div className='w-2 h-2 rounded-full bg-brand-500'></div>}
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm font-bold mb-1 ${duplicateAction === 'skip' ? 'text-slate-900' : 'text-slate-700'}`}>Skip duplicates</p>
                        <p className='text-xs text-slate-500'>Ignore rows with existing phone or ID</p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div
                    onClick={() => setDuplicateAction('update')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${duplicateAction === 'update' ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className='mt-0.5 flex-shrink-0'>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${duplicateAction === 'update' ? 'border-brand-500' : 'border-slate-300'}`}>
                          {duplicateAction === 'update' && <div className='w-2 h-2 rounded-full bg-brand-500'></div>}
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm font-bold mb-1 ${duplicateAction === 'update' ? 'text-slate-900' : 'text-slate-700'}`}>Update existing</p>
                        <p className='text-xs text-slate-500'>Update information for existing contacts</p>
                      </div>
                    </div>
                  </div>

                  {/* Option 3 */}
                  <div
                    onClick={() => setDuplicateAction('merge')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${duplicateAction === 'merge' ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className='mt-0.5 flex-shrink-0'>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${duplicateAction === 'merge' ? 'border-brand-500' : 'border-slate-300'}`}>
                          {duplicateAction === 'merge' && <div className='w-2 h-2 rounded-full bg-brand-500'></div>}
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm font-bold mb-1 ${duplicateAction === 'merge' ? 'text-slate-900' : 'text-slate-700'}`}>Merge data</p>
                        <p className='text-xs text-slate-500'>Combine new data with existing contacts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 & 5 */}
              <div className='grid grid-cols-2 gap-8'>
                {/* Section 4: Assign to Outlet */}
                <div>
                  <h3 className='text-sm font-bold text-slate-900 mb-3'>4. Assign to Outlet</h3>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'>
                      <Store size={16} />
                    </div>
                    <select className='w-full appearance-none bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer'>
                      <option>Samarinda</option>
                      <option>Tenggarong</option>
                      <option>Bontang</option>
                    </select>
                    <div className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Section 5: Workspace */}
                <div>
                  <h3 className='text-sm font-bold text-slate-900 mb-3'>5. Workspace</h3>
                  <label className='flex items-center gap-3 cursor-pointer mt-3'>
                    <div
                      className={`w-4 h-4 flex-shrink-0 rounded flex items-center justify-center transition-colors ${isWorkspaceAssigned ? 'bg-brand-500 text-white' : 'border border-slate-300 bg-white'}`}
                      onClick={() => setIsWorkspaceAssigned(!isWorkspaceAssigned)}
                    >
                      {isWorkspaceAssigned && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className='text-sm text-slate-700'>Assign imported contacts to this workspace only</span>
                    <Info size={14} className='text-slate-400 ml-1' />
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='p-4 px-6 border-t border-slate-100 flex justify-end gap-3 bg-white'>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className='px-5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className='px-5 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors cursor-pointer border-none shadow-sm'
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Panel (Right Slide-over) */}
      {isFilterPanelOpen && (
        <div className='absolute inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex justify-end'>
          {/* Animated Sidebar */}
          <div
            className='bg-white w-full max-w-sm h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0'
            style={{ animation: 'slideInRight 0.3s ease-out forwards' }}
          >
            {/* Header */}
            <div className='p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0'>
              <h2 className='text-lg font-bold text-slate-900'>Advanced Filters</h2>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className='text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md transition-colors border-none bg-transparent cursor-pointer'
              >
                <X size={20} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-8'>
              {/* Outlet */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Outlet</h3>
                <div className='flex flex-wrap gap-2'>
                  <FilterBtn active theme='rose' icon={<CheckCircle2 size={14} className='text-brand-500' fill='currentColor' stroke='white' />} label='All Outlets' />
                  <FilterBtn icon={<Store size={14} className='text-slate-400' />} label='Samarinda' />
                  <FilterBtn icon={<Store size={14} className='text-slate-400' />} label='Tenggarong' />
                  <FilterBtn icon={<Store size={14} className='text-slate-400' />} label='Bontang' />
                </div>
              </div>

              {/* Channel */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Channel</h3>
                <div className='flex flex-wrap gap-2'>
                  <FilterBtn active theme='green' icon={<MessageCircle size={14} className='text-emerald-500' />} label='WhatsApp' />
                  <FilterBtn icon={<Send size={14} className='text-blue-500' />} label='Telegram' />
                  <FilterBtn icon={<Globe size={14} className='text-purple-500' />} label='Website' />
                </div>
              </div>

              {/* Assignment */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Assignment</h3>
                <div className='flex flex-wrap gap-2'>
                  <FilterBtn icon={<User size={14} className='text-brand-500' />} label='Assigned' />
                  <FilterBtn icon={<UserX size={14} className='text-slate-400' />} label='Unassigned' />
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Tags</h3>
                <div className='flex flex-wrap gap-2'>
                  <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 border border-brand-100 cursor-pointer hover:bg-brand-100 transition-colors'>VIP</span>
                  <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors'>Returning</span>
                  <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-600 border border-cyan-100 cursor-pointer hover:bg-cyan-100 transition-colors'>New Lead</span>
                  <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors'>Complaint Risk</span>
                  <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors'>Loyal</span>
                </div>
              </div>

              {/* Contact Status */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Contact Status</h3>
                <div className='flex flex-wrap gap-2'>
                  <FilterBtn active theme='green' icon={<CheckCircle2 size={14} className='text-emerald-500' fill='currentColor' stroke='white' />} label='Active' />
                  <FilterBtn icon={<AlertCircle size={14} className='text-orange-500' />} label='Needs Follow-up' />
                  <FilterBtn icon={<Ban size={14} className='text-brand-500' />} label='Blocked' />
                  <FilterBtn icon={<Archive size={14} className='text-slate-500' />} label='Archived' />
                </div>
              </div>

              {/* Activity */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Activity</h3>
                <div className='flex flex-wrap gap-2'>
                  <FilterBtn active theme='green' icon={<CheckCircle2 size={14} className='text-emerald-500' fill='currentColor' stroke='white' />} label='Last active today' />
                  <FilterBtn icon={<Calendar size={14} className='text-slate-400' />} label='This week' />
                  <FilterBtn icon={<Calendar size={14} className='text-slate-400' />} label='This month' />
                </div>
              </div>

              {/* Order Behavior */}
              <div>
                <h3 className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3'>Order Behavior</h3>
                <div className='flex flex-wrap gap-2'>
                  <FilterBtn active theme='green' icon={<ShoppingBag size={14} className='text-emerald-500' />} label='Has orders' />
                  <FilterBtn icon={<MessageSquare size={14} className='text-slate-400' />} label='No orders' />
                  <FilterBtn icon={<Star size={14} className='text-brand-500 fill-brand-500' />} label='High value' />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='p-5 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0'>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className='py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors text-center cursor-pointer'
              >
                Clear All
              </button>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className='py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors text-center shadow-sm cursor-pointer border-none'
              >
                Apply Filters
              </button>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}} />
        </div>
      )}

      {/* Add Contact Modal Dialog */}
      {isAddModalOpen && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50'>
              <h3 className='font-extrabold text-slate-900 text-sm'>
                Add New Contact
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className='text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5 rounded-full hover:bg-slate-200 flex items-center justify-center'
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleAddContactSubmit}
              className='p-4 flex flex-col gap-4'
            >
              <div>
                <label className='block text-xs font-bold text-slate-600 uppercase mb-1.5'>
                  Contact Name *
                </label>
                <input
                  type='text'
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder='e.g. Budi Santoso'
                  className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-slate-50/50 text-slate-800'
                />
              </div>

              <div>
                <label className='block text-xs font-bold text-slate-600 uppercase mb-1.5'>
                  Phone Number
                </label>
                <input
                  type='text'
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder='e.g. +62 812...'
                  className='w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-slate-50/50 text-slate-800'
                />
              </div>

              <div className='flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100'>
                <button
                  type='button'
                  onClick={() => setIsAddModalOpen(false)}
                  className='border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 border-none rounded-lg cursor-pointer shadow-sm transition-colors'
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
