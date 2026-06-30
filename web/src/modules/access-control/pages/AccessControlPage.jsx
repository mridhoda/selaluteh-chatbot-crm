import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Lock,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  UserCog,
  Users,
} from 'lucide-react'
import api from '../../../shared/api/httpClient'
import '../styles/access-control.css'

const roleTemplates = [
  {
    key: 'owner',
    label: 'Owner',
    description: 'Full workspace authority. Protected by owner invariant.',
    tone: '#111827',
    scope: 'ALL_OUTLETS',
    locked: true,
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Workspace administration without owner transfer authority.',
    tone: '#7C3AED',
    scope: 'ALL_OUTLETS',
  },
  {
    key: 'outlet_manager',
    label: 'Outlet Manager',
    description: 'Manage assigned outlets, orders, products, and inventory.',
    tone: '#059669',
    scope: 'SELECTED_OUTLETS',
  },
  {
    key: 'outlet_staff',
    label: 'Outlet Staff',
    description: 'Narrow operations for kitchen, order status, and product read.',
    tone: '#0EA5E9',
    scope: 'SELECTED_OUTLETS',
  },
  {
    key: 'customer_support',
    label: 'Customer Support',
    description: 'Chats, contacts, complaints, and read-only order context.',
    tone: '#F59E0B',
    scope: 'SELECTED_OUTLETS',
  },
  {
    key: 'finance_viewer',
    label: 'Finance Viewer',
    description: 'Read-only payments, revenue, reports, and finance exports.',
    tone: '#EC4899',
    scope: 'NO_OUTLET_ACCESS',
  },
  {
    key: 'analyst',
    label: 'Analyst',
    description: 'Analytics and reports only. No operational mutations.',
    tone: '#64748B',
    scope: 'NO_OUTLET_ACCESS',
  },
]

const modulePermissions = [
  {
    domain: 'Workspace',
    permissions: [
      ['workspace.read', 'Read settings', 'Melihat detail konfigurasi dasar dan informasi workspace.'],
      ['workspace.update', 'Update settings', 'Mengubah profil, nama, logo, dan pengaturan global workspace.'],
      ['members.invite', 'Invite members', 'Mengundang anggota tim baru untuk bergabung ke workspace.'],
      ['members.update_role', 'Change roles', 'Mengubah tingkat peran (role) dan otorisasi akses anggota lain.'],
    ],
  },
  {
    domain: 'Outlets',
    permissions: [
      ['outlets.read', 'Read outlets', 'Melihat daftar seluruh outlet dan detail profil masing-masing cabang.'],
      ['outlets.update', 'Update outlets', 'Mengubah informasi alamat, jam operasional, dan data spesifik outlet.'],
      ['outlets.pause', 'Pause outlets', 'Menonaktifkan sementara aktivitas penjualan atau penerimaan pesanan di outlet.'],
      ['outlets.archive', 'Archive outlets', 'Mengarsipkan data outlet secara permanen dari daftar aktif.'],
    ],
  },
  {
    domain: 'Orders',
    permissions: [
      ['orders.read', 'Read orders', 'Melihat daftar pesanan, transaksi, dan memantau status pesanan masuk.'],
      ['orders.approve', 'Approve orders', 'Menerima dan menyetujui pesanan baru yang dikirimkan pelanggan.'],
      ['orders.manage_status', 'Update status', 'Mengubah status alur kerja pesanan (misalnya: sedang dimasak, siap diantar).'],
      ['orders.cancel', 'Cancel orders', 'Membatalkan pesanan pelanggan karena kendala tertentu.'],
    ],
  },
  {
    domain: 'Commerce',
    permissions: [
      ['products.read', 'Read products', 'Melihat katalog menu, harga produk, varian, dan kategori produk.'],
      ['products.manage', 'Manage products', 'Menambah menu baru, memperbarui harga, deskripsi, atau menghapus produk.'],
      ['inventory.read', 'Read inventory', 'Melihat ketersediaan stok bahan baku dan sisa produk di outlet.'],
      ['inventory.adjust', 'Adjust stock', 'Melakukan opname stok fisik dan menyesuaikan selisih persediaan.'],
    ],
  },
  {
    domain: 'CRM',
    permissions: [
      ['chats.read', 'Read chats', 'Membuka dan membaca riwayat pesan/obrolan masuk dari pelanggan.'],
      ['chats.reply', 'Reply chats', 'Mengirimkan balasan obrolan atau menjawab pertanyaan pelanggan.'],
      ['chats.assign', 'Assign chats', 'Mendelegasikan obrolan pelanggan ke anggota tim atau agen CS tertentu.'],
      ['contacts.export', 'Export contacts', 'Mengunduh database kontak pelanggan dalam format file Excel/CSV.'],
    ],
  },
  {
    domain: 'Finance',
    permissions: [
      ['payments.read', 'Read payments', 'Melihat daftar transaksi pembayaran masuk, invoice, dan status transfer.'],
      ['payments.manage_links', 'Manage links', 'Membuat, mengedit, atau menghapus tautan pembayaran (payment link) digital.'],
      ['payments.reconcile', 'Reconcile', 'Melakukan rekonsiliasi data pembayaran bank dengan pembukuan sistem.'],
      ['analytics.export', 'Export analytics', 'Mengunduh laporan analitik omset, laba, dan data penjualan bulanan.'],
    ],
  },
  {
    domain: 'AI and Channels',
    permissions: [
      ['agents.read', 'Read agents', 'Melihat performa, logs, dan daftar chatbot AI agent yang aktif.'],
      ['agents.manage', 'Manage agents', 'Melatih kecerdasan AI, mengubah instruksi prompt, dan mengaktifkan agen.'],
      ['channels.configure', 'Configure channels', 'Mengonfigurasi dan menghubungkan saluran chat (WhatsApp Business, dll).'],
      ['knowledge.manage', 'Manage knowledge', 'Mengunggah file PDF/panduan sebagai basis pengetahuan respon pintar AI.'],
    ],
  },
]

const rolePermissions = {
  owner: modulePermissions.flatMap((group) => group.permissions.map(([key]) => key)),
  admin: modulePermissions
    .flatMap((group) => group.permissions.map(([key]) => key))
    .filter((key) => key !== 'members.update_role' && key !== 'outlets.archive'),
  outlet_manager: [
    'outlets.read',
    'outlets.update',
    'orders.read',
    'orders.approve',
    'orders.manage_status',
    'orders.cancel',
    'products.read',
    'products.manage',
    'inventory.read',
    'inventory.adjust',
    'chats.read',
    'chats.reply',
    'analytics.export',
  ],
  outlet_staff: [
    'outlets.read',
    'orders.read',
    'orders.manage_status',
    'products.read',
    'inventory.read',
    'chats.read',
    'chats.reply',
  ],
  customer_support: [
    'orders.read',
    'chats.read',
    'chats.reply',
    'chats.assign',
    'contacts.export',
  ],
  finance_viewer: ['payments.read', 'analytics.export'],
  analyst: ['workspace.read', 'analytics.export'],
}

const fallbackMembers = [
  {
    id: 'owner-demo',
    name: 'Workspace Owner',
    email: 'owner@selaluteh.local',
    role: 'owner',
    outletScopeMode: 'ALL_OUTLETS',
    outlets: ['all'],
    status: 'ACTIVE',
  },
  {
    id: 'manager-demo',
    name: 'Outlet Manager',
    email: 'manager@selaluteh.local',
    role: 'outlet_manager',
    outletScopeMode: 'SELECTED_OUTLETS',
    outlets: ['samarinda', 'tenggarong'],
    status: 'ACTIVE',
  },
  {
    id: 'staff-demo',
    name: 'Kitchen Staff',
    email: 'staff@selaluteh.local',
    role: 'outlet_staff',
    outletScopeMode: 'SELECTED_OUTLETS',
    outlets: ['samarinda'],
    status: 'ACTIVE',
  },
]

const fallbackOutletOptions = [
  { id: 'samarinda', name: 'SelaluTeh Samarinda' },
  { id: 'tenggarong', name: 'SelaluTeh Tenggarong' },
  { id: 'bontang', name: 'SelaluTeh Bontang' },
  { id: 'danau-murung', name: 'SelaluTeh Danau Murung' },
]

function normalizeOutlet(outlet, index = 0) {
  const id = outlet.id || outlet._id || outlet.outletId || `outlet-${index}`
  return {
    id: String(id),
    name: outlet.name || outlet.outletName || `Outlet ${index + 1}`,
    city: outlet.city || outlet.region || outlet.metadata?.city || '',
    status: outlet.status || 'active',
    address: outlet.address || outlet.metadata?.address || '',
  }
}

function readSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function getWorkspaceIdFromUser(user) {
  return user?.workspaceId || user?.workspace_id || user?.currentWorkspaceId || user?.workspace?.id || null
}

function normalizeRole(role) {
  const normalized = String(role || '').toLowerCase()
  if (normalized === 'super') return 'admin'
  if (normalized === 'agent') return 'outlet_staff'
  return normalized || 'outlet_staff'
}

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
}

export default function AccessControlPage({ currentUser }) {
  const sessionUser = currentUser || readSessionUser()
  const isOwner = normalizeRole(sessionUser?.role) === 'owner'
  const [members, setMembers] = useState(fallbackMembers)
  const [outlets, setOutlets] = useState(fallbackOutletOptions)
  const [selectedMemberId, setSelectedMemberId] = useState(fallbackMembers[0].id)
  const [selectedRole, setSelectedRole] = useState('owner')
  const [customPermissions, setCustomPermissions] = useState(rolePermissions.owner)
  const [query, setQuery] = useState('')
  const [selectedOutlets, setSelectedOutlets] = useState(['all'])
  const [scopeMode, setScopeMode] = useState('ALL_OUTLETS')
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceId, setWorkspaceId] = useState(() => getWorkspaceIdFromUser(sessionUser))
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    const loadMembers = async () => {
      try {
        let resolvedWorkspaceId = getWorkspaceIdFromUser(sessionUser)
        if (!resolvedWorkspaceId) {
          try {
            const workspacesRes = await api.get('/api/workspaces', { skipAuthRedirect: true })
            const workspaces = Array.isArray(workspacesRes.data) ? workspacesRes.data : workspacesRes.data?.data || []
            resolvedWorkspaceId = workspaces[0]?.id || workspaces[0]?.workspaceId || workspaces[0]?.workspace?.id || null
          } catch {
            resolvedWorkspaceId = null
          }
        }
        if (active && resolvedWorkspaceId) setWorkspaceId(resolvedWorkspaceId)

        const res = resolvedWorkspaceId
          ? await api.get(`/api/workspaces/${resolvedWorkspaceId}/members`, { skipAuthRedirect: true })
          : await api.get('/users')
        if (!active) return
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || []
        if (!rows.length) return
        const mapped = rows.map((member, index) => {
          const role = normalizeRole(member.role || member.users?.role)
          const template = roleTemplates.find((item) => item.key === role) || roleTemplates[3]
          const accessPolicy = member.accessPolicy || member.access_policy || {}
          return {
            id: member.userId || member.user_id || member.user?.id || member.users?.id || member.id || member._id || `member-${index}`,
            membershipId: member.id || member.membershipId,
            name: member.name || member.user?.name || member.users?.name || member.email || member.user?.email || member.users?.email || 'Unnamed user',
            email: member.email || member.user?.email || member.users?.email || '-',
            role,
            outletScopeMode: template.scope,
            outlets: template.scope === 'ALL_OUTLETS' ? ['all'] : ['samarinda'],
            permissions: accessPolicy.permissions || rolePermissions[role] || rolePermissions.outlet_staff,
            status: String(member.status || 'ACTIVE').toUpperCase(),
          }
        })
        setMembers(mapped)
        setSelectedMemberId(mapped[0]?.id || null)
      } catch {
        if (!active) return
        setMembers(fallbackMembers)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadMembers()
    return () => {
      active = false
    }
  }, [sessionUser])

  useEffect(() => {
    let active = true
    api
      .get('/outlets')
      .then((res) => {
        if (!active) return
        const rawOutlets = Array.isArray(res.data) ? res.data : res.data?.data || []
        const mappedOutlets = rawOutlets
          .map((outlet, index) => normalizeOutlet(outlet, index))
          .filter((outlet) => outlet.id && outlet.name)
        if (mappedOutlets.length) setOutlets(mappedOutlets)
      })
      .catch(() => {
        setOutlets(fallbackOutletOptions)
      })
    return () => {
      active = false
    }
  }, [])

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) || members[0],
    [members, selectedMemberId]
  )

  useEffect(() => {
    if (!selectedMember) return
    setSelectedRole(selectedMember.role)
    setScopeMode(selectedMember.outletScopeMode)
    setSelectedOutlets(selectedMember.outlets)
    setCustomPermissions(selectedMember.permissions || rolePermissions[selectedMember.role] || [])
    setDirty(false)
  }, [selectedMember])

  const filteredMembers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return members
    return members.filter((member) =>
      [member.name, member.email, member.role].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    )
  }, [members, query])

  const activeRoleTemplate = roleTemplates.find((role) => role.key === selectedRole) || roleTemplates[3]
  const selectedMemberIsOwner = selectedRole === 'owner' || selectedMember?.role === 'owner'
  const activePermissions = new Set(customPermissions)
  const totalPermissions = modulePermissions.reduce((sum, group) => sum + group.permissions.length, 0)
  const enabledCount = activePermissions.size

  const handleRoleChange = (roleKey) => {
    const nextRole = roleTemplates.find((role) => role.key === roleKey)
    if (!nextRole || selectedMemberIsOwner) return
    setSelectedRole(roleKey)
    setScopeMode(nextRole.scope)
    setSelectedOutlets(nextRole.scope === 'ALL_OUTLETS' ? ['all'] : [outlets[0]?.id].filter(Boolean))
    setCustomPermissions(rolePermissions[roleKey] || [])
    setDirty(true)
  }

  const handleOutletToggle = (outletId) => {
    if (selectedMemberIsOwner) return
    if (scopeMode !== 'SELECTED_OUTLETS') return
    setSelectedOutlets((prev) => {
      const next = prev.includes(outletId)
        ? prev.filter((id) => id !== outletId)
        : [...prev, outletId]
      return next.length ? next : prev
    })
    setDirty(true)
  }

  const handlePermissionToggle = (permissionKey) => {
    if (selectedMemberIsOwner) return
    setCustomPermissions((prev) => {
      const current = new Set(prev)
      if (current.has(permissionKey)) current.delete(permissionKey)
      else current.add(permissionKey)
      return Array.from(current)
    })
    setDirty(true)
  }

  const handleApplyDraft = async () => {
    if (!isOwner || !selectedMember) return
    if (selectedMemberIsOwner) return
    setSaving(true)
    setSaveMessage(null)
    try {
      if (!workspaceId) throw new Error('Workspace ID tidak ditemukan untuk menyimpan access control')
      await api.patch(`/api/workspaces/${workspaceId}/members/${selectedMember.id}`, { role: selectedRole })
      await api.put(`/api/workspaces/${workspaceId}/members/${selectedMember.id}/access-policy`, { permissions: customPermissions })
      const outletPayload = scopeMode === 'ALL_OUTLETS'
        ? outlets.map((outlet) => ({ outletId: outlet.id, role: selectedRole }))
        : scopeMode === 'SELECTED_OUTLETS'
          ? selectedOutlets.map((outletId) => ({ outletId, role: selectedRole }))
          : []
      await api.put(`/api/outlets/users/${selectedMember.id}/access`, { outlets: outletPayload })

      setSaveMessage({ type: 'success', text: 'Access control berhasil disimpan ke backend.' })
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Gagal menyimpan access control'
      setSaveMessage({ type: 'error', text: message })
      setSaving(false)
      return
    }
    setMembers((prev) =>
      prev.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              role: selectedRole,
              outletScopeMode: scopeMode,
              outlets: selectedOutlets,
              permissions: customPermissions,
            }
          : member
      )
    )
    setDirty(false)
    setSaving(false)
  }

  if (!isOwner) {
    return (
      <main style={{ padding: '24px clamp(16px, 3vw, 36px)', minHeight: '100dvh', background: 'var(--dashboard-bg)', display: 'grid', placeItems: 'center' }}>
        <section className="ac-locked-card">
          <div className="ac-lock-icon">
            <Lock size={32} />
          </div>
          <h1 className="ac-locked-title">Owner access required</h1>
          <p className="ac-locked-text">
            Halaman Access Control hanya untuk owner workspace. Frontend ini hanya guard tampilan; backend tetap wajib menolak semua perubahan role dan permission dari non-owner.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="ac-page">
      <section className="ac-hero">
        <div className="ac-hero-content">
          <div className="ac-eyebrow">Workspace Access Control</div>
          <h1 className="ac-title">Roles and Module Permissions</h1>
          <p className="ac-description">
            Atur role akun, izin modul, dan outlet scope berdasarkan spec `selaluteh-workspace-access-control`. Owner tetap dilindungi dan tidak bisa diturunkan dari editor umum.
          </p>
        </div>
        <div className="ac-hero-meta">
          <div className="ac-hero-meta-icon">
            <ShieldCheck size={28} />
          </div>
          <div className="ac-hero-meta-text">
            <span className="ac-hero-meta-title">Deny by default</span>
            <span className="ac-hero-meta-detail">{enabledCount} of {totalPermissions} permissions enabled for selected role</span>
          </div>
        </div>
      </section>

      <section className="ac-guardrail">
        <AlertTriangle size={18} className="ac-guardrail-icon" />
        <span>
          UI ini untuk desain dan assignment flow. Security boundary tetap backend authorization, service guard, repository scope, dan RLS sesuai spec WAC-R25 sampai WAC-R27.
        </span>
      </section>

      <div className="ac-grid">
        <aside className="ac-card ac-sidebar">
          <div className="ac-sidebar-header">
            <div>
              <h2 className="ac-sidebar-title">Accounts</h2>
              <p className="ac-sidebar-hint">{isLoading ? 'Loading users...' : `${members.length} workspace members`}</p>
            </div>
            <span className="ac-sidebar-icon">
              <Users size={20} />
            </span>
          </div>
          <div className="ac-search-box">
            <Search size={16} className="ac-search-icon" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search account or role'
              className="ac-search-input"
            />
          </div>
          <div className="ac-member-list">
            {filteredMembers.map((member) => {
              const template = roleTemplates.find((role) => role.key === member.role) || roleTemplates[3]
              const active = member.id === selectedMember?.id
              return (
                <button
                  key={member.id}
                  type='button'
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`ac-member-row ${active ? 'ac-member-row-active' : ''}`}
                >
                  <span className="ac-avatar" style={{ background: template.tone }}>{initials(member.name)}</span>
                  <span className="ac-member-info">
                    <strong className="ac-member-name">{member.name}</strong>
                    <span className="ac-member-email">{member.email}</span>
                    <div className="ac-member-meta-row">
                      <span className="ac-badge-pill ac-badge-role">{template.label}</span>
                      <span className="ac-badge-pill ac-badge-scope">{member.outletScopeMode.replaceAll('_', ' ')}</span>
                    </div>
                  </span>
                  <ChevronRight size={16} className="ac-member-chevron" />
                </button>
              )
            })}
          </div>
        </aside>

        <section className="ac-editor">
          <div className="ac-editor-header ac-card">
            <div>
              <div className="ac-eyebrow" style={{ color: 'var(--text-muted)' }}>Selected account</div>
              <h2 className="ac-selected-title">{selectedMember?.name || '-'}</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>{selectedMember?.email || '-'}</p>
            </div>
            <button
              type='button'
              onClick={handleApplyDraft}
              disabled={!dirty || selectedMemberIsOwner || saving}
              className="ac-save-button"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save access'}
            </button>
          </div>
          {saveMessage && (
            <div className={`ac-save-message ${saveMessage.type === 'error' ? 'ac-save-message-error' : 'ac-save-message-success'}`}>
              {saveMessage.text}
            </div>
          )}

          <div className="ac-card">
            <div className="ac-section-header">
              <span className="ac-section-icon">
                <UserCog size={18} />
              </span>
              <h3 className="ac-section-title">Role template</h3>
            </div>
            <div className="ac-role-grid">
              {roleTemplates.map((role) => {
                const active = selectedRole === role.key
                const disabled = selectedMemberIsOwner && role.key !== selectedRole
                return (
                  <button
                    key={role.key}
                    type='button'
                    disabled={disabled}
                    onClick={() => handleRoleChange(role.key)}
                    className={`ac-role-card ${active ? 'ac-role-card-active' : ''}`}
                    style={{
                      borderRightColor: active ? role.tone : undefined,
                      borderBottomColor: active ? role.tone : undefined,
                      borderLeftColor: active ? role.tone : undefined,
                      boxShadow: active ? `0 12px 28px ${role.tone}1A` : undefined,
                      borderTop: `4px solid ${role.tone}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <span className="ac-role-dot" style={{ background: role.tone }} />
                      <strong className="ac-role-label">{role.label}</strong>
                    </div>
                    <small className="ac-role-desc">{role.description}</small>
                    {role.locked && (
                      <span className="ac-role-locked-pill">
                        <Lock size={10} />
                        Protected
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="ac-two-column">
            <div className="ac-card">
              <div className="ac-section-header">
                <span className="ac-section-icon">
                  <Store size={18} />
                </span>
                <h3 className="ac-section-title">Outlet scope</h3>
              </div>
              <div className="ac-segmented-control">
                {['ALL_OUTLETS', 'SELECTED_OUTLETS', 'NO_OUTLET_ACCESS'].map((mode) => (
                  <button
                    key={mode}
                    type='button'
                    disabled={selectedMemberIsOwner}
                    onClick={() => {
                      setScopeMode(mode)
                      setSelectedOutlets(mode === 'ALL_OUTLETS' ? ['all'] : mode === 'SELECTED_OUTLETS' ? [outlets[0]?.id].filter(Boolean) : [])
                      setDirty(true)
                    }}
                    className={`ac-segment-button ${scopeMode === mode ? 'ac-segment-button-active' : ''}`}
                  >
                    {mode.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
              {scopeMode === 'ALL_OUTLETS' && (
                <div className="ac-outlet-list-vertical">
                  {outlets.map((outlet) => (
                    <div key={outlet.id} className="ac-outlet-chip-vertical ac-outlet-chip-vertical-all">
                      <Check size={14} style={{ color: '#0f766e', flexShrink: 0 }} />
                      <span className="ac-outlet-icon-container">
                        <Store size={14} />
                      </span>
                      <span className="ac-outlet-chip-text">
                        <span className="ac-outlet-chip-name">{outlet.name}</span>
                        {(outlet.city || outlet.status) && (
                          <span className="ac-outlet-chip-meta">
                            {[outlet.city, outlet.status].filter(Boolean).join(' - ')}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {scopeMode === 'SELECTED_OUTLETS' && (
                <div className="ac-outlet-list-vertical">
                  {outlets.map((outlet) => {
                    const isSelected = selectedOutlets.includes(outlet.id)
                    return (
                      <button
                        key={outlet.id}
                        type='button'
                        disabled={selectedMemberIsOwner}
                        onClick={() => handleOutletToggle(outlet.id)}
                        className={`ac-outlet-chip-vertical ${isSelected ? 'ac-outlet-chip-vertical-active' : ''}`}
                      >
                        {isSelected ? (
                          <Check size={14} style={{ color: '#047857', flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 14, flexShrink: 0 }} />
                        )}
                        <span className="ac-outlet-icon-container">
                          <Store size={14} />
                        </span>
                        <span className="ac-outlet-chip-text">
                          <span className="ac-outlet-chip-name">{outlet.name}</span>
                          {(outlet.city || outlet.status) && (
                            <span className="ac-outlet-chip-meta">
                              {[outlet.city, outlet.status].filter(Boolean).join(' - ')}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="ac-card">
              <div className="ac-section-header">
                <span className="ac-section-icon">
                  <SlidersHorizontal size={18} />
                </span>
                <h3 className="ac-section-title">Effective summary</h3>
              </div>
              <div className="ac-summary-rows">
                <div className="ac-summary-row">
                  <span className="ac-summary-label">Role</span>
                  <strong className="ac-summary-val">{activeRoleTemplate.label}</strong>
                </div>
                <div className="ac-summary-row">
                  <span className="ac-summary-label">Status</span>
                  <strong className="ac-summary-val" style={{ color: selectedMember?.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>
                    {selectedMember?.status || 'ACTIVE'}
                  </strong>
                </div>
                <div className="ac-summary-row">
                  <span className="ac-summary-label">Scope</span>
                  <strong className="ac-summary-val">{scopeMode.replaceAll('_', ' ')}</strong>
                </div>
                <div className="ac-summary-row">
                  <span className="ac-summary-label">Visible outlets</span>
                  <strong className="ac-summary-val">
                    {scopeMode === 'ALL_OUTLETS' ? outlets.length : selectedOutlets.length}
                  </strong>
                </div>
                <div className="ac-summary-row">
                  <span className="ac-summary-label">Permissions</span>
                  <strong className="ac-summary-val">{enabledCount}/{totalPermissions}</strong>
                </div>
              </div>
              
              <div className="ac-progress-container">
                <div className="ac-progress-header">
                  <span>Permissions Enabled</span>
                  <span>{Math.round((enabledCount / totalPermissions) * 100)}%</span>
                </div>
                <div className="ac-progress-bar-bg">
                  <div 
                    className="ac-progress-bar-fill" 
                    style={{ 
                      width: `${Math.round((enabledCount / totalPermissions) * 100)}%`,
                      background: `linear-gradient(90deg, ${activeRoleTemplate.tone} 0%, #10b981 100%)` 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="ac-card">
            <div className="ac-section-header">
              <span className="ac-section-icon">
                <ShieldCheck size={18} />
              </span>
              <h3 className="ac-section-title">Module permission matrix</h3>
            </div>
            <div className="ac-permission-list-vertical">
              {modulePermissions.map((group) => {
                const groupEnabledCount = group.permissions.filter(([key]) => activePermissions.has(key)).length
                return (
                  <div key={group.domain} className="ac-permission-group">
                    <h4 className="ac-permission-group-title">
                      <span>{group.domain} Module</span>
                      <span className="ac-permission-group-badge">{groupEnabledCount} dari {group.permissions.length} aktif</span>
                    </h4>
                    <div className="ac-permission-rows">
                      {group.permissions.map(([key, label, description]) => {
                        const enabled = activePermissions.has(key)
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={selectedMemberIsOwner}
                            onClick={() => handlePermissionToggle(key)}
                            className={`ac-permission-row-vertical ${enabled ? 'ac-permission-row-enabled' : ''}`}
                          >
                            <span 
                              className={`ac-permission-toggle ${enabled ? 'ac-permission-toggle-on' : ''}`}
                              style={{ backgroundColor: enabled ? activeRoleTemplate.tone : undefined, marginTop: '2px' }}
                            >
                              {enabled && <Check size={12} />}
                            </span>
                            <div className="ac-permission-details">
                              <div className="ac-permission-header-line">
                                <strong className="ac-permission-label">{label}</strong>
                                <span className="ac-permission-key-badge">{key}</span>
                              </div>
                              <p className="ac-permission-description">{description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
