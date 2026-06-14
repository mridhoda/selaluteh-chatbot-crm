import React from 'react'
import StatusBadge from '../../../shared/components/ui/StatusBadge'

export function ProductStatusBadge({ status }) {
  return <StatusBadge domain="product" status={status} />
}

export function ProductAvailabilityBadge({ status }) {
  return <StatusBadge domain="product_availability" status={status} />
}
