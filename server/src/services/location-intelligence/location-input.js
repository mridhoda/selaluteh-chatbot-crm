export const LocationInputType = Object.freeze({
  TEXT: 'text',
  STRUCTURED_FIELDS: 'structured_fields',
  SHARED_COORDINATES: 'shared_coordinates',
  GOOGLE_MAPS_URL: 'google_maps_url',
  CANDIDATE_SELECTION: 'candidate_selection',
});

const VALID_INPUT_TYPES = new Set(Object.values(LocationInputType));

export const MAX_LOCATION_INPUT_LENGTH = 500;

const FORBIDDEN_FIELDS = new Set([
  'customProviderEndpoint',
  'rawProviderPayload',
  'apiKey',
  'arbitraryUrl',
]);

export function isValidLocationInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'LOCATION_INPUT_EMPTY' };
  }

  const { inputType, text, latitude, longitude } = input;

  if (!inputType || !VALID_INPUT_TYPES.has(inputType)) {
    return { valid: false, error: 'LOCATION_INPUT_INVALID_TYPE' };
  }

  for (const key of Object.keys(input)) {
    if (FORBIDDEN_FIELDS.has(key)) {
      return { valid: false, error: 'LOCATION_FIELD_FORBIDDEN' };
    }
  }

  if (inputType === LocationInputType.TEXT) {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'LOCATION_INPUT_EMPTY' };
    }
    if (text.length > MAX_LOCATION_INPUT_LENGTH) {
      return { valid: false, error: 'LOCATION_INPUT_TOO_LARGE' };
    }
    if ((latitude != null || longitude != null)) {
      return { valid: false, error: 'LOCATION_COORDINATES_WITH_TEXT' };
    }
    return { valid: true };
  }

  if (inputType === LocationInputType.STRUCTURED_FIELDS) {
    if (!input.city) {
      return { valid: false, error: 'LOCATION_CITY_REQUIRED' };
    }
    return { valid: true };
  }

  if (inputType === LocationInputType.SHARED_COORDINATES) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { valid: false, error: 'LOCATION_INVALID_COORDINATES' };
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { valid: false, error: 'LOCATION_INVALID_COORDINATES' };
    }
    return { valid: true };
  }

  return { valid: true };
}
