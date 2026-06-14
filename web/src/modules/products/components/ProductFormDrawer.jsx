import React, { useState, useEffect, useCallback } from 'react'
import DetailDrawer from '../../../shared/components/ui/DetailDrawer'

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  sku: '',
  status: 'draft',
  basePrice: '',
  compareAtPrice: '',
  outlets: [],
}

export default function ProductFormDrawer({ open, onClose, product, onSave, outlets = [] }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!open) return

    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        sku: product.sku || '',
        status: product.status || 'draft',
        basePrice: product.basePrice != null ? String(product.basePrice) : '',
        compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
        outlets: outlets.map((o) => {
          const existing = (product.outlets || []).find(
            (po) =>
              (po.outletId || po._id || po.id) === (o._id || o.id)
          )
          return {
            outletId: o._id || o.id,
            outletName: o.name,
            availability: existing?.availability || 'available',
            priceOverride:
              existing?.priceOverride != null ? String(existing.priceOverride) : '',
          }
        }),
      })
    } else {
      setForm({
        ...EMPTY_FORM,
        outlets: outlets.map((o) => ({
          outletId: o._id || o.id,
          outletName: o.name,
          availability: 'available',
          priceOverride: '',
        })),
      })
    }
    setErrors({})
  }, [open, product, outlets])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const updateOutlet = useCallback((idx, key, value) => {
    setForm((prev) => {
      const updated = [...prev.outlets]
      updated[idx] = { ...updated[idx], [key]: value }
      return { ...prev, outlets: updated }
    })
  }, [])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.category.trim()) errs.category = 'Category is required'
    if (!form.basePrice || isNaN(parseFloat(form.basePrice)) || parseFloat(form.basePrice) < 0) {
      errs.basePrice = 'A valid base price is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsPending(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        sku: form.sku.trim(),
        status: form.status,
        basePrice: parseFloat(form.basePrice),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        outlets: form.outlets.map((o) => ({
          outletId: o.outletId,
          availability: o.availability,
          priceOverride: o.priceOverride ? parseFloat(o.priceOverride) : undefined,
        })),
      }
      await onSave(payload)
    } finally {
      setIsPending(false)
    }
  }

  const label = (text, required) => (
    <label
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 4,
      }}
    >
      {text}
      {required && (
        <span style={{ color: 'var(--danger-500)', marginLeft: 2 }}>*</span>
      )}
    </label>
  )

  const sectionTitle = (text) => (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.7px',
        marginBottom: 12,
        paddingBottom: 6,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {text}
    </div>
  )

  const field = (children, error) => (
    <div style={{ marginBottom: 14 }}>
      {children}
      {error && (
        <div style={{ fontSize: 11, color: 'var(--danger-500)', marginTop: 3 }}>{error}</div>
      )}
    </div>
  )

  const inputProps = {
    className: 'input',
    style: { width: '100%', boxSizing: 'border-box', fontSize: 13 },
  }

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      <button className="btn ghost" onClick={onClose} disabled={isPending}>
        Cancel
      </button>
      <button
        className="btn"
        onClick={handleSubmit}
        disabled={isPending}
        style={{ minWidth: 110 }}
      >
        {isPending ? 'Saving…' : product ? 'Save Changes' : 'Create Product'}
      </button>
    </div>
  )

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add Product'}
      subtitle={product ? `Editing ${product.name}` : 'Fill in the details below'}
      width={600}
      footer={footer}
    >
      {/* Section A: Basic */}
      <div style={{ marginBottom: 24 }}>
        {sectionTitle('A. Basic Information')}

        {field(
          <>
            {label('Name', true)}
            <input
              {...inputProps}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Nasi Goreng Spesial"
            />
          </>,
          errors.name
        )}

        {field(
          <>
            {label('Description')}
            <textarea
              {...inputProps}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional product description"
              rows={3}
              style={{ ...inputProps.style, resize: 'vertical', minHeight: 72 }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            {field(
              <>
                {label('Category', true)}
                <input
                  {...inputProps}
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="e.g. Makanan, Minuman"
                />
              </>,
              errors.category
            )}
          </div>
          <div style={{ flex: 1 }}>
            {field(
              <>
                {label('SKU')}
                <input
                  {...inputProps}
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value)}
                  placeholder="Optional"
                />
              </>
            )}
          </div>
        </div>

        {field(
          <>
            {label('Status')}
            <select
              {...inputProps}
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </>
        )}
      </div>

      {/* Section B: Pricing */}
      <div style={{ marginBottom: 24 }}>
        {sectionTitle('B. Pricing')}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            {field(
              <>
                {label('Base Price (IDR)', true)}
                <input
                  {...inputProps}
                  type="number"
                  min="0"
                  step="500"
                  value={form.basePrice}
                  onChange={(e) => set('basePrice', e.target.value)}
                  placeholder="e.g. 25000"
                />
              </>,
              errors.basePrice
            )}
          </div>
          <div style={{ flex: 1 }}>
            {field(
              <>
                {label('Compare-at Price (IDR)')}
                <input
                  {...inputProps}
                  type="number"
                  min="0"
                  step="500"
                  value={form.compareAtPrice}
                  onChange={(e) => set('compareAtPrice', e.target.value)}
                  placeholder="Optional (strikethrough price)"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section C: Outlet availability */}
      {form.outlets.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {sectionTitle(`C. Outlet Availability (${form.outlets.length} outlets)`)}
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
                    Available
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
                    Price Override (IDR)
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.outlets.map((o, i) => (
                  <tr key={o.outletId || i}>
                    <td
                      style={{
                        padding: '10px 12px',
                        borderBottom:
                          i < form.outlets.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {o.outletName}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        borderBottom:
                          i < form.outlets.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        textAlign: 'center',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={o.availability === 'available'}
                        onChange={(e) =>
                          updateOutlet(
                            i,
                            'availability',
                            e.target.checked ? 'available' : 'unavailable'
                          )
                        }
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--brand-500)' }}
                      />
                    </td>
                    <td
                      style={{
                        padding: '6px 12px',
                        borderBottom:
                          i < form.outlets.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                      }}
                    >
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="500"
                        value={o.priceOverride}
                        onChange={(e) => updateOutlet(i, 'priceOverride', e.target.value)}
                        placeholder="Same as base"
                        style={{ width: '100%', fontSize: 12, textAlign: 'right', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 6 }}>
            Leave price override blank to use the base price at that outlet.
          </div>
        </div>
      )}
    </DetailDrawer>
  )
}
