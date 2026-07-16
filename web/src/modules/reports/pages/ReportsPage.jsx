import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronDown, Download, FileSpreadsheet, Filter, Plus, RefreshCw, Settings2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../../../shared/api/httpClient'
import { REPORT_DIMENSIONS, REPORT_METRICS, buildReportRows, buildReportSummary, getDimensionLabel, getMetricLabel } from '../reportModel'

const initialStart = () => { const date = new Date(); date.setDate(date.getDate() - 30); return date.toISOString().slice(0, 10) }
const today = () => new Date().toISOString().slice(0, 10)
const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

function MultiSelect({ label, items, selected, onToggle, onRemove, emptyLabel }) {
  const [open, setOpen] = useState(false)
  return <div className="relative min-w-0">
    <div className="flex items-center gap-2 flex-wrap">
      {selected.map((id) => <button key={id} type="button" onClick={() => onRemove(id)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700">{items.find((item) => item.id === id)?.label || id}<X size={12} /></button>)}
      <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:border-indigo-400"><Plus size={14} />{label}<ChevronDown size={14} /></button>
    </div>
    {open && <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
      {items.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-slate-50 ${selected.includes(item.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}><span>{item.label}</span>{selected.includes(item.id) && <span>✓</span>}</button>)}
      {!items.length && <p className="px-3 py-2 text-xs text-slate-400">{emptyLabel}</p>}
    </div>}
  </div>
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(today)
  const [preset, setPreset] = useState('30days')
  const [selectedOutlet, setSelectedOutlet] = useState('all')
  const [outlets, setOutlets] = useState([])
  const [dimensions, setDimensions] = useState(['outlet'])
  const [metrics, setMetrics] = useState(['revenue', 'orders'])
  const [summary, setSummary] = useState({ orderCount: 0, paidCount: 0, pendingCount: 0, cancelledCount: 0, grossSales: 0 })
  const [outletRows, setOutletRows] = useState([])
  const [productRows, setProductRows] = useState([])
  const [channelRows, setChannelRows] = useState([])
  const [genericRows, setGenericRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const activeDimension = dimensions[0] || 'outlet'
  const dimensionKey = dimensions.join(',')

  const applyPreset = (value) => {
    setPreset(value)
    const end = today()
    const start = new Date()
    if (value === 'today') start.setDate(start.getDate())
    if (value === '7days') start.setDate(start.getDate() - 7)
    if (value === '30days') start.setDate(start.getDate() - 30)
    if (value === 'month') start.setDate(1)
    if (value !== 'custom') { setStartDate(start.toISOString().slice(0, 10)); setEndDate(end) }
  }

  useEffect(() => { api.get('/outlets').then((res) => setOutlets(res.data?.data || res.data || [])).catch(() => setOutlets([])) }, [])

  const fetchReport = useCallback(async () => {
    setLoading(true); setError('')
    const params = { startDate: new Date(`${startDate}T00:00:00`).toISOString(), endDate: new Date(`${endDate}T23:59:59`).toISOString(), outletId: selectedOutlet === 'all' ? undefined : selectedOutlet }
    try {
      const [summaryRes, outletRes, productRes, channelRes, dimensionRes] = await Promise.all([
        api.get('/analytics/summary', { params }), api.get('/analytics/outlets', { params }), api.get('/analytics/products', { params }), api.get('/analytics/channels', { params }), api.get('/analytics/dimension', { params: { ...params, dimensions: dimensionKey } }),
      ])
      setSummary(summaryRes.data?.data || {})
      setOutletRows(outletRes.data?.data || [])
      setProductRows(productRes.data?.data || [])
      setChannelRows(channelRes.data?.data || [])
      setGenericRows(dimensionRes.data?.data || [])
    } catch (err) { console.error('Failed to load report:', err); setError('Laporan gagal dimuat. Periksa koneksi atau filter tanggal.') }
    finally { setLoading(false) }
  }, [startDate, endDate, selectedOutlet, dimensionKey])

  useEffect(() => { fetchReport() }, [fetchReport])

  const rows = useMemo(() => buildReportRows({ dimension: activeDimension, dimensions, metrics, outlets, outletRows, productRows, channelRows, genericRows }), [activeDimension, dimensions, metrics, outlets, outletRows, productRows, channelRows, genericRows])
  const totals = useMemo(() => buildReportSummary(rows, metrics), [rows, metrics])

  const toggle = (setter) => (id) => setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const exportReport = () => {
    const data = rows.map((row) => Object.fromEntries([...dimensions.map((dimension) => [getDimensionLabel(dimension), row.dimensions?.[dimension] || row.label]), ...metrics.map((metric) => [getMetricLabel(metric), metric === 'revenue' || metric === 'averageOrder' ? rupiah(row[metric]) : row[metric]])]))
    const sheet = XLSX.utils.json_to_sheet(data)
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Laporan')
    XLSX.writeFile(book, `laporan-${activeDimension}-${startDate}-${endDate}.xlsx`)
  }

  const dimensionHeaders = dimensions.map((dimension) => <th key={dimension} className="px-5 py-3 text-left font-black">{getDimensionLabel(dimension)}</th>)
  return <div className="min-h-full space-y-5 bg-slate-50 p-5 text-left">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><span className="rounded-xl bg-indigo-100 p-2 text-indigo-600"><FileSpreadsheet size={20} /></span><h1 className="text-xl font-black text-slate-900">Buat Laporan</h1></div><p className="mt-1 text-xs font-medium text-slate-500">Pilih dimensi dan metrik untuk melihat laporan penjualan yang Anda butuhkan.</p></div>
      <div className="flex gap-2"><button type="button" onClick={exportReport} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"><Download size={15} />Ekspor Excel</button><button type="button" onClick={fetchReport} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></div>
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-black text-slate-900">Pengaturan laporan</h2><p className="mt-0.5 text-xs text-slate-400">Atur periode, dimensi, dan kolom yang ingin ditampilkan.</p></div><Settings2 size={18} className="text-slate-400" /></div>
      <div className="grid gap-5 p-5 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div><label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Periode</label><div className="flex flex-wrap gap-2"><select value={preset} onChange={(e) => applyPreset(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none"><option value="today">Hari ini</option><option value="7days">7 hari terakhir</option><option value="30days">30 hari terakhir</option><option value="month">Bulan ini</option><option value="custom">Custom</option></select><div className="flex items-center gap-2"><Calendar size={15} className="text-slate-400" /><input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPreset('custom') }} className="h-10 rounded-xl border border-slate-200 px-2 text-xs font-bold" /><span className="text-xs text-slate-400">s/d</span><input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPreset('custom') }} className="h-10 rounded-xl border border-slate-200 px-2 text-xs font-bold" /></div></div></div>
        <div><label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Outlet</label><select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none"><option value="all">Semua outlet</option>{outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}</select></div>
        <div><label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Mode laporan</label><div className="flex h-10 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-xs font-bold text-indigo-700"><Filter size={14} />Penjualan terealisasi / paid</div></div>
      </div>
       <div className="border-t border-slate-100 px-5 py-4"><label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Dimensi</label><div className="flex flex-wrap items-center gap-2"><MultiSelect label="Tambah Dimensi" items={REPORT_DIMENSIONS} selected={dimensions} onToggle={toggle(setDimensions)} onRemove={(id) => setDimensions((current) => current.filter((item) => item !== id))} />{dimensions.length > 1 && <span className="text-[11px] text-slate-400">Preview menggunakan semua dimensi terpilih.</span>}</div></div>
      <div className="border-t border-slate-100 px-5 py-4"><label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Metrik</label><div className="flex flex-wrap items-center gap-2"><MultiSelect label="Tambah Metric" items={REPORT_METRICS} selected={metrics} onToggle={toggle(setMetrics)} onRemove={(id) => setMetrics((current) => current.filter((item) => item !== id))} /></div></div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-400">Pendapatan paid</p><p className="mt-1 text-lg font-black text-slate-900">{rupiah(summary.grossSales)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-400">Pesanan</p><p className="mt-1 text-lg font-black text-slate-900">{summary.orderCount || 0}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-400">Paid</p><p className="mt-1 text-lg font-black text-emerald-600">{summary.paidCount || 0}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-bold text-slate-400">Pending</p><p className="mt-1 text-lg font-black text-amber-600">{summary.pendingCount || 0}</p></div></section>

     <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-black text-slate-900">Preview laporan</h2><p className="mt-0.5 text-xs text-slate-400">{dimensions.map(getDimensionLabel).join(' + ')} · {startDate} sampai {endDate}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{rows.length} baris</span></div>{error ? <div className="p-10 text-center text-sm font-semibold text-rose-500">{error}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{dimensionHeaders}{metrics.map((metric) => <th key={metric} className="px-5 py-3 text-right font-black">{getMetricLabel(metric)}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={metrics.length + dimensions.length} className="px-5 py-12 text-center font-semibold text-slate-400">Memuat laporan...</td></tr> : rows.length ? rows.map((row) => <tr key={row.key} className="hover:bg-slate-50">{dimensions.map((dimension) => <td key={dimension} className="px-5 py-3 font-bold text-slate-800">{row.dimensions?.[dimension] || row.label}</td>)}{metrics.map((metric) => <td key={metric} className="px-5 py-3 text-right font-semibold text-slate-700">{metric === 'revenue' || metric === 'averageOrder' ? rupiah(row[metric]) : Number(row[metric] || 0).toLocaleString('id-ID')}</td>)}</tr>) : <tr><td colSpan={metrics.length + dimensions.length} className="px-5 py-12 text-center font-semibold text-slate-400">Belum ada data pada periode dan filter ini.</td></tr>}</tbody>{rows.length > 0 && <tfoot className="border-t-2 border-slate-200 bg-slate-50"><tr><td colSpan={dimensions.length} className="px-5 py-3 font-black text-slate-900">Total</td>{metrics.map((metric) => <td key={metric} className="px-5 py-3 text-right font-black text-slate-900">{metric === 'revenue' || metric === 'averageOrder' ? rupiah(totals[metric]) : Number(totals[metric] || 0).toLocaleString('id-ID')}</td>)}</tr></tfoot>}</table></div>}</section>
  </div>
}
