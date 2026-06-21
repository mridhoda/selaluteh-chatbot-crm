import { Coordinate } from './coordinate.js';
import { LocationError, LocationErrorCode } from './errors.js';

export function normalizeSharedCoordinates(payload) {
  if (!payload || typeof payload.latitude !== 'number' || typeof payload.longitude !== 'number') {
    throw new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Missing or invalid coordinates', 400);
  }

  const coord = new Coordinate(payload.latitude, payload.longitude);

  return {
    type: 'shared_coordinates',
    latitude: coord.latitude,
    longitude: coord.longitude,
    platform: payload.platform || 'unknown',
    messageId: payload.messageId || null,
  };
}
