import React from 'react'
import { Edit2 } from 'lucide-react'
import DetailDrawer from '../../../shared/components/ui/DetailDrawer'
import { ProductStatusBadge, ProductAvailabilityBadge } from './ProductStatusBadge'

function formatRupiah(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '7px 0',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          flexShrink: 0,
          minWidth: 110,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          textAlign: 'right',
          lineHeight: 1.5,
        }}
      >
        {children}
      </span>
    </div>
  )
}

export default function ProductDetailDrawer({ product, open, onClose, onEdit }) {
  if (!product) return null

  const footer = (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className="btn"
        onClick={() => { onClose(); onEdit(product) }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Edit2 size={14} />
        Edit Product
      </button>
    </div>
  )

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={product.name}
      subtitle={product.sku ? `SKU: ${product.sku}` : undefined}
      badge={<ProductStatusBadge status={product.status} />}
      footer={footer}
    >
      {/* Product image */}
      {product.imageUrl && (
        <div style={{ marginBottom: 20 }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              width: '100%',
              maxHeight: 200,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          />
        </div>
      )}

      {/* Overview */}
      <Section title="Overview">
        {product.description && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: '0 0 12px',
            }}
          >
            {product.description}
          </p>
        )}
        <InfoRow label="Category">{product.category || '—'}</InfoRow>
        <InfoRow label="Status">
          <ProductStatusBadge status={product.status} />
        </InfoRow>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <InfoRow label="Base Price">
          <strong>
            {product.basePrice != null ? formatRupiah(product.basePrice) : '—'}
          </strong>
        </InfoRow>
        {product.compareAtPrice != null && (
          <InfoRow label="Compare-at Price">
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
              {formatRupiah(product.compareAtPrice)}
            </span>
          </InfoRow>
        )}
      </Section>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <Section title={`Variants (${product.variants.length})`}>
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {product.variants.map((v, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderBottom:
                    i < product.variants.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{v.name}</span>
                <span style={{ fontWeight: 500 }}>
                  {v.price != null ? formatRupiah(v.price) : '—'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Outlet availability */}
      {product.outlets && product.outlets.length > 0 && (
        <Section title="Outlet Availability">
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-secondary)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    Outlet
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '8px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    Price Override
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.outlets.map((o, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        padding: '9px 12px',
                        borderBottom:
                          i < product.outlets.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {o.outletName || o.name || `Outlet ${i + 1}`}
                    </td>
                    <td
                      style={{
                        padding: '9px 12px',
                        borderBottom:
                          i < product.outlets.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        textAlign: 'center',
                      }}
                    >
                      <ProductAvailabilityBadge status={o.availability} />
                    </td>
                    <td
                      style={{
                        padding: '9px 12px',
                        borderBottom:
                          i < product.outlets.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        textAlign: 'right',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {o.priceOverride != null ? formatRupiah(o.priceOverride) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Record info */}
      <Section title="Record Info">
        <InfoRow label="Created">
          {product.createdAt
            ? new Date(product.createdAt).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </InfoRow>
        <InfoRow label="Last Updated">
          {product.updatedAt
            ? new Date(product.updatedAt).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </InfoRow>
      </Section>
    </DetailDrawer>
  )
}
