import { useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faTrash,
  faDownload,
  faPlus,
  faChevronDown,
  faFolderOpen,
  faUserClock,
  faClock,
  faCircleExclamation,
  faSearch,
  faUser,
  faReply,
  faTicketAlt,
  faStar,
  faEllipsisV,
  faTimes,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import {
  createComplaint,
  deleteComplaint,
  listComplaints,
  updateComplaint,
} from '../api/complaintsApi'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'All Channels' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'web', label: 'Web' },
]

const DEFAULT_FORM = {
  subject: '',
  description: '',
  contactId: '',
  chatId: '',
  agentId: '',
  orderId: '',
  channel: '',
  priority: 'medium',
  category: '',
}

function getContact(complaint) {
  if (complaint?.contact) return complaint.contact
  if (complaint?.contacts) return complaint.contacts
  if (complaint?.contactId && typeof complaint.contactId === 'object') return complaint.contactId
  return null
}

function getAgent(complaint) {
  if (complaint?.agent) return complaint.agent
  if (complaint?.agents) return complaint.agents
  return null
}

function getChannel(complaint) {
  return (
    complaint?.channel ||
    complaint?.platform?.type ||
    complaint?.platformType ||
    complaint?.platform_type ||
    complaint?.order?.source ||
    complaint?.order?.channelSnapshot ||
    complaint?.formData?.channel ||
    complaint?.formData?.platform ||
    'web'
  )
}

function getPlatformLabel(complaint) {
  return complaint?.platform?.label || complaint?.platformAccount || complaint?.platformId || '-'
}

function getOutletName(complaint) {
  return complaint?.outlet?.name || complaint?.outletName || complaint?.formData?.outlet || complaint?.outletId || '-'
}

function getOrderDisplay(complaint) {
  return complaint?.order?.code || complaint?.order?.id || complaint?.orderId || complaint?.formData?.orderNumber || '-'
}

function getTitle(complaint) {
  return complaint?.subject || complaint?.title || complaint?.description || complaint?.text || '-'
}

function getDescription(complaint) {
  return complaint?.description || complaint?.text || complaint?.subject || '-'
}

function getStatusLabel(status) {
  if (status === 'resolved') return 'Resolved'
  if (status === 'dismissed') return 'Dismissed'
  return 'Open'
}

function getChannelClass(channel) {
  const c = String(channel || '').toLowerCase().replace(/\s/g, '')
  if (c === 'whatsapp') return 'wa'
  if (c === 'instagram') return 'ig'
  if (c === 'telegram') return 'tg'
  if (['gofood', 'gojek', 'grabfood', 'grab', 'shopeefood', 'shopee', 'tokopedia'].includes(c)) return c
  return 'web'
}

function getStatusClass(status) {
  if (status === 'resolved') return 'status-resolved'
  if (status === 'dismissed') return 'status-waiting'
  return 'status-open'
}

function normalizePriority(priority) {
  if (['urgent', 'high', 'medium', 'low'].includes(priority)) return priority
  return 'medium'
}

function formatRelative(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '-'
  const diffMins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function toTitleCase(value) {
  return String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function exportComplaints(complaints) {
  const headers = ['id', 'status', 'priority', 'customer', 'phone', 'channel', 'subject', 'createdAt']
  const rows = complaints.map((complaint) => {
    const contact = getContact(complaint)
    return [
      complaint.id || complaint._id || '',
      complaint.status || '',
      complaint.priority || '',
      contact?.name || '',
      contact?.phone || '',
      getChannel(complaint),
      getTitle(complaint),
      complaint.createdAt || '',
    ]
  })
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(DEFAULT_FORM)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = statusFilter === 'all' ? {} : { status: statusFilter }
      const res = await listComplaints(params)
      setComplaints(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setComplaints([])
      setError(err.response?.data?.error || 'Gagal memuat complaints dari backend.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  useEffect(() => {
    if (!selectedComplaint) return
    const selectedId = selectedComplaint.id || selectedComplaint._id
    const nextSelected = complaints.find((complaint) => (complaint.id || complaint._id) === selectedId)
    if (nextSelected) setSelectedComplaint(nextSelected)
  }, [complaints, selectedComplaint])

  const filteredComplaints = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return complaints.filter((complaint) => {
      const priority = normalizePriority(complaint.priority)
      const channel = getChannel(complaint)
      const contact = getContact(complaint)
      const searchable = [
        complaint.id,
        getOrderDisplay(complaint),
        getTitle(complaint),
        getDescription(complaint),
        contact?.name,
        contact?.phone,
        getOutletName(complaint),
        channel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (priorityFilter !== 'all' && priority !== priorityFilter) return false
      if (channelFilter !== 'all' && channel !== channelFilter) return false
      if (needle && !searchable.includes(needle)) return false
      return true
    })
  }, [channelFilter, complaints, priorityFilter, search])

  const summary = useMemo(
    () => ({
      open: complaints.filter((complaint) => complaint.status === 'open').length,
      urgent: complaints.filter((complaint) => complaint.priority === 'urgent').length,
      dismissed: complaints.filter((complaint) => complaint.status === 'dismissed').length,
      resolved: complaints.filter((complaint) => complaint.status === 'resolved').length,
      total: complaints.length,
    }),
    [complaints],
  )

  const handleResolve = async (id) => {
    if (!window.confirm('Mark complaint as resolved?')) return
    try {
      await updateComplaint(id, { status: 'resolved' })
      await loadComplaints()
    } catch (err) {
      console.error(err)
      window.alert(err.response?.data?.error || 'Failed to resolve complaint')
    }
  }

  const handleDismiss = async (id) => {
    if (!window.confirm('Dismiss this complaint?')) return
    try {
      await updateComplaint(id, { status: 'dismissed' })
      await loadComplaints()
    } catch (err) {
      console.error(err)
      window.alert(err.response?.data?.error || 'Failed to dismiss complaint')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return
    try {
      await deleteComplaint(id)
      setSelectedComplaint(null)
      await loadComplaints()
    } catch (err) {
      console.error(err)
      window.alert(err.response?.data?.error || 'Failed to delete complaint')
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!form.subject.trim() && !form.description.trim()) {
      window.alert('Subject atau deskripsi complaint wajib diisi.')
      return
    }

    setSaving(true)
    try {
      await createComplaint({
        subject: form.subject.trim() || form.description.trim(),
        text: form.description.trim() || form.subject.trim(),
        contact_id: form.contactId.trim() || undefined,
        chat_id: form.chatId.trim() || undefined,
        agent_id: form.agentId.trim() || undefined,
        order_id: form.orderId.trim() || undefined,
        platform_type: form.channel,
        priority: form.priority,
        form_data: {
          category: form.category.trim() || undefined,
        },
      })
      setForm(DEFAULT_FORM)
      setShowCreateForm(false)
      await loadComplaints()
    } catch (err) {
      console.error(err)
      window.alert(err.response?.data?.error || 'Failed to create complaint')
    } finally {
      setSaving(false)
    }
  }

  const renderFormData = (data) => {
    const entries = Object.entries(data || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
    if (entries.length === 0) return <div className="context-val">No form data captured.</div>
    return entries.map(([key, value]) => (
      <div className="context-row" key={key}>
        <div className="context-label">{toTitleCase(key)}</div>
        <div className="context-val">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </div>
      </div>
    ))
  }

  const renderSidebar = () => {
    if (!selectedComplaint) return null

    const complaint = selectedComplaint
    const id = complaint.id || complaint._id
    const contact = getContact(complaint)
    const agent = getAgent(complaint)
    const priority = normalizePriority(complaint.priority)
    const channel = getChannel(complaint)
    const metadata = complaint.metadata || {}
    const tags = Array.isArray(metadata.tags) ? metadata.tags : []

    return (
      <div className="complaint-sidebar">
        <div className="sidebar-header-actions">
          <button className="btn-sidebar green" type="button">
            <FontAwesomeIcon icon={faReply} /> Open Chat
          </button>
          <button className="btn-sidebar purple" type="button">
            <FontAwesomeIcon icon={faTicketAlt} /> Ticket
          </button>
          {complaint.status !== 'resolved' && (
            <button className="btn-sidebar red-filled" type="button" onClick={() => handleResolve(id)}>
              <FontAwesomeIcon icon={faCheckCircle} /> Resolve
            </button>
          )}
          {complaint.status === 'open' && (
            <button className="btn-sidebar" type="button" onClick={() => handleDismiss(id)}>
              Dismiss
            </button>
          )}
        </div>

        <div className="sidebar-title-row">
          <div className="sidebar-title-left">
            <div className="sidebar-id">#{String(id).slice(0, 8).toUpperCase()}</div>
            <div className="badge-open">
              {getStatusLabel(complaint.status)}
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 10, marginLeft: 2 }} />
            </div>
          </div>
          <div className="sidebar-title-right">
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faEllipsisV} />
            <FontAwesomeIcon icon={faTimes} style={{ cursor: 'pointer' }} onClick={() => setSelectedComplaint(null)} />
          </div>
        </div>

        <div className="sidebar-tabs">
          <div className="sidebar-tab active">Detail</div>
          <div className="sidebar-tab">Form Data</div>
          <div className="sidebar-tab">Metadata</div>
        </div>

        <div className="sidebar-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="sidebar-content-main">
            <div className="sidebar-section-title">Issue</div>
            <div className="sidebar-issue-title">{getTitle(complaint)}</div>
            <div className="sidebar-issue-desc">{getDescription(complaint)}</div>

            <div className="sidebar-grid">
              <div className="grid-item">
                <div className="grid-item-title">Customer</div>
                <div className="grid-item-val">
                  <div className="assignee-avatar"><FontAwesomeIcon icon={faUser} /></div>
                  <div>
                    {contact?.name || 'Unknown'}
                    <div className="grid-item-sub">{contact?.phone || contact?.email || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Order ID</div>
                <div className="grid-item-val">
                  {getOrderDisplay(complaint)}
                  {getOrderDisplay(complaint) !== '-' && <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: 10, color: 'var(--text-subtle)' }} />}
                </div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Priority</div>
                <div className="grid-item-val">
                  <div className={`badge-priority priority-${priority}`}>{toTitleCase(priority)}</div>
                </div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Outlet</div>
                <div className="grid-item-val">{getOutletName(complaint)}</div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Created At</div>
                <div className="grid-item-val" style={{ fontWeight: 400 }}>{formatDate(complaint.createdAt)}</div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Updated At</div>
                <div className="grid-item-val" style={{ fontWeight: 400 }}>{formatDate(complaint.updatedAt)}</div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Channel</div>
                <div className="grid-item-val">
                  <BrandIcon type={channel} size={16} />
                  <div>
                    <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                    <div className="grid-item-sub">{getPlatformLabel(complaint)}</div>
                  </div>
                </div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Agent</div>
                <div className="grid-item-val" style={{ fontWeight: 400 }}>{agent?.name || '-'}</div>
              </div>

              <div className="grid-item">
                <div className="grid-item-title">Assigned To</div>
                <div className="grid-item-val" style={{ fontWeight: 400 }}>{complaint.assignedTo?.name || '-'}</div>
              </div>
            </div>

            <div className="sidebar-context">
              <div className="context-list">
                <div className="sidebar-section-title" style={{ color: 'var(--lp-slate-900)', marginBottom: 12 }}>
                  Captured Form Data
                </div>
                {renderFormData(complaint.formData)}
              </div>
            </div>

            <div className="sidebar-context">
              <div className="context-list">
                <div className="sidebar-section-title" style={{ color: 'var(--lp-slate-900)', marginBottom: 12 }}>
                  Metadata
                </div>
                {renderFormData(metadata)}
              </div>
            </div>

            {tags.length > 0 && (
              <>
                <div className="sidebar-section-title">Tags</div>
                <div className="sidebar-tags">
                  {tags.map((tag, index) => {
                    const colors = ['red', 'purple', 'green']
                    return <div key={tag} className={`tag-badge ${colors[index % colors.length]}`}>{tag}</div>
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`complaints-page ${selectedComplaint ? 'sidebar-open' : ''}`}>
      <div className="complaints-header-row">
        <div>
          <div className="complaints-header-title">
            <h2>Complaints</h2>
            <div className="complaints-header-info">
              <FontAwesomeIcon icon={faCircleExclamation} />
            </div>
          </div>
          <div className="complaints-header-subtitle">
            Kelola keluhan pelanggan dari chat, AI, dan input admin dalam satu tempat.
          </div>
        </div>
        <div className="complaints-header-actions">
          <button className="btn-export" type="button" onClick={() => exportComplaints(filteredComplaints)}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
          <button className="btn-primary" type="button" onClick={() => setShowCreateForm((value) => !value)}>
            <FontAwesomeIcon icon={faPlus} /> Complaint Baru
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form className="sidebar-context" style={{ marginBottom: 24 }} onSubmit={handleCreate}>
          <div className="context-list" style={{ gap: 12 }}>
            <div className="sidebar-section-title" style={{ color: 'var(--lp-slate-900)' }}>Create Manual Complaint</div>
            <input className="filter-select" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Subject" />
            <textarea className="filter-select" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Complaint text / description" rows={3} style={{ resize: 'vertical' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
              <input className="filter-select" value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })} placeholder="Contact ID optional" />
              <input className="filter-select" value={form.chatId} onChange={(event) => setForm({ ...form, chatId: event.target.value })} placeholder="Chat ID optional" />
              <input className="filter-select" value={form.agentId} onChange={(event) => setForm({ ...form, agentId: event.target.value })} placeholder="Agent ID optional" />
              <input className="filter-select" value={form.orderId} onChange={(event) => setForm({ ...form, orderId: event.target.value })} placeholder="Order ID optional" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto', gap: 12 }}>
              <select className="filter-select" value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
                <option value="">Channel optional</option>
                {CHANNEL_OPTIONS.filter((option) => option.value !== 'all').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select className="filter-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                {PRIORITY_OPTIONS.filter((option) => option.value !== 'all').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input className="filter-select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category optional" />
              <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </form>
      )}

      <div className="complaints-filters">
        <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select className="filter-select" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
          {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select className="filter-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          {PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <div className="filter-select" style={{ color: 'var(--text-primary)' }}>
          <FontAwesomeIcon icon={faClock} style={{ color: 'var(--text-muted)' }} /> Workspace complaints
        </div>

        <div className="filter-search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input type="text" placeholder="Search complaints..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="complaints-summary-cards">
        <div className="summary-card">
          <div className="summary-card-header"><div className="summary-icon red"><FontAwesomeIcon icon={faFolderOpen} /></div>Open</div>
          <div className="summary-value">{summary.open}</div>
          <div className="summary-trend"><span className="trend-text">Needs attention</span></div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header"><div className="summary-icon orange"><FontAwesomeIcon icon={faCircleExclamation} /></div>Urgent</div>
          <div className="summary-value">{summary.urgent}</div>
          <div className="summary-trend"><span className="trend-text">Priority urgent</span></div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header"><div className="summary-icon purple"><FontAwesomeIcon icon={faUserClock} /></div>Dismissed</div>
          <div className="summary-value">{summary.dismissed}</div>
          <div className="summary-trend"><span className="trend-text">Invalid/no action</span></div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header"><div className="summary-icon green"><FontAwesomeIcon icon={faCheckCircle} /></div>Resolved</div>
          <div className="summary-value">{summary.resolved}</div>
          <div className="summary-trend"><span className="trend-text">Handled complaints</span></div>
        </div>
        <div className="summary-card">
          <div className="summary-card-header"><div className="summary-icon purple"><FontAwesomeIcon icon={faClock} /></div>Total</div>
          <div className="summary-value">{summary.total}</div>
          <div className="summary-trend"><span className="trend-text">Current workspace</span></div>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, marginBottom: 16, color: 'var(--danger-600)', background: 'var(--danger-50)', borderRadius: 12 }}>
          {error}
        </div>
      )}

      <div className="complaints-layout">
        <div className="complaints-main">
          <div className="complaints-list">
            {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading complaints...</div>}
            {!loading && filteredComplaints.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'white', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                No complaints found.
              </div>
            )}
            {!loading && filteredComplaints.map((complaint) => {
              const id = complaint.id || complaint._id
              const contact = getContact(complaint)
              const priority = normalizePriority(complaint.priority)
              const channel = getChannel(complaint)
              const assignedName = complaint.assignedTo?.name || getAgent(complaint)?.name

              return (
                <div key={id} className={`complaint-card ${complaint.status === 'open' || !complaint.status ? 'status-open' : ''}`} onClick={() => setSelectedComplaint(complaint)}>
                  <div className="complaint-time-col">
                    <div className="complaint-time">{formatRelative(complaint.createdAt)}</div>
                    <div className={`complaint-channel channel-${getChannelClass(channel)}`}>
                      <BrandIcon type={channel} size={20} />
                    </div>
                  </div>

                  <div className="complaint-main-col">
                    <div className="complaint-customer-row">
                      <span className="complaint-customer-name">{contact?.name || 'Unknown customer'}</span>
                      {complaint.status === 'open' && <span className="badge-new">Open</span>}
                    </div>
                    <div className="complaint-outlet">{getOutletName(complaint)}</div>
                    <div className="complaint-message">{getDescription(complaint)}</div>
                  </div>

                  <div className="complaint-priority-col">
                    <div className={`badge-priority priority-${priority}`}>{toTitleCase(priority)}</div>
                  </div>

                  <div className="complaint-status-col">
                    <div className={`complaint-status-text ${getStatusClass(complaint.status)}`}>{getStatusLabel(complaint.status)}</div>
                    <div className={`complaint-sla ${complaint.status === 'resolved' ? 'sla-ok' : 'sla-critical'}`}>
                      {complaint.status === 'resolved' ? `Resolved ${formatRelative(complaint.updatedAt)}` : `Created ${formatRelative(complaint.createdAt)}`}
                    </div>
                  </div>

                  <div className="complaint-assignee-col">
                    <div className="assignee-info">
                      <div className="assignee-avatar">{assignedName ? assignedName.charAt(0).toUpperCase() : '?'}</div>
                      <div className="assignee-details">
                        {assignedName ? <div className="assignee-name">{assignedName}</div> : <div className="assignee-unassigned">Unassigned</div>}
                      </div>
                    </div>
                    <div className="complaint-arrow"><FontAwesomeIcon icon={faChevronDown} style={{ transform: 'rotate(-90deg)' }} /></div>
                  </div>

                  <div className="action-buttons">
                    {complaint.status !== 'resolved' && (
                      <button className="btn-icon-sm resolve" type="button" onClick={(event) => { event.stopPropagation(); handleResolve(id) }} title="Resolve">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </button>
                    )}
                    <button className="btn-icon-sm delete" type="button" onClick={(event) => { event.stopPropagation(); handleDelete(id) }} title="Delete">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {renderSidebar()}
      </div>
    </div>
  )
}
