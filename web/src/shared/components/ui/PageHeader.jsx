import React from 'react'
import { RefreshCw } from 'lucide-react'

export default function PageHeader({
  title,
  description,
  subtitle, // fallback / alternative
  primaryAction,
  secondaryActions = [],
  lastUpdated,
  isRefreshing,
  onRefresh,
  actions, // custom buttons div
}) {
  const displayDescription = description || subtitle

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {displayDescription && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            {displayDescription}
          </p>
        )}
        {(lastUpdated || onRefresh) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
            }}
          >
            {lastUpdated && (
              <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                Updated {lastUpdated}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title='Refresh'
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 2,
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                  opacity: isRefreshing ? 0.6 : 1,
                }}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: isRefreshing
                      ? 'spin 1s linear infinite'
                      : 'none',
                  }}
                />
              </button>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {actions ? (
          actions
        ) : (
          <>
            {secondaryActions.map((action, i) => (
              <button
                key={i}
                className='btn ghost'
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </button>
            ))}
            {primaryAction && (
              <button
                className='btn'
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
