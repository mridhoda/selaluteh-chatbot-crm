import { useCallback, useEffect, useState } from 'react'
import { findNearestOutlet, formatDistance } from '../utils/outletLocation'

export function useNearestOutletRecommendation(outlets = [], enabled = true, storageKey = 'default') {
  const dismissedKey = `public-store-location-recommendation-dismissed:${storageKey}`
  const [recommendation, setRecommendation] = useState(null)
  const [status, setStatus] = useState('idle')
  const hasLocatedOutlet = outlets.some((outlet) => Number.isFinite(Number(outlet.latitude)) && Number.isFinite(Number(outlet.longitude)))
  const outletCount = outlets.length

  const locate = useCallback(() => {
    if (!enabled || !hasLocatedOutlet || outletCount < 2 || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = findNearestOutlet(coords, outlets)
        if (nearest) setRecommendation({ ...nearest, distanceLabel: formatDistance(nearest.distanceMeters) })
        setStatus(nearest ? 'ready' : 'no-coordinate')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    )
  }, [enabled, hasLocatedOutlet, outletCount, outlets])

  useEffect(() => {
    if (!enabled || !hasLocatedOutlet || outletCount < 2 || sessionStorage.getItem(dismissedKey)) return
    locate()
  }, [dismissedKey, enabled, hasLocatedOutlet, locate, outletCount])

  const dismiss = useCallback(() => {
    sessionStorage.setItem(dismissedKey, '1')
    setRecommendation(null)
  }, [dismissedKey])

  return { recommendation, status, dismiss, locate }
}
