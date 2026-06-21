export const LocationErrorCode = Object.freeze({
  INPUT_EMPTY: 'LOCATION_INPUT_EMPTY',
  INPUT_TOO_LARGE: 'LOCATION_INPUT_TOO_LARGE',
  CITY_REQUIRED: 'LOCATION_CITY_REQUIRED',
  DETAIL_REQUIRED: 'LOCATION_DETAIL_REQUIRED',
  INVALID_COORDINATES: 'LOCATION_INVALID_COORDINATES',
  UNSUPPORTED_CITY: 'LOCATION_UNSUPPORTED_CITY',
  NOT_FOUND: 'LOCATION_NOT_FOUND',
  AMBIGUOUS: 'LOCATION_AMBIGUOUS',
  CANDIDATE_EXPIRED: 'LOCATION_CANDIDATE_EXPIRED',
  FLOW_EXPIRED: 'LOCATION_FLOW_EXPIRED',
  PROVIDER_UNAVAILABLE: 'LOCATION_PROVIDER_UNAVAILABLE',
  PROVIDER_TIMEOUT: 'LOCATION_PROVIDER_TIMEOUT',
  PROVIDER_RATE_LIMITED: 'LOCATION_PROVIDER_RATE_LIMITED',
  RATE_LIMITED: 'LOCATION_RATE_LIMITED',
  NO_ELIGIBLE_OUTLET: 'LOCATION_NO_ELIGIBLE_OUTLET',
  OUTSIDE_SERVICE_RADIUS: 'LOCATION_OUTSIDE_SERVICE_RADIUS',
  OUTLET_NOT_ELIGIBLE: 'LOCATION_OUTLET_NOT_ELIGIBLE',
  OUTLET_LOCATION_UNVERIFIED: 'LOCATION_OUTLET_LOCATION_UNVERIFIED',
  OUTLET_LOCATION_INVALID: 'LOCATION_OUTLET_LOCATION_INVALID',
  MAPS_URL_INVALID: 'LOCATION_MAPS_URL_INVALID',
  MAPS_URL_UNSUPPORTED: 'LOCATION_MAPS_URL_UNSUPPORTED',
  MAPS_URL_REDIRECT_LIMIT: 'LOCATION_MAPS_URL_REDIRECT_LIMIT',
  MAPS_URL_FORBIDDEN_HOST: 'LOCATION_MAPS_URL_FORBIDDEN_HOST',
  MAPS_URL_SSRF_BLOCKED: 'LOCATION_MAPS_URL_SSRF_BLOCKED',
  MAPS_URL_RESOLUTION_FAILED: 'LOCATION_MAPS_URL_RESOLUTION_FAILED',
  PREVIEW_EXPIRED: 'LOCATION_PREVIEW_EXPIRED',
  VERSION_CONFLICT: 'LOCATION_VERSION_CONFLICT',
  CONFIRMATION_REQUIRED: 'LOCATION_CONFIRMATION_REQUIRED',
  CONFIRMATION_EXPIRED: 'LOCATION_CONFIRMATION_EXPIRED',
  DIRECTIONS_MODE_UNSUPPORTED: 'LOCATION_DIRECTIONS_MODE_UNSUPPORTED',
  DIRECTIONS_UNAVAILABLE: 'LOCATION_DIRECTIONS_UNAVAILABLE',
  CROSS_WORKSPACE_ACCESS_DENIED: 'LOCATION_CROSS_WORKSPACE_ACCESS_DENIED',
  PERMISSION_DENIED: 'LOCATION_PERMISSION_DENIED',
  INTERNAL_ERROR: 'LOCATION_INTERNAL_ERROR',
});

const ALL_CODES = new Set(Object.values(LocationErrorCode));

export function isLocationErrorCode(code) {
  return ALL_CODES.has(code);
}

export class LocationError extends Error {
  constructor(code, message, httpStatus = 400) {
    super(message);
    this.name = 'LocationError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.expose = httpStatus < 500;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
    };
  }
}

const PROVIDER_ERROR_MAP = {
  'PROVIDER_TIMEOUT': LocationErrorCode.PROVIDER_TIMEOUT,
  'PROVIDER_RATE_LIMITED': LocationErrorCode.PROVIDER_RATE_LIMITED,
  'PROVIDER_UNAVAILABLE': LocationErrorCode.PROVIDER_UNAVAILABLE,
  'PROVIDER_INVALID_RESPONSE': LocationErrorCode.PROVIDER_UNAVAILABLE,
  'PROVIDER_NOT_FOUND': LocationErrorCode.NOT_FOUND,
  'PROVIDER_AMBIGUOUS': LocationErrorCode.AMBIGUOUS,
};

export function mapProviderError(error) {
  const message = error?.message || String(error);
  const mappedCode = PROVIDER_ERROR_MAP[message];
  return new LocationError(
    mappedCode || LocationErrorCode.INTERNAL_ERROR,
    message,
    mappedCode ? 502 : 500
  );
}

const CUSTOMER_SAFE_MESSAGES = {
  [LocationErrorCode.CITY_REQUIRED]: 'Kota wajib diisi',
  [LocationErrorCode.DETAIL_REQUIRED]: 'Mohon tambahkan nama jalan, daerah, atau landmark',
  [LocationErrorCode.INVALID_COORDINATES]: 'Koordinat tidak valid',
  [LocationErrorCode.UNSUPPORTED_CITY]: 'Maaf, kota tersebut belum tersedia',
  [LocationErrorCode.NOT_FOUND]: 'Lokasi tidak ditemukan. Coba tambahkan detail lain',
  [LocationErrorCode.AMBIGUOUS]: 'Ada beberapa lokasi yang mirip',
  [LocationErrorCode.FLOW_EXPIRED]: 'Sesi lokasi sudah kedaluwarsa. Silakan cari ulang',
  [LocationErrorCode.PROVIDER_UNAVAILABLE]: 'Layanan lokasi sedang sibuk. Coba lagi nanti',
  [LocationErrorCode.PROVIDER_TIMEOUT]: 'Layanan lokasi lambat. Coba lagi dengan detail tambahan',
  [LocationErrorCode.PROVIDER_RATE_LIMITED]: 'Terlalu banyak permintaan. Coba lagi nanti',
  [LocationErrorCode.RATE_LIMITED]: 'Terlalu banyak permintaan. Coba lagi nanti',
  [LocationErrorCode.NO_ELIGIBLE_OUTLET]: 'Tidak ada outlet yang tersedia saat ini',
  [LocationErrorCode.OUTSIDE_SERVICE_RADIUS]: 'Belum ada outlet yang cukup dekat dari lokasi Anda',
  [LocationErrorCode.MAPS_URL_SSRF_BLOCKED]: 'URL yang diberikan tidak valid',
  [LocationErrorCode.CROSS_WORKSPACE_ACCESS_DENIED]: 'Akses ditolak',
  [LocationErrorCode.PERMISSION_DENIED]: 'Akses ditolak',
};

export function createCustomerSafeError(error) {
  const safeMessage = CUSTOMER_SAFE_MESSAGES[error.code] || 'Terjadi kesalahan. Silakan coba lagi.';
  return {
    code: error.code,
    message: safeMessage,
    expose: error.httpStatus < 500,
  };
}
