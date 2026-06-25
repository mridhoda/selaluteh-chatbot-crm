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

function formatDistance(meters) {
  if (!Number.isFinite(meters)) return 'jarak tidak diketahui';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

function buildGoogleMapsLink({ latitude, longitude, googleMapsUri }) {
  if (googleMapsUri && /^https?:\/\//i.test(googleMapsUri)) return googleMapsUri;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
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

export async function buildNearestOutletReplyFromText({ workspaceId, text, provider = createDefaultLocationProvider() }) {
  if (!workspaceId || !looksLikeCustomerLocationText(text)) return null;

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
    return null;
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