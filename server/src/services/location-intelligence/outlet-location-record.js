import { Coordinate } from './coordinate.js';
import { LocationError, LocationErrorCode } from './errors.js';

export function createOutletLocationRecord(fields) {
  const coord = new Coordinate(fields.latitude, fields.longitude);

  const record = {
    outletId: fields.outletId,
    workspaceId: fields.workspaceId,
    provider: fields.provider || 'google',
    providerPlaceId: fields.providerPlaceId,
    sourceUrl: fields.sourceUrl,
    googleMapsUri: fields.googleMapsUri,
    displayName: fields.displayName,
    formattedAddress: fields.formattedAddress,
    city: fields.city,
    province: fields.province,
    countryCode: fields.countryCode || 'ID',
    postalCode: fields.postalCode,
    latitude: coord.latitude,
    longitude: coord.longitude,
    locationSource: fields.locationSource || 'provider_resolved',
    status: fields.status || 'UNRESOLVED',
    confidence: fields.confidence,
    resolverVersion: fields.resolverVersion || '1.0.0',
    locationVersion: fields.locationVersion || '1',
    resolvedAt: fields.resolvedAt || null,
    verifiedAt: fields.verifiedAt || null,
    lastVerificationAt: fields.lastVerificationAt || null,
    nextVerificationAt: fields.nextVerificationAt || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  Object.keys(record).forEach(k => { if (record[k] === undefined) delete record[k]; });

  return record;
}

export function isValidOutletLocationRecord(record) {
  if (!record) return false;
  if (!record.outletId || !record.workspaceId) return false;
  if (!record.formattedAddress) return false;
  return true;
}

export function isEligibleForNearestSearch(record) {
  if (!record) return false;
  if (record.status !== 'VERIFIED') return false;
  const { latitude, longitude } = record;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;
  return true;
}
