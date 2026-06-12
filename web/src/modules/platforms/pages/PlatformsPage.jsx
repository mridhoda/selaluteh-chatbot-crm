import React, { useEffect, useMemo, useState, useCallback } from 'react'
import api from '../../../shared/api/httpClient'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import PlatformPickerModal from '../components/PlatformPickerModal'

export default function Platforms() {
  const [rows, setRows] = useState([])
  const [agents, setAgents] = useState([])
  const [sel, setSel] = useState(null)
  const [q, setQ] = useState('')

  // modal: picker & form
  const [showPicker, setShowPicker] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // form state
  const [editing, setEditing] = useState(null)
  const [type, setType] = useState('telegram')
  const [label, setLabel] = useState('')
  const [token, setToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [saving, setSaving] = useState(false)

  // ===== Load data sekali (anti-loop) =====
  useEffect(() => {
    const ac = new AbortController()
      ; (async () => {
        try {
          const [p, a] = await Promise.all([
            api.get('/platforms', { signal: ac.signal }),
            api.get('/agents', { signal: ac.signal }),
          ])
          const plats = p.data || []
          setRows(plats)
          setAgents(a.data || [])
          // Only set sel if it's currently null and there are platforms
          setSel((currentSel) => {
            if (!currentSel && plats.length) {
              return plats[0]
            }
            return currentSel
          })
        } catch (error) {
          console.error('Failed to load platforms or agents', error)
        }
      })()
    return () => ac.abort()
  }, [])

  // ===== Derived =====
  const filtered = useMemo(() => {
    const qq = q.toLowerCase()
    return rows.filter(
      (x) =>
        x.label?.toLowerCase().includes(qq) ||
        x.type?.toLowerCase().includes(qq) ||
        (x.accountId || '').toLowerCase().includes(qq)
    )
  }, [rows, q])

  const pfAgent = useMemo(() => {
    const m = {}
    for (const a of agents) if (a.platformId) m[a.platformId] = a
    return m
  }, [agents])

  const mask = (s = '') =>
    s.length > 10 ? s.slice(0, 6) + '…' + s.slice(-2) : s
  const openPopup = (url) =>
    window.open(
      url,
      'connect_popup',
      'width=720,height=720,noopener,noreferrer'
    )

  // ===== Add New (SELALU buka picker) =====
  const openAddNew = useCallback(() => {
    // pastikan form TIDAK muncul dulu
    setShowModal(false)
    setEditing(null)
    setType('telegram')
    setLabel('')
    setToken('')
    setAccountId('')
    setWebhookSecret('')
    setAppId('')
    setAppSecret('')
    setPhoneNumberId('')
    // buka picker
    setShowPicker(true)
  }, [])

  // ===== Edit =====
  const openEdit = useCallback(() => {
    if (!sel) return
    setEditing(sel)
    setType(sel.type)
    setLabel(sel.label || '')
    setToken(sel.token || '')
    setAccountId(sel.accountId || '')
    setWebhookSecret(sel.webhookSecret || '')
    setAppId(sel.appId || '')
    setAppSecret(sel.appSecret || '')
    setPhoneNumberId(sel.phoneNumberId || '')
    setShowModal(true)
  }, [sel])

  // ===== Simpan (create/update) =====
  const submit = useCallback(
    async (e) => {
      e?.preventDefault?.()
      if (!label) return alert('Label wajib diisi')
      setSaving(true)
      try {
        if (editing) {
          const r = await api.put(`/platforms/${editing._id}`, {
            type,
            label,
            token,
            accountId,
            phoneNumberId,
            webhookSecret,
            appId,
            appSecret,
          })
          setRows((prev) =>
            prev.map((x) => (x._id === editing._id ? r.data : x))
          )
          setSel(r.data)
        } else {
          const r = await api.post('/platforms', {
            type,
            label,
            token,
            accountId,
            phoneNumberId,
            webhookSecret,
            appId,
            appSecret,
          })
          setRows((prev) => [r.data, ...prev])
          setSel(r.data)
          if (r.data.type === 'telegram') {
            try {
              await api.post(`/integrations/telegram/${r.data._id}/setWebhook`)
              console.log('Successfully set Telegram webhook for', r.data.label)
            } catch (err) {
              console.error('Failed to auto-set webhook for Telegram', err)
              alert(
                'Platform berhasil disimpan, tapi gagal auto-set webhook. Coba edit dan simpan lagi.'
              )
            }
          }
        }
        setShowModal(false)
      } finally {
        setSaving(false)
      }
    },
    [
      editing,
      type,
      label,
      token,
      accountId,
      phoneNumberId,
      webhookSecret,
      appId,
      appSecret,
    ]
  )

  // ===== Delete =====
  const remove = useCallback(async () => {
    if (!sel) return
    if (!confirm(`Hapus platform "${sel.label}"?`)) return
    await api.delete(`/platforms/${sel._id}`)
    setRows((prev) => prev.filter((x) => x._id !== sel._id))
    setSel(null)
  }, [sel])

  // ===== Picker flow =====
  const createPlaceholderAndOAuth = useCallback(
    async (ptype) => {
      // Buat placeholder agar ada kartu di list kiri, lalu jalankan OAuth
      const next = rows.filter((r) => r.type === ptype).length + 1
      const defaultLabel = `${ptype.charAt(0).toUpperCase() + ptype.slice(1)} #${next}`
      const r = await api.post('/platforms', {
        type: ptype,
        label: defaultLabel,
      })
      const created = r.data
      setRows((prev) => [created, ...prev])
      setSel(created)
      openPopup(
        `/integrations/meta/start?platformId=${created._id}&channel=${ptype}`
      )
    },
    [rows]
  )

  const handlePick = useCallback(
    async (ptype) => {
      setShowPicker(false)
      // Messenger via OAuth
      if (ptype === 'messenger') {
        try {
          await createPlaceholderAndOAuth(ptype)
        } catch {
          alert('Gagal membuka OAuth')
        }
        return
      }
      // Platform biasa → tampilkan FORM setelah pilih tipe
      setEditing(null)
      setType(ptype)
      const next = rows.filter((r) => r.type === ptype).length + 1
      setLabel(`${ptype.charAt(0).toUpperCase() + ptype.slice(1)} #${next}`)
      setToken('')
      setAccountId('')
      setWebhookSecret('')
      setAppId('')
      setAppSecret('')
      setPhoneNumberId('')
      setShowModal(true)
    },
    [rows, createPlaceholderAndOAuth]
  )



  return (
    <div className='platforms-layout'>
      {/* LEFT */}
      <div className='platforms-list-container'>
        <div
          className='row'
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div className='title'>Inboxes</div>
          <button className='btn ghost' onClick={openAddNew}>
            ＋
          </button>
        </div>

        <div className='searchbox' style={{ margin: '8px 0 12px' }}>
          <input
            className='input'
            placeholder='Search by name…'
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className='platforms-list'>
          {filtered.map((p) => (
            <div
              key={p._id}
              className={`platform-item ${sel?._id === p._id ? 'active' : ''}`}
              onClick={() => setSel(p)}
            >
              <div className='platform-ico'>
                <BrandIcon type={p.type} size={24} />
              </div>
              <div className='platform-info'>
                <div className='platform-name'>{p.label}</div>
                <div className='platform-sub'>
                  {p.type.toUpperCase()} {p.accountId ? `• ${p.accountId}` : ''}
                </div>
              </div>
              {pfAgent[p._id] && <div className='platform-separator'></div>}
              {pfAgent[p._id] && (
                <div className='platform-agent-badge'>
                  {pfAgent[p._id].name}
                </div>
              )}
            </div>
          ))}
          {!filtered.length && <div className='muted'>Tidak ada platform</div>}
          <div className='connect-tip' onClick={openAddNew}>
            + Click to Connect A Platform
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className='platform-details'>
        {!sel ? (
          <div className='card center' style={{ height: '100%' }}>
            No Inbox Selected
          </div>
        ) : (
          <div className='card col' style={{ gap: 12 }}>
            <div
              className='row'
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div className='row' style={{ alignItems: 'center', gap: 8 }}>
                <div className='platform-ico'>
                  <BrandIcon type={sel.type} size={22} />
                </div>
                <div style={{ fontWeight: 700 }}>{sel.label}</div>
                <span className='badge'>{sel.type}</span>
              </div>
              <div className='row' style={{ gap: 8 }}>
                {sel?.type === 'instagram' && (
                  <button
                    className='btn ghost'
                    onClick={() =>
                      openPopup(
                        `/integrations/meta/start?platformId=${sel._id}&channel=instagram`
                      )
                    }
                  >
                    Connect via Facebook
                  </button>
                )}
                {sel?.type === 'facebook' && (
                  <button
                    className='btn ghost'
                    onClick={() =>
                      openPopup(
                        `/integrations/meta/start?platformId=${sel._id}&channel=messenger`
                      )
                    }
                  >
                    Connect via Facebook
                  </button>
                )}
                <button className='btn ghost' onClick={openEdit}>
                  Edit
                </button>
                <button className='btn ghost' onClick={remove}>
                  Delete
                </button>
              </div>
            </div>

            <div className='row'>
              <div className='col' style={{ flex: 1 }}>
                <div className='muted'>Account ID</div>
                <div>{sel.accountId || '-'}</div>
              </div>
              <div className='col' style={{ flex: 1 }}>
                <div className='muted'>Phone Number ID</div>
                <div>{sel.phoneNumberId || '-'}</div>
              </div>
              <div className='col' style={{ flex: 2 }}>
                <div className='muted'>Token/API Key</div>
                <div>{mask(sel.token) || '-'}</div>
              </div>
            </div>

            <div className='col'>
              <div className='muted'>Webhook URL</div>
              <div className='badge'>{`<PUBLIC_BASE_URL>/webhook/${sel.type === 'facebook' ? 'meta' : sel.type}`}</div>
            </div>
          </div>
        )}
      </div>

      {/* Picker modal */}
      {showPicker && (
        <PlatformPickerModal
          onClose={() => setShowPicker(false)}
          onPick={handlePick}
        />
      )}

      {/* Form modal */}
      {showModal && (
        <div className='modal'>
          <div className='modal-card'>
            <div
              className='row'
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <h3 style={{ margin: 0 }}>
                {editing ? 'Edit Platform' : 'Connect a Platform'}
              </h3>
              <button className='btn ghost' onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <form className='col' onSubmit={submit}>
              <div
                className='row'
                style={{ gap: 8, alignItems: 'center', marginBottom: 12 }}
              >
                <BrandIcon type={type} size={22} />
                <div
                  style={{
                    textTransform: 'capitalize',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {type}
                </div>
              </div>
              <input
                className='input'
                placeholder='Label'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />

              {type === 'whatsapp' ? (
                <>
                  <p
                    className='muted'
                    style={{ marginTop: 2, marginBottom: 0 }}
                  >
                    Masukkan kredensial dari Meta for Developers App Anda.
                  </p>
                  <input
                    className='input'
                    placeholder='Meta App ID'
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='Meta App Secret'
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='WhatsApp Access Token'
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='WhatsApp Business Account ID'
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='WhatsApp Phone Number ID'
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                  />
                </>
              ) : type === 'instagram' ? (
                <>
                  <p
                    className='muted'
                    style={{ marginTop: 2, marginBottom: 0 }}
                  >
                    Masukkan kredensial dari Meta for Developers App Anda.
                  </p>
                  <input
                    className='input'
                    placeholder='Instagram App ID'
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='Instagram App Secret'
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='Page Access Token'
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='Instagram Business Account ID'
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                </>
              ) : type === 'telegram' ? (
                <>
                  <p
                    className='muted'
                    style={{ marginTop: 2, marginBottom: 0 }}
                  >
                    Masukkan token yang Anda dapat dari BotFather.
                  </p>
                  <input
                    className='input'
                    placeholder='Telegram Bot Token'
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <input
                    className='input'
                    placeholder='Token/API Key'
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='Account ID (opsional)'
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='Webhook Secret (opsional)'
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='App ID (opsional)'
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                  />
                  <input
                    className='input'
                    placeholder='App Secret (opsional)'
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                </>
              )}

              <div
                className='row'
                style={{ justifyContent: 'flex-end', gap: 8 }}
              >
                <button
                  type='button'
                  className='btn ghost'
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button className='btn' disabled={saving}>
                  {saving ? 'Menyimpan…' : editing ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
