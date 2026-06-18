import React from 'react'
import StatusBadge from '../../../shared/components/ui/StatusBadge'

export default function PlatformStatusBadge({ status }) {
  return <StatusBadge domain="platform" status={status} />
}
