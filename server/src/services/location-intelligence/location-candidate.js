import { LocationError, LocationErrorCode } from './errors.js';
import { Coordinate } from './coordinate.js';

export const ConfidenceLevel = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
});

export const PrecisionLevel = Object.freeze({
  ROOFTOP: 'rooftop',
  STREET: 'street',
  AREA: 'area',
  LANDMARK: 'landmark',
  CITY: 'city',
  POSTAL_CODE: 'postal_code',
  UNKNOWN: 'unknown',
});

const VALID_CONFIDENCE = new Set(Object.values(ConfidenceLevel));
const VALID_PRECISION = new Set(Object.values(PrecisionLevel));

export function createLocationCandidate(fields) {
  const candidate = {
    candidateId: fields.candidateId,
    provider: fields.provider,
    providerPlaceId: fields.providerPlaceId,
    label: fields.label,
    formattedAddress: fields.formattedAddress,
    city: fields.city,
    province: fields.province,
    countryCode: fields.countryCode,
    latitude: fields.latitude,
    longitude: fields.longitude,
    confidence: fields.confidence,
    precision: fields.precision,
  };

  Object.keys(candidate).forEach(key => {
    if (candidate[key] === undefined) delete candidate[key];
  });

  return candidate;
}

export function isValidCandidate(candidate) {
  if (!candidate) return false;
  if (!candidate.candidateId || !candidate.provider) return false;
  if (!candidate.label) return false;
  if (typeof candidate.latitude !== 'number' || typeof candidate.longitude !== 'number') return false;
  if (candidate.latitude < -90 || candidate.latitude > 90) return false;
  if (candidate.longitude < -180 || candidate.longitude > 180) return false;
  if (!VALID_CONFIDENCE.has(candidate.confidence)) return false;
  if (!VALID_PRECISION.has(candidate.precision)) return false;
  return true;
}

export function sanitizeForCustomer(candidate) {
  const safe = {
    candidateId: candidate.candidateId,
    label: candidate.label,
    formattedAddress: candidate.formattedAddress,
    confidence: candidate.confidence,
    precision: candidate.precision,
  };
  Object.keys(safe).forEach(key => {
    if (safe[key] === undefined) delete safe[key];
  });
  return safe;
}
