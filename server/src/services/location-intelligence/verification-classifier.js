import { haversineDistance } from './haversine.js';

export const COORDINATE_CHANGE_THRESHOLD_METERS = 50;

export function classifyCoordinateChange(oldLat, oldLng, newLat, newLng, thresholdMeters = COORDINATE_CHANGE_THRESHOLD_METERS) {
  const distance = haversineDistance(oldLat, oldLng, newLat, newLng);

  if (distance <= thresholdMeters) {
    return 'minor_drift';
  }

  return 'needs_review';
}
