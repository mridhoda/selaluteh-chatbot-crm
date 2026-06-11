import React from 'react'
import BrandIcon from './BrandIcon'

export default function PlatformPickerModal({ onClose, onPick }) {
  const items = [
    { type: 'whatsapp', label: 'WhatsApp' },
    { type: 'messenger', label: 'Messenger' },
    { type: 'instagram', label: 'Instagram' },
    { type: 'livechat', label: 'Web Livechat' },
    { type: 'telegram', label: 'Telegram' },
  ]

  return (
    <div className='modal'>
      <div className='modal-card' style={{ maxWidth: 760 }}>
        <div
          className='row'
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3 style={{ margin: 0 }}>Select your Platform</h3>
          <button className='btn ghost' onClick={onClose}>
            Close
          </button>
        </div>
        <p className='muted' style={{ marginTop: 8 }}>
          Select the platform you wish to establish your new inbox.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginTop: 8,
          }}
        >
          {items.map((it) => (
            <button
              key={it.type}
              className='card'
              style={{
                padding: 20,
                textAlign: 'center',
                borderRadius: 16,
                cursor: 'pointer',
              }}
              onClick={() => onPick?.(it.type)}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto 14px',
                  borderRadius: 18,
                  background: '#fafafa',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <BrandIcon type={it.type} size={44} />
              </div>
              <div style={{ fontWeight: 600 }}>{it.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
