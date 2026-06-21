import crypto from 'node:crypto';

export const CONFIRM_PREVIEW_TTL_MINUTES = 15;

function generateToken() {
  return 'preview-' + crypto.randomUUID().slice(0, 8);
}

let previewStore = new Map();

export function createPreview(fields) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONFIRM_PREVIEW_TTL_MINUTES * 60 * 1000);

  const preview = {
    previewToken: generateToken(),
    workspaceId: fields.workspaceId,
    outletId: fields.outletId,
    expectedOutletVersion: fields.expectedOutletVersion,
    provider: fields.provider || 'google',
    providerPlaceId: fields.providerPlaceId,
    displayName: fields.displayName,
    formattedAddress: fields.formattedAddress,
    latitude: fields.latitude,
    longitude: fields.longitude,
    googleMapsUri: fields.googleMapsUri,
    confidence: fields.confidence || 'medium',
    sourceUrl: fields.sourceUrl,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  previewStore.set(preview.previewToken, preview);
  return preview;
}

export function isValidPreview(preview) {
  return !!(preview && preview.previewToken && preview.workspaceId && preview.outletId);
}

export function resolvePreviewFlow(auth, outletId, url) {
  if (!auth) {
    throw new Error('LOCATION_PERMISSION_DENIED');
  }
  return { previewToken: generateToken(), status: 'preview_created' };
}

export async function confirmPreviewFlow(previewToken, workspaceId, outletId, expectedVersion) {
  const preview = previewStore.get(previewToken);
  if (!preview) {
    return { success: false, code: 'LOCATION_PREVIEW_EXPIRED' };
  }

  if (expectedVersion && expectedVersion !== preview.expectedOutletVersion) {
    return { success: false, code: 'LOCATION_VERSION_CONFLICT' };
  }

  if (new Date(preview.expiresAt) < new Date()) {
    previewStore.delete(previewToken);
    return { success: false, code: 'LOCATION_PREVIEW_EXPIRED' };
  }

  previewStore.delete(previewToken);
  return { success: true, outletId: preview.outletId, locationVersion: preview.expectedOutletVersion };
}

export function resetPreviewStore() {
  previewStore = new Map();
}
