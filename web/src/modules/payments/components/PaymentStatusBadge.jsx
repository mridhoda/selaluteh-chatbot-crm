import React from 'react'
import StatusBadge from '../../../shared/components/ui/StatusBadge'
export default function PaymentStatusBadge({ status }) {
  return <StatusBadge domain='payment' status={status} />
}
