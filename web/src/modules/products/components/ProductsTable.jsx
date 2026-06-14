import React from 'react'
import { Edit2, Archive, RotateCcw } from 'lucide-react'
import { ProductStatusBadge, ProductAvailabilityBadge } from './ProductStatusBadge'
import EmptyState from '../../../shared/components/ui/EmptyState'

function formatRupiah(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}

function SkeletonRow() {
  return (
    <tr>
      {[160, 90, 100, 90, 80, 80, 64].map((w, i) => (
        <td key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              height: 14,
              width: w,
              background: 'var(--surface-secondary)',
              borderRadius: 4,
              animation: 'pulse 1.4s ease infinite',
            }}
          />
        </td>
      ))}
    </tr>
  )
}

function getAvailabilityCell(product, selectedOutletId) {
  if (!selectedOutletId || selectedOutletId === 'all') {
    const outlets = product.outlets || []
    if (outlets.length > 0) {
      const available = outlets.filter((o) => o.availability === 'available').length
      return (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {available}/{outlets.length} outlets
        </span>
      )
    }
    const status = product.availabilityStatus || product.availability
    if (status) return <ProductAvailabilityBadge status={status} />
    return <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
  }

  const outletData = (product.outlets || []).find(
    (o) => (o.outletId || o._id || o.id) === selectedOutletId
  )
  if (outletData) return <ProductAvailabilityBadge status={outletData.availability} />
  return <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
}

const thStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '10px 14px',
  textAlign: 'left',
  borderBottom: '2px solid var(--border-subtle)',
  whiteSpace: 'nowrap',
  background: 'var(--surface-secondary)',
}

const tdStyle = {
  padding: '11px 14px',
  fontSize: 13,
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border-subtle)',
  verticalAlign: 'middle',
}

export default function ProductsTable({
  products = [],
  isLoading,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  selectedOutletId,
}) {
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .products-row:hover { background: var(--surface-secondary) !important; }
      `}</style>
      <div
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Availability</th>
                <th style={thStyle}>Base Price</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Updated</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                    <EmptyState
                      icon="📦"
                      title="No products found"
                      description="Try adjusting your filters, or add your first product to get started."
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id || product.id}
                    className="products-row"
                    style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => onSelect(product)}
                  >
                    {/* Product name + image */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              objectFit: 'cover',
                              border: '1px solid var(--border-subtle)',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              background: 'var(--surface-tertiary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              flexShrink: 0,
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            📦
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 200,
                            }}
                          >
                            {product.name}
                          </div>
                          {product.sku && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={tdStyle}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {product.category || '—'}
                      </span>
                    </td>

                    {/* Availability */}
                    <td style={tdStyle}>{getAvailabilityCell(product, selectedOutletId)}</td>

                    {/* Base price */}
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>
                        {product.basePrice != null ? formatRupiah(product.basePrice) : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <ProductStatusBadge status={product.status} />
                    </td>

                    {/* Updated at */}
                    <td style={tdStyle}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {product.updatedAt
                          ? new Date(product.updatedAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      style={{ ...tdStyle, textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          className="btn ghost"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => onEdit(product)}
                          title="Edit product"
                        >
                          <Edit2 size={13} />
                        </button>
                        {product.status === 'archived' ? (
                          <button
                            className="btn ghost"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => onRestore(product)}
                            title="Restore product"
                          >
                            <RotateCcw size={13} />
                          </button>
                        ) : (
                          <button
                            className="btn ghost"
                            style={{
                              padding: '4px 8px',
                              fontSize: 12,
                              color: 'var(--danger-500)',
                            }}
                            onClick={() => onArchive(product)}
                            title="Archive product"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
