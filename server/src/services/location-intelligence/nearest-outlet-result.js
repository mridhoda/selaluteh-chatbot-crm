import { LocationError, LocationErrorCode } from './errors.js';
import { Coordinate } from './coordinate.js';

export function createNearestOutletResult(fields) {
  if (fields.approximateDistanceMeters != null && fields.approximateDistanceMeters < 0) {
    throw new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Distance cannot be negative', 400);
  }

  if (fields.travelDurationSeconds != null && (!fields.calculationMethod || fields.calculationMethod === 'HAVERSINE')) {
    throw new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Haversine cannot include travel duration', 400);
  }

  return {
    outletId: fields.outletId,
    name: fields.name,
    formattedAddress: fields.formattedAddress,
    approximateDistanceMeters: fields.approximateDistanceMeters,
    openingStatus: fields.openingStatus || 'unknown',
    nextOpeningAt: fields.nextOpeningAt || null,
    googleMapsUrl: fields.googleMapsUrl,
    withinServiceRadius: fields.withinServiceRadius !== undefined ? fields.withinServiceRadius : true,
    rankReason: fields.rankReason || 'nearest_absolute',
  };
}

export function isValidNearestOutletResult(result) {
  if (!result) return false;
  if (!result.outletId) return false;
  if (typeof result.approximateDistanceMeters !== 'number' || result.approximateDistanceMeters < 0) return false;
  if (!result.name) return false;
  if (!result.googleMapsUrl) return false;
  return true;
}
