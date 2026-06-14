import React from 'react'
import { X } from 'lucide-react'

export default function ActiveFilterChips({ filters, onRemove, onClearAll }) {
  if (!filters || filters.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        Active filters:
      </span>

      {filters.map((f) => (
        <span
          key={f.key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 6px 3px 9px',
            borderRadius: 20,
            background: 'var(--surface-secondary)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {f.label}
          <button
            onClick={() => onRemove(f.key)}
            aria-label={`Remove ${f.label} filter`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
              lineHeight: 0,
            }}
          >
            <X size={10} />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          color: 'var(--brand-500)',
          fontWeight: 500,
          padding: '2px 4px',
          whiteSpace: 'nowrap',
        }}
      >
        Clear all
      </button>
    </div>
  )
}
