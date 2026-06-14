import React, { useState } from 'react'

export default function SecretField({ label, name, hasExistingValue, value, onChange, placeholder, helperText }) {
  const [editing, setEditing] = useState(!hasExistingValue)
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
        {label}
      </label>
      {editing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            type="password"
            name={name}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="new-password"
            style={{ flex: 1 }}
          />
          {hasExistingValue && (
            <button className="btn ghost" type="button" onClick={() => { onChange(null); setEditing(false) }}>
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            type="text"
            value="••••••••••••"
            readOnly
            style={{ flex: 1, color: 'var(--text-muted)', cursor: 'default' }}
            aria-label={`${label} - configured`}
          />
          <button className="btn ghost" type="button" onClick={() => setEditing(true)}>
            Change
          </button>
        </div>
      )}
      {helperText && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{helperText}</div>}
    </div>
  )
}
