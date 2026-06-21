import crypto from 'node:crypto';

let idCounter = 0;

export function nextId(prefix = 'loc') {
  idCounter += 1;
  return `${prefix}-${idCounter}-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildCoordinate(overrides = {}) {
  return {
    latitude: -0.502106,
    longitude: 117.153709,
    ...overrides,
  };
}

export function buildTextLocationInput(overrides = {}) {
  return {
    inputType: 'text',
    street: null,
    area: null,
    city: null,
    province: null,
    landmark: null,
    placeName: null,
    postalCode: null,
    rawText: null,
    ...overrides,
  };
}

export function buildPendingLocationContext(overrides = {}) {
  const now = new Date('2026-06-20T00:00:00Z');
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  return {
    flowId: nextId('flow'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    contactId: nextId('contact'),
    chatId: nextId('chat'),
    sessionId: null,
    inputType: 'text',
    street: null,
    area: null,
    city: null,
    province: null,
    landmark: null,
    placeName: null,
    postalCode: null,
    normalizedQuery: null,
    status: 'EMPTY',
    protectedLatitude: null,
    protectedLongitude: null,
    candidateIds: [],
    recommendedOutletId: null,
    alternativeOutletIds: [],
    lastMessageId: nextId('msg'),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

export function buildLocationCandidate(overrides = {}) {
  return {
    candidateId: nextId('cand'),
    provider: 'google',
    providerPlaceId: 'ChIJ' + crypto.randomUUID().slice(0, 20).replace(/-/g, ''),
    label: 'Jalan Biawan, Samarinda',
    formattedAddress: 'Jalan Biawan, Samarinda, Kalimantan Timur, Indonesia',
    city: 'Samarinda',
    province: 'Kalimantan Timur',
    countryCode: 'ID',
    latitude: -0.502106,
    longitude: 117.153709,
    confidence: 'high',
    precision: 'street',
    ...overrides,
  };
}

export function buildNearestOutletResult(overrides = {}) {
  return {
    outletId: nextId('outlet'),
    name: 'SelaluTeh Samarinda',
    formattedAddress: 'Jalan Biawan No. 10, Samarinda',
    approximateDistanceMeters: 1200,
    openingStatus: 'open',
    nextOpeningAt: null,
    googleMapsUrl: 'https://maps.google.com/?q=-0.502106,117.153709',
    withinServiceRadius: true,
    rankReason: 'nearest_absolute',
    ...overrides,
  };
}

export function buildOutletLocation(overrides = {}) {
  return {
    outletId: nextId('outlet'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    provider: 'google',
    providerPlaceId: 'ChIJ' + crypto.randomUUID().slice(0, 20).replace(/-/g, ''),
    sourceUrl: 'https://maps.google.com/?q=-0.502106,117.153709',
    googleMapsUri: 'https://maps.google.com/?q=-0.502106,117.153709',
    displayName: 'SelaluTeh Samarinda',
    formattedAddress: 'Jalan Biawan No. 10, Samarinda',
    city: 'Samarinda',
    province: 'Kalimantan Timur',
    countryCode: 'ID',
    postalCode: '75123',
    latitude: -0.502106,
    longitude: 117.153709,
    locationSource: 'provider_resolved',
    status: 'VERIFIED',
    confidence: 'high',
    resolverVersion: '1.0.0',
    locationVersion: '1',
    resolvedAt: '2026-06-20T00:00:00.000Z',
    verifiedAt: '2026-06-20T00:00:00.000Z',
    lastVerificationAt: '2026-06-20T00:00:00.000Z',
    nextVerificationAt: '2027-06-20T00:00:00.000Z',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    ...overrides,
  };
}

export function buildSupportedCity(overrides = {}) {
  return {
    cityKey: 'samarinda',
    displayName: 'Samarinda',
    province: 'Kalimantan Timur',
    countryCode: 'ID',
    aliases: ['Samarinda', 'Kota Samarinda', 'SMD'],
    eligibleOutletCount: 3,
    ...overrides,
  };
}

export function buildOutletLocationPreview(overrides = {}) {
  const now = new Date('2026-06-20T00:00:00Z');
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  return {
    previewToken: nextId('preview'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    outletId: nextId('outlet'),
    expectedOutletVersion: '1',
    provider: 'google',
    providerPlaceId: 'ChIJ' + crypto.randomUUID().slice(0, 20).replace(/-/g, ''),
    displayName: 'SelaluTeh Samarinda',
    formattedAddress: 'Jalan Biawan No. 10, Samarinda',
    latitude: -0.502106,
    longitude: 117.153709,
    googleMapsUri: 'https://maps.google.com/?q=-0.502106,117.153709',
    confidence: 'high',
    sourceUrl: 'https://maps.google.com/?q=-0.502106,117.153709',
    expiresAt: expiresAt.toISOString(),
    createdBy: nextId('user'),
    ...overrides,
  };
}
