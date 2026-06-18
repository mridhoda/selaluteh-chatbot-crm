import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTelegram,
  faWhatsapp,
  faFacebookMessenger,
  faInstagram,
  faFacebook,
} from '@fortawesome/free-brands-svg-icons'
import { faComment, faBox } from '@fortawesome/free-solid-svg-icons'

export default function BrandIcon({ type = 'custom', size = 20, color }) {
  const s = { width: size, height: size, display: 'inline-block' }

  const map = {
    telegram: (
      <FontAwesomeIcon icon={faTelegram} style={{ ...s, color: color || '#26A5E4' }} />
    ),
    whatsapp: (
      <FontAwesomeIcon icon={faWhatsapp} style={{ ...s, color: color || '#25D366' }} />
    ),
    messenger: (
      <FontAwesomeIcon
        icon={faFacebookMessenger}
        style={{ ...s, color: color || '#0084FF' }}
      />
    ),
    instagram: (
      <FontAwesomeIcon icon={faInstagram} style={{ ...s, color: color || '#E1306C' }} />
    ),
    facebook: (
      <FontAwesomeIcon icon={faFacebook} style={{ ...s, color: color || '#1877F2' }} />
    ),
    livechat: (
      <FontAwesomeIcon icon={faComment} style={{ ...s, color: color || '#9b9ca1' }} />
    ),
    custom: <FontAwesomeIcon icon={faBox} style={{ ...s, color: color || '#a1a1aa' }} />,
  }

  return map[type] || map.custom
}
