import React from 'react'
import StatusBadge from '../../../shared/components/ui/StatusBadge'

export default function WebhookHealthBadge({ health }) {
  return <StatusBadge domain='webhook' status={health} />
}
