import React from 'react'
import { Settings, ShoppingCart, CreditCard, Bell, Shield, Palette } from 'lucide-react'

const SECTIONS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'commerce', label: 'Commerce', icon: ShoppingCart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function SettingsNavigation({ activeSection, onSelect }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              background: active ? 'var(--surface-secondary)' : 'transparent',
              border: 'none',
              borderLeft: active ? '3px solid var(--brand-500)' : '3px solid transparent',
              borderRadius: active ? '0 6px 6px 0' : '6px',
              cursor: 'pointer',
              color: active ? 'var(--brand-500)' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400,
              fontSize: 14,
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
