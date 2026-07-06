import { outletLocationsRepository } from '../../db/repositories/index.js';
import { env } from '../../config/env.js';
import { createGoogleMapsClient } from './google-adapter.js';
import { createNominatimClient } from './nominatim-adapter.js';
import { parseLocationText } from './location-parser.js';
import { createResolutionCache, createResolutionService } from './resolution-service.js';
import { findNearestOutlets } from './nearest-outlet-service.js';

const NON_LOCATION_KEYWORDS = [
  'promo', 'diskon', 'menu', 'harga', 'pesan', 'order', 'beli', 'minum', 'minuman',
  'teh', 'vanilla', 'less sugar', 'outlet apa', 'daftar outlet', 'jam buka',
];

const LOCATION_HINT_KEYWORDS = [
  'jalan', 'jl', 'jln', 'gang', 'gg', 'komplek', 'perum', 'perumahan', 'dekat',
  'samping', 'sebelah', 'depan', 'belakang', 'kelurahan', 'kel', 'kecamatan', 'kec',
];

const CITY_KEYWORDS = ['samarinda', 'tenggarong', 'balikpapan', 'bontang'];
const FOREIGN_LOCATION_KEYWORDS = [
  'new york', 'newyork', 'nyc', 'america', 'amerika', 'usa', 'united states', 'singapore', 'singapura',
  'malaysia', 'kuala lumpur', 'bangkok', 'tokyo', 'london', 'paris', 'sydney', 'melbourne',
];
const INDONESIAN_ADMIN_KEYWORDS = ['kel', 'kelurahan', 'kec', 'kecamatan', 'rt', 'rw', 'gg', 'gang', 'jalan', 'jl', 'jln'];

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return 'jarak tidak diketahui';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

function buildGoogleMapsLink({ latitude, longitude, googleMapsUri }) {
  if (googleMapsUri && /^https?:\/\//i.test(googleMapsUri)) return googleMapsUri;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function normalizeMatchText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(jl|jln)\b/g, 'jalan')
    .replace(/\s+/g, ' ')
    .trim();
}

function toEligibleOutlet(location) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    outletId: location.outletId,
    name: location.displayName || location.name || location.formattedAddress || `Outlet ${location.outletId}`,
    formattedAddress: location.formattedAddress || '',
    latitude,
    longitude,
    openingStatus: location.openingStatus || 'unknown',
    googleMapsUrl: buildGoogleMapsLink({
      latitude,
      longitude,
      googleMapsUri: location.googleMapsUri,
    }),
  };
}

async function findOutletLocationTextFallback({ workspaceId, text }) {
  const normalizedText = normalizeMatchText(text);
  if (!normalizedText) return null;
  const locations = await outletLocationsRepository.listVerifiedEligible(workspaceId);
  const eligibleOutlets = (locations || [])
    .map(toEligibleOutlet)
    .filter(Boolean);
  const matched = eligibleOutlets.find((outlet) => {
    const haystack = normalizeMatchText(`${outlet.name} ${outlet.formattedAddress}`);
    if (!haystack) return false;
    const tokens = normalizedText.split(' ').filter((token) => token.length >= 3);
    return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
  });
  if (!matched) return null;
  return formatNearestOutletReply({ recommendation: { ...matched, approximateDistanceMeters: 0, withinServiceRadius: true }, alternatives: [] });
}

export function createDefaultLocationProvider() {
  if (env.locationProvider === 'google' && env.googleMapsApiKey) {
    return createGoogleMapsClient({ apiKey: env.googleMapsApiKey });
  }
  return createNominatimClient({});
}

export function looksLikeCustomerLocationText(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 4 || normalized.length > 160) return false;
  if (/^\//.test(normalized)) return false;
  if (NON_LOCATION_KEYWORDS.some(keyword => normalized.includes(keyword))) return false;
  const hasCity = CITY_KEYWORDS.some(city => normalized.includes(city));
  if (!hasCity) return false;

  const hasLocationHint = LOCATION_HINT_KEYWORDS.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(normalized));
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return hasLocationHint || wordCount <= 5;
}

export function validateCustomerLocationText(text) {
  const normalized = normalizeMatchText(text);
  if (!normalized) return { valid: false, reason: 'empty' };
  const hasForeignLocation = FOREIGN_LOCATION_KEYWORDS.some(keyword => normalized.includes(keyword));
  const hasIndonesianAdminTerm = INDONESIAN_ADMIN_KEYWORDS.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(normalized));
  const hasSupportedCity = CITY_KEYWORDS.some(city => normalized.includes(city));

  if (hasForeignLocation && hasIndonesianAdminTerm) {
    return { valid: false, reason: 'contradictory_address' };
  }
  if (hasForeignLocation && !hasSupportedCity) {
    return { valid: false, reason: 'outside_supported_area' };
  }
  return { valid: true, reason: null };
}

export function buildInvalidAddressReply(reason) {
  if (reason === 'outside_supported_area') {
    return 'Maaf, alamat itu terlihat di luar area layanan kami. Boleh kirim alamat yang valid di Samarinda/Tenggarong/Balikpapan/Bontang, atau share live location/Google Maps?';
  }
  return 'Boleh verifikasi alamatnya? Format yang benar: nama jalan/landmark + kelurahan/kecamatan + kota, atau share live location/Google Maps. Contoh: “Jl. Jelawat, Samarinda”.';
}

export function formatNearestOutletReply(nearest) {
  const recommendation = nearest?.recommendation;
  if (!recommendation) {
    return 'Maaf, saat ini belum ada outlet yang lokasinya sudah terverifikasi untuk menghitung outlet terdekat.';
  }

  const lines = [
    `Outlet terdekat dari lokasimu adalah **${recommendation.name}**.`,
    `Perkiraan jarak: ${formatDistance(recommendation.approximateDistanceMeters)}.`,
  ];

  if (recommendation.formattedAddress) {
    lines.push(`Alamat: ${recommendation.formattedAddress}.`);
  }

  if (recommendation.googleMapsUrl) {
    lines.push(`Share lokasi Google Maps: ${recommendation.googleMapsUrl}`);
  }

  if (!recommendation.withinServiceRadius) {
    lines.push('Catatan: lokasimu terlihat di luar radius layanan default, jadi admin mungkin perlu konfirmasi dulu.');
  }

  if (nearest.alternatives?.length) {
    lines.push('', 'Alternatif outlet terdekat lainnya:');
    nearest.alternatives.forEach((outlet, index) => {
      const maps = outlet.googleMapsUrl ? ` — ${outlet.googleMapsUrl}` : '';
      lines.push(`${index + 1}. ${outlet.name} — ${formatDistance(outlet.approximateDistanceMeters)}${maps}`);
    });
  }

  lines.push('', 'Mau saya pilih outlet ini untuk pesananmu? Atau kamu mau aku listkan seluruh outlet yang ada di sekitarmu? Kalau iya, sebutin daerah atau kota tempat kamu tinggal ya.');
  return lines.join('\n');
}

function toRecommendedOutletButton(outlet) {
  if (!outlet?.outletId || !outlet?.name) return null;
  return {
    outletId: String(outlet.outletId),
    name: outlet.name,
  };
}

export function formatNearestOutletReplyPayload(nearest) {
  const text = formatNearestOutletReply(nearest);
  const recommendation = nearest?.recommendation;
  const alternatives = nearest?.alternatives || [];
  const recommendedOutlets = [recommendation, ...alternatives]
    .map(toRecommendedOutletButton)
    .filter(Boolean);

  return { text, recommendedOutlets };
}

export async function buildNearestOutletReplyFromCoordinates({ workspaceId, latitude, longitude }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!workspaceId || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const locations = await outletLocationsRepository.listVerifiedEligible(workspaceId);
  const eligibleOutlets = (locations || [])
    .map(toEligibleOutlet)
    .filter(Boolean);

  const nearest = findNearestOutlets({ latitude: lat, longitude: lon }, eligibleOutlets);
  return formatNearestOutletReply(nearest);
}

export async function buildNearestOutletReplyPayloadFromCoordinates({ workspaceId, latitude, longitude }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!workspaceId || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const locations = await outletLocationsRepository.listVerifiedEligible(workspaceId);
  const eligibleOutlets = (locations || [])
    .map(toEligibleOutlet)
    .filter(Boolean);

  const nearest = findNearestOutlets({ latitude: lat, longitude: lon }, eligibleOutlets);
  return formatNearestOutletReplyPayload(nearest);
}

export async function buildNearestOutletReplyFromText({ workspaceId, text, provider = createDefaultLocationProvider() }) {
  if (!workspaceId || !looksLikeCustomerLocationText(text)) return null;
  const validation = validateCustomerLocationText(text);
  if (!validation.valid) return buildInvalidAddressReply(validation.reason);

  const parsed = parseLocationText(text);
  const resolutionService = createResolutionService({
    provider,
    cache: createResolutionCache(),
  });

  const resolved = await resolutionService.resolve({ ...parsed, rawText: text }, { workspaceId });
  if (resolved.status === 'MISSING_CITY') {
    return 'Boleh sebutkan kotanya juga? Contoh: “Jelawat Samarinda”.';
  }
  if (resolved.status === 'MISSING_DETAIL') {
    return 'Boleh sebutkan nama jalan/daerah/landmark yang lebih spesifik?';
  }
  if (resolved.status === 'OUTSIDE_SUPPORTED_CITY') {
    return `Maaf, kota tersebut belum masuk area yang didukung. Area tersedia: ${resolved.supportedCities?.join(', ') || 'Samarinda'}.`;
  }
  if (resolved.status === 'NOT_FOUND') {
    return findOutletLocationTextFallback({ workspaceId, text });
  }

  const candidates = resolved.candidates || [];
  if (resolved.status === 'AMBIGUOUS' && candidates.length > 1) {
    const options = candidates.slice(0, 3).map((candidate, index) => (
      `${index + 1}. ${candidate.formattedAddress || candidate.label}`
    ));
    return `Saya menemukan beberapa kemungkinan lokasi. Yang mana yang kamu maksud?\n${options.join('\n')}`;
  }

  const candidate = candidates[0];
  if (!candidate) return null;

  return buildNearestOutletReplyFromCoordinates({
    workspaceId,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  });
}

export async function buildNearestOutletReplyPayloadFromText({ workspaceId, text, provider = createDefaultLocationProvider() }) {
  if (!workspaceId || !looksLikeCustomerLocationText(text)) return null;
  const validation = validateCustomerLocationText(text);
  if (!validation.valid) return { text: buildInvalidAddressReply(validation.reason), recommendedOutlets: [] };

  const parsed = parseLocationText(text);
  const resolutionService = createResolutionService({
    provider,
    cache: createResolutionCache(),
  });

  const resolved = await resolutionService.resolve({ ...parsed, rawText: text }, { workspaceId });
  if (resolved.status === 'MISSING_CITY') {
    return { text: 'Boleh sebutkan kotanya juga? Contoh: “Jelawat Samarinda”.', recommendedOutlets: [] };
  }
  if (resolved.status === 'MISSING_DETAIL') {
    return { text: 'Boleh sebutkan nama jalan/daerah/landmark yang lebih spesifik?', recommendedOutlets: [] };
  }
  if (resolved.status === 'OUTSIDE_SUPPORTED_CITY') {
    return { text: `Maaf, kota tersebut belum masuk area yang didukung. Area tersedia: ${resolved.supportedCities?.join(', ') || 'Samarinda'}.`, recommendedOutlets: [] };
  }
  if (resolved.status === 'NOT_FOUND') {
    const fallbackReply = await findOutletLocationTextFallback({ workspaceId, text });
    return fallbackReply ? { text: fallbackReply, recommendedOutlets: [] } : null;
  }

  const candidates = resolved.candidates || [];
  if (resolved.status === 'AMBIGUOUS' && candidates.length > 1) {
    const options = candidates.slice(0, 3).map((candidate, index) => (
      `${index + 1}. ${candidate.formattedAddress || candidate.label}`
    ));
    return { text: `Saya menemukan beberapa kemungkinan lokasi. Yang mana yang kamu maksud?\n${options.join('\n')}`, recommendedOutlets: [] };
  }

  const candidate = candidates[0];
  if (!candidate) return null;

  return buildNearestOutletReplyPayloadFromCoordinates({
    workspaceId,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  });
}
