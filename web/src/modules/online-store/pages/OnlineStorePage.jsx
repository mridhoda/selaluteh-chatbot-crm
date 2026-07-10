import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Copy, ExternalLink, Image, Link2, QrCode, RefreshCcw, Store, Trash2, Upload, Wifi, WifiOff, X } from 'lucide-react'
import api from '../../../shared/api/httpClient'

function statusTone(item) {
  return item.is_active
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-slate-50 text-slate-500 border-slate-200'
}

function scopeTone(scope) {
  if (scope === 'universal') return 'bg-violet-50 text-violet-700 border-violet-100'
  if (scope === 'outlet') return 'bg-sky-50 text-sky-700 border-sky-100'
  return 'bg-amber-50 text-amber-700 border-amber-100'
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function absoluteUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (typeof window === 'undefined') return value
  const configuredBase = String(import.meta.env.VITE_PUBLIC_STORE_BASE_URL || '').replace(/\/+$/, '')
  const base = configuredBase || window.location.origin
  return `${base}${value.startsWith('/') ? value : `/${value}`}`
}

function qrImageUrl(value) {
  const url = absoluteUrl(value)
  return url ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=14&data=${encodeURIComponent(url)}` : ''
}

function normalizeBanners(settings) {
  if (Array.isArray(settings?.banners) && settings.banners.length) {
    return settings.banners.slice(0, 5).map((banner) => ({
      imageUrl: banner.image_url || banner.imageUrl || '',
      linkUrl: banner.link_url || banner.linkUrl || '',
    }))
  }
  return settings?.banner_url || settings?.bannerUrl ? [{ imageUrl: settings.banner_url || settings.bannerUrl, linkUrl: settings.banner_link_url || settings.bannerLinkUrl || '' }] : []
}

function normalizeResponse(payload = {}) {
  const data = Array.isArray(payload.data) ? payload.data : []
  return {
    items: data,
    summary: payload.summary || {
      total: data.length,
      active: data.filter((item) => item.is_active).length,
      inactive: data.filter((item) => !item.is_active).length,
      connected_outlets: 0,
    },
  }
}

function StoreSettingsPanel({ selectedQr, settings, onUploadAsset, onSaveSettings, saving, uploadingAsset = '' }) {
  const [draft, setDraft] = useState(() => ({
    name: settings?.name || selectedQr?.name?.replace(/Universal QR/i, '').trim() || 'Selalu Kopi',
    description: settings?.description || 'Kopi nikmat, harga bersahabat.',
    logoUrl: settings?.logo_url || '',
    banners: normalizeBanners(settings),
    bannerIntervalSeconds: settings?.banner_interval_seconds || 5,
    faviconUrl: settings?.favicon_url || '',
  }))
  const targetUrl = absoluteUrl(selectedQr?.public_url || '/store/selalu-kopi')

  useEffect(() => {
    setDraft({
      name: settings?.name || selectedQr?.name?.replace(/Universal QR/i, '').trim() || 'Selalu Kopi',
      description: settings?.description || 'Kopi nikmat, harga bersahabat.',
      logoUrl: settings?.logo_url || '',
      banners: normalizeBanners(settings),
      bannerIntervalSeconds: settings?.banner_interval_seconds || 5,
      faviconUrl: settings?.favicon_url || '',
    })
  }, [settings?.storefront_id])

  const handleUpload = async (event, type) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const uploaded = await onUploadAsset(file, type)
    if (!uploaded?.url) return
    if (type === 'logo') setDraft((current) => ({ ...current, logoUrl: uploaded.url }))
    if (type === 'banner') setDraft((current) => current.banners.length >= 5 ? current : ({ ...current, banners: [...current.banners, { imageUrl: uploaded.url, linkUrl: '' }] }))
    if (type === 'favicon') setDraft((current) => ({ ...current, faviconUrl: uploaded.url }))
  }

  return (
    <div className="space-y-4 p-5">
      <div>
        <h3 className="m-0 text-sm font-black text-slate-900">Online Store Settings</h3>
        <p className="m-0 mt-1 text-xs font-semibold text-slate-400">Atur tampilan dan informasi toko online Anda.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h4 className="m-0 text-sm font-black text-slate-900">Logo Store</h4>
          <p className="m-0 mt-1 text-[11px] font-semibold text-slate-400">Logo akan tampil di header online store dan struk.</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-emerald-50 text-emerald-800">
              {draft.logoUrl ? <img src={absoluteUrl(draft.logoUrl)} alt="Store logo" className="h-full w-full object-contain p-2" /> : <><Store className="h-8 w-8" /><span className="mt-1 text-xs font-black leading-tight">SELALU<br />KOPI</span></>}
            </div>
            <div className="space-y-2">
              <label className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 ${uploadingAsset ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <Upload className="h-3.5 w-3.5" />
                {uploadingAsset === 'logo' ? 'Uploading...' : 'Upload Logo'}
                <input type="file" disabled={Boolean(uploadingAsset)} accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(event) => handleUpload(event, 'logo')} />
              </label>
              <p className="m-0 text-[10px] font-semibold text-slate-400">PNG, JPG, SVG maks. 2MB</p>
              <button type="button" onClick={() => setDraft((current) => ({ ...current, logoUrl: '' }))} className="inline-flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-4 py-2 text-xs font-black text-rose-500 hover:bg-rose-50">
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Logo
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 py-4">
          <h4 className="m-0 text-sm font-black text-slate-900">Banner Promosi</h4>
          <p className="m-0 mt-1 text-[11px] font-semibold text-slate-400">Banner akan tampil di halaman utama online store.</p>
          <div className="relative mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-amber-500 p-4 text-white shadow-sm">
            {draft.banners[0]?.imageUrl && <img src={absoluteUrl(draft.banners[0].imageUrl)} alt="Store banner" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/75 via-emerald-900/45 to-amber-500/25" />
            <button type="button" onClick={() => setDraft((current) => ({ ...current, banners: current.banners.slice(1) }))} className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-700">
              <X className="h-4 w-4" />
            </button>
            <div className="relative z-10 text-[10px] font-black uppercase tracking-widest text-amber-200">Diskon Spesial</div>
            <div className="relative z-10 mt-1 text-3xl font-black leading-none text-amber-300">20%</div>
            <div className="relative z-10 mt-1 text-xs font-bold">Setiap hari Jumat</div>
            <div className="relative z-10 mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black text-emerald-900">Mulai Sekarang</div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 ${uploadingAsset ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <Image className="h-3.5 w-3.5" />
              {uploadingAsset === 'banner' ? 'Uploading...' : `Upload Banner (${draft.banners.length}/5)`}
                <input type="file" disabled={Boolean(uploadingAsset) || draft.banners.length >= 5} accept="image/png,image/jpeg" className="sr-only" onChange={(event) => handleUpload(event, 'banner')} />
            </label>
            <span className="text-[10px] font-semibold text-slate-400">PNG, JPG maks. 5MB</span>
          </div>
          <div className="mt-3 space-y-2">
            {draft.banners.map((banner, index) => <div key={`${banner.imageUrl}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3"><img src={absoluteUrl(banner.imageUrl)} alt={`Banner ${index + 1}`} className="h-12 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="m-0 text-xs font-black text-slate-700">Banner {index + 1}</p><input value={banner.linkUrl || ''} placeholder="Tautan banner (opsional)" onChange={(event) => setDraft((current) => ({ ...current, banners: current.banners.map((item, itemIndex) => itemIndex === index ? { ...item, linkUrl: event.target.value } : item) }))} className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 outline-none focus:border-violet-400" /></div><button type="button" onClick={() => setDraft((current) => ({ ...current, banners: current.banners.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div>
            </div>)}
            <p className="m-0 text-[10px] font-semibold text-slate-400">Maksimal 5 banner. Banner berpindah otomatis sesuai durasi yang diatur.</p>
          </div>
          <label className="mt-3 block">
            <span className="text-[11px] font-black text-slate-700">Durasi perpindahan carousel</span>
            <div className="mt-1 flex items-center gap-2">
              <input type="number" min="2" max="60" value={draft.bannerIntervalSeconds} onChange={(event) => setDraft((current) => ({ ...current, bannerIntervalSeconds: Math.min(60, Math.max(2, Number(event.target.value) || 2)) }))} className="h-10 w-28 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 outline-none focus:border-violet-400" />
              <span className="text-xs font-semibold text-slate-400">detik (min. 2, maks. 60)</span>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <h4 className="m-0 text-sm font-black text-slate-900">Informasi Store</h4>
          <label className="mt-3 block">
            <span className="text-[11px] font-black text-slate-700">Nama Store</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400" />
          </label>
          <label className="mt-3 block">
            <span className="text-[11px] font-black text-slate-700">Deskripsi Store</span>
            <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={150} className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400" />
            <span className="mt-1 block text-right text-[10px] font-semibold text-slate-400">{draft.description.length}/150</span>
          </label>
          <div className="mt-3 grid grid-cols-[56px_1fr] gap-3">
            <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-amber-50 text-amber-700">
              {draft.faviconUrl ? <img src={absoluteUrl(draft.faviconUrl)} alt="Favicon" className="h-full w-full object-contain p-1" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-700">Favicon (opsional)</div>
              <label className={`mt-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 ${uploadingAsset ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <Upload className="h-3.5 w-3.5" />
                {uploadingAsset === 'favicon' ? 'Uploading...' : 'Upload Favicon'}
                <input type="file" disabled={Boolean(uploadingAsset)} accept="image/png,image/x-icon,image/vnd.microsoft.icon" className="sr-only" onChange={(event) => handleUpload(event, 'favicon')} />
              </label>
              <span className="ml-2 text-[10px] font-semibold text-slate-400">PNG, ICO maks. 1MB</span>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            Store URL: <span className="font-black text-slate-700">{targetUrl}</span>
          </div>
          <button type="button" disabled={saving} onClick={() => onSaveSettings(draft)} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 hover:bg-violet-700 disabled:bg-slate-300">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnlineStorePage() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, connected_outlets: 0 })
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingAsset, setUploadingAsset] = useState('')
  const [storeSettings, setStoreSettings] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [createScope, setCreateScope] = useState('universal')
  const [createOutletId, setCreateOutletId] = useState('')
  const [selectedQrId, setSelectedQrId] = useState(null)
  const [detailTab, setDetailTab] = useState('qr')

  const loadQrCodes = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/v1/admin/online-store/qr-codes')
      const normalized = normalizeResponse(res.data)
      setItems(normalized.items)
      setSummary(normalized.summary)
      setOutlets(Array.isArray(res.data?.outlets) ? res.data.outlets : [])
      if (selectedQrId && !normalized.items.some((item) => item.id === selectedQrId)) setSelectedQrId(null)
      const settingsRes = await api.get('/api/v1/admin/online-store/settings')
      setStoreSettings(settingsRes.data?.data || null)
    } catch (err) {
      console.error('Failed to load online store QR list:', err)
      setError(err?.response?.data?.error?.message || err?.message || 'Gagal memuat daftar QR Online Store.')
    } finally {
      setLoading(false)
    }
  }

  const uploadStoreAsset = async (file, type) => {
    setUploadingAsset(type)
    setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    try {
      const res = await api.post('/api/v1/admin/online-store/settings/assets', form)
      const fileRow = res.data?.data
      return { fileId: fileRow?.id, url: fileRow?.url }
    } catch (err) {
      console.error('Failed to upload online store asset:', err)
      setError(err?.response?.data?.error?.message || err?.message || 'Gagal upload file online store.')
      return null
    } finally {
      setUploadingAsset('')
    }
  }

  const saveStoreSettings = async (draft) => {
    setSavingSettings(true)
    try {
      const body = {
        name: draft.name,
        description: draft.description,
        logoUrl: draft.logoUrl || null,
        banners: (draft.banners || []).slice(0, 5),
        bannerIntervalSeconds: Number(draft.bannerIntervalSeconds) || 5,
        bannerUrl: draft.banners?.[0]?.imageUrl || null,
        bannerLinkUrl: draft.banners?.[0]?.linkUrl || '',
        faviconUrl: draft.faviconUrl || null,
      }
      const res = await api.put('/api/v1/admin/online-store/settings', body)
      setStoreSettings(res.data?.data || null)
    } catch (err) {
      console.error('Failed to save online store settings:', err)
      setError(err?.response?.data?.error?.message || err?.message || 'Gagal menyimpan online store settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  const createQr = async () => {
    if (generating) return
    if (createScope === 'outlet' && !createOutletId) {
      setError('Pilih outlet dulu untuk membuat Outlet QR.')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const res = await api.post('/api/v1/admin/online-store/qr-codes', {
        scope: createScope,
        outletId: createScope === 'outlet' ? createOutletId : null,
      })
      const targetUrl = res.data?.target_url || res.data?.public_path
      if (targetUrl) await copyText(absoluteUrl(targetUrl))
      await loadQrCodes()
    } catch (err) {
      console.error('Failed to generate QR store:', err)
      setError(err?.response?.data?.error?.message || err?.message || 'Gagal generate QR Store.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    loadQrCodes()
  }, [])

  const filteredItems = useMemo(() => {
    if (filter === 'active') return items.filter((item) => item.is_active)
    if (filter === 'inactive') return items.filter((item) => !item.is_active)
    if (filter === 'universal') return items.filter((item) => item.scope === 'universal')
    if (filter === 'outlet') return items.filter((item) => item.scope === 'outlet')
    if (filter === 'location') return items.filter((item) => item.scope === 'location')
    return items
  }, [items, filter])

  const selectedQr = useMemo(() => {
    return items.find((item) => item.id === selectedQrId) || null
  }, [items, selectedQrId])

  const copyText = async (text) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-full bg-[#f7f8fb] p-5 text-[#111827]">
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-violet-700">
            <QrCode className="h-3.5 w-3.5" />
            Online Store
          </div>
          <h1 className="m-0 text-2xl font-black tracking-tight">QR Store Management</h1>
          <p className="m-0 mt-1 max-w-2xl text-sm font-medium text-slate-500">
            Pantau QR yang sudah dibuat, status aktifnya, dan outlet mana saja yang terkoneksi ke QR tersebut.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={createScope}
            onChange={(event) => setCreateScope(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="universal">Universal QR</option>
            <option value="outlet">Outlet QR</option>
          </select>
          {createScope === 'outlet' && (
            <select
              value={createOutletId}
              onChange={(event) => setCreateOutletId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 outline-none focus:border-violet-300"
            >
              <option value="">Pilih Outlet</option>
              {outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
            </select>
          )}
          <button
            type="button"
            disabled={generating || (createScope === 'outlet' && !createOutletId)}
            onClick={createQr}
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {generating ? 'Generating...' : 'Generate QR Store'}
          </button>
          <button
            type="button"
            onClick={loadQrCodes}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total QR', summary.total, 'border-slate-200 bg-white text-slate-900'],
          ['Active QR', summary.active, 'border-emerald-100 bg-emerald-50 text-emerald-700'],
          ['Inactive QR', summary.inactive, 'border-slate-200 bg-slate-50 text-slate-500'],
          ['Connected Outlets', summary.connected_outlets, 'border-violet-100 bg-violet-50 text-violet-700'],
        ].map(([label, value, className]) => (
          <div key={label} className={`rounded-2xl border p-4 shadow-sm ${className}`}>
            <div className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</div>
            <div className="mt-1 text-2xl font-black">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['active', 'Active'],
          ['inactive', 'Inactive'],
          ['universal', 'Universal QR'],
          ['outlet', 'Outlet QR'],
          ['location', 'Location QR'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${filter === value ? 'border-violet-200 bg-violet-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_1.5fr_0.8fr] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
          <div>QR</div>
          <div>Type</div>
          <div>Status</div>
          <div>Connected Outlet</div>
          <div>Created</div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading QR Online Store...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <QrCode className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <div className="text-sm font-extrabold text-slate-700">Belum ada QR untuk filter ini.</div>
            <div className="mt-1 text-xs font-medium text-slate-400">QR yang sudah dibuat backend akan tampil di sini.</div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSelectedQrId(item.id); setDetailTab('qr') }}
              className={`grid w-full grid-cols-[1.4fr_0.9fr_0.8fr_1.5fr_0.8fr] gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-b-0 hover:bg-slate-50/60 ${selectedQrId === item.id ? 'bg-violet-50/50 ring-1 ring-inset ring-violet-100' : ''}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">{item.name || item.scope_label}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span className="truncate">{item.code || item.id}</span>
                      {(item.public_url || item.code) && (
                        <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); copyText(absoluteUrl(item.public_url) || item.code) }} onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); copyText(absoluteUrl(item.public_url) || item.code) } }} className="text-slate-400 hover:text-violet-700" title="Copy">
                          <Copy className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {item.public_url && (
                        <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); window.open(absoluteUrl(item.public_url), '_blank', 'noopener,noreferrer') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); window.open(absoluteUrl(item.public_url), '_blank', 'noopener,noreferrer') } }} className="text-slate-400 hover:text-violet-700" title="Open QR store">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${scopeTone(item.scope)}`}>
                  {item.scope_label || 'QR Store'}
                </span>
                {item.location?.label && <div className="mt-1 text-xs font-semibold text-slate-400">{item.location.label}</div>}
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusTone(item)}`}>
                  {item.is_active ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="mt-1 text-[11px] font-semibold text-slate-400">{item.active_sessions_count || 0} active session</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(item.outlets || []).length > 0 ? item.outlets.slice(0, 4).map((outlet) => (
                  <span key={outlet.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">
                    <Store className="h-3 w-3 text-slate-400" />
                    {outlet.name}
                  </span>
                )) : <span className="text-xs font-semibold text-slate-400">No outlet linked</span>}
                {(item.outlets || []).length > 4 && <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">+{item.outlets.length - 4}</span>}
              </div>
              <div className="text-xs font-bold text-slate-500">{formatDate(item.created_at)}</div>
            </button>
          ))
        )}
      </div>

      {selectedQr && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/20" onClick={() => setSelectedQrId(null)}>
          <aside className="h-full w-full max-w-[430px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">QR Detail</div>
                <h2 className="m-0 mt-1 text-lg font-black text-slate-900">{selectedQr.name || selectedQr.scope_label}</h2>
              </div>
              <button type="button" onClick={() => setSelectedQrId(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="sticky top-[73px] z-10 grid grid-cols-2 border-b border-slate-100 bg-white/95 px-5 backdrop-blur">
              {[
                ['qr', 'QR Settings'],
                ['store', 'Store Settings'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDetailTab(value)}
                  className={`border-b-2 px-2 py-3 text-sm font-black transition ${detailTab === value ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {detailTab === 'qr' ? (
            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 text-center">
                {selectedQr.public_url ? (
                  <img src={qrImageUrl(selectedQr.public_url)} alt={`QR ${selectedQr.name || selectedQr.code}`} className="mx-auto h-56 w-56 rounded-2xl border border-violet-100 bg-white p-2 shadow-sm" />
                ) : (
                  <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-white text-violet-300">
                    <QrCode className="h-16 w-16" />
                  </div>
                )}
                <div className="mt-3 text-xs font-bold text-violet-700">{selectedQr.code || selectedQr.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Wifi className="h-3.5 w-3.5" />
                    Status
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusTone(selectedQr)}`}>
                    {selectedQr.is_active ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {selectedQr.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <QrCode className="h-3.5 w-3.5" />
                    Type
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${scopeTone(selectedQr.scope)}`}>{selectedQr.scope_label}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <Link2 className="h-3.5 w-3.5" />
                  Target URL
                </div>
                {selectedQr.public_url ? (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    <span className="min-w-0 flex-1 truncate">{absoluteUrl(selectedQr.public_url)}</span>
                    <button type="button" onClick={() => copyText(absoluteUrl(selectedQr.public_url))} className="text-slate-400 hover:text-violet-700" title="Copy URL"><Copy className="h-4 w-4" /></button>
                    <a href={absoluteUrl(selectedQr.public_url)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-violet-700" title="Open URL"><ExternalLink className="h-4 w-4" /></a>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">URL publik belum tersimpan untuk QR lama ini.</div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Created
                </div>
                <div className="text-sm font-extrabold text-slate-700">{formatDateTime(selectedQr.created_at)}</div>
                {selectedQr.expires_at && <div className="mt-1 text-xs font-semibold text-slate-400">Expires: {formatDateTime(selectedQr.expires_at)}</div>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Store className="h-3.5 w-3.5" />
                    Allowed / Connected Outlets
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{selectedQr.outlets?.length || 0}</span>
                </div>
                {(selectedQr.outlets || []).length > 0 ? (
                  <div className="space-y-2">
                    {selectedQr.outlets.map((outlet) => (
                      <div key={outlet.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500"><Store className="h-4 w-4" /></div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-700">{outlet.name}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{outlet.id}</div>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">{outlet.status || 'active'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">Belum ada outlet yang terkoneksi.</div>
                )}
              </div>
            </div>
            ) : (
              <StoreSettingsPanel selectedQr={selectedQr} settings={storeSettings} onUploadAsset={uploadStoreAsset} onSaveSettings={saveStoreSettings} saving={savingSettings} uploadingAsset={uploadingAsset} />
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
