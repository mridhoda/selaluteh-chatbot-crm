import React from 'react'

export default function ProductsToolbar({ filters, onChange, outlets = [] }) {
  const update = (key, value) =>
    onChange((prev) => ({ ...prev, [key]: value }))

  const selectStyle = {
    fontSize: 13,
    padding: '7px 10px',
    height: 34,
    boxSizing: 'border-box',
  }
  const inputStyle = {
    fontSize: 13,
    padding: '7px 10px',
    height: 34,
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        alignItems: 'center',
      }}
    >
      {/* Outlet filter */}
      <select
        className="input"
        value={filters.outlet || 'all'}
        onChange={(e) => update('outlet', e.target.value)}
        style={{ ...selectStyle, minWidth: 148 }}
        aria-label="Filter by outlet"
      >
        <option value="all">All Outlets</option>
        {outlets.map((o) => (
          <option key={o._id || o.id} value={o._id || o.id}>
            {o.name}
          </option>
        ))}
      </select>

      {/* Category filter */}
      <input
        className="input"
        type="text"
        placeholder="Category…"
        value={filters.category || ''}
        onChange={(e) => update('category', e.target.value)}
        style={{ ...inputStyle, minWidth: 128 }}
        aria-label="Filter by category"
      />

      {/* Status filter */}
      <select
        className="input"
        value={filters.status || ''}
        onChange={(e) => update('status', e.target.value)}
        style={{ ...selectStyle, minWidth: 136 }}
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>

      {/* Availability filter */}
      <select
        className="input"
        value={filters.availability || ''}
        onChange={(e) => update('availability', e.target.value)}
        style={{ ...selectStyle, minWidth: 156 }}
        aria-label="Filter by availability"
      >
        <option value="">All Availability</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
        <option value="out_of_stock">Out of Stock</option>
        <option value="partial">Partial</option>
      </select>

      {/* Search */}
      <input
        className="input"
        type="search"
        placeholder="Search products…"
        value={filters.search || ''}
        onChange={(e) => update('search', e.target.value)}
        style={{ ...inputStyle, minWidth: 180, flex: 1 }}
        aria-label="Search products"
      />
    </div>
  )
}
