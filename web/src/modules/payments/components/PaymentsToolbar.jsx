import React from 'react'
import { Search } from 'lucide-react'

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'expired', label: 'Expired' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PROVIDERS = [
  { value: '', label: 'All Providers' },
  { value: 'midtrans', label: 'Midtrans' },
  { value: 'xendit', label: 'Xendit' },
]

const CHANNELS = [
  { value: '', label: 'All Channels' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'web', label: 'Web' },
  { value: 'pos', label: 'POS' },
  { value: 'instagram', label: 'Instagram' },
]

export default function PaymentsToolbar({ filters, onChange }) {
  const set = (field, value) =>
    onChange((prev) => ({ ...prev, [field]: value }))

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 12,
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', flex: '1 1 200px' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          className='input'
          style={{ paddingLeft: 30, width: '100%' }}
          placeholder='Search by payment ID, order, customer…'
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>
      <select
        className='input'
        style={{ flex: '0 0 auto', minWidth: 130 }}
        value={filters.outlet}
        onChange={(e) => set('outlet', e.target.value)}
      >
        <option value='all'>All Outlets</option>
      </select>
      <select
        className='input'
        style={{ flex: '0 0 auto', minWidth: 140 }}
        value={filters.status}
        onChange={(e) => set('status', e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        className='input'
        style={{ flex: '0 0 auto', minWidth: 130 }}
        value={filters.provider}
        onChange={(e) => set('provider', e.target.value)}
      >
        {PROVIDERS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        className='input'
        style={{ flex: '0 0 auto', minWidth: 130 }}
        value={filters.channel}
        onChange={(e) => set('channel', e.target.value)}
      >
        {CHANNELS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        className='input'
        type='date'
        style={{ flex: '0 0 auto', minWidth: 130 }}
        value={filters.dateFrom}
        onChange={(e) => set('dateFrom', e.target.value)}
        title='Date from'
      />
      <input
        className='input'
        type='date'
        style={{ flex: '0 0 auto', minWidth: 130 }}
        value={filters.dateTo}
        onChange={(e) => set('dateTo', e.target.value)}
        title='Date to'
      />
    </div>
  )
}
