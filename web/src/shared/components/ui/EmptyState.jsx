import React from 'react'

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'var(--surface-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--text-muted)',
            fontSize: 24,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: 340,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button className='btn' onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
