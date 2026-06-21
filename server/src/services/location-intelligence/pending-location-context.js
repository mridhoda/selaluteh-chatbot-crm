import { nextId } from '../../../test/helpers/location/factories.js';

export const PENDING_TTL_MINUTES = 30;

export function createPendingLocationContext(fields, ttlMinutes = PENDING_TTL_MINUTES) {
  if (ttlMinutes < 0) {
    throw new Error('TTL cannot be negative');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  return {
    flowId: fields.flowId || nextId('flow'),
    workspaceId: fields.workspaceId || null,
    contactId: fields.contactId || null,
    chatId: fields.chatId || null,
    sessionId: fields.sessionId || null,
    inputType: fields.inputType || 'text',
    street: fields.street || null,
    area: fields.area || null,
    city: fields.city || null,
    province: fields.province || null,
    landmark: fields.landmark || null,
    placeName: fields.placeName || null,
    postalCode: fields.postalCode || null,
    normalizedQuery: fields.normalizedQuery || null,
    status: fields.status || 'EMPTY',
    protectedLatitude: fields.protectedLatitude != null ? fields.protectedLatitude : null,
    protectedLongitude: fields.protectedLongitude != null ? fields.protectedLongitude : null,
    candidateIds: fields.candidateIds || [],
    recommendedOutletId: fields.recommendedOutletId || null,
    alternativeOutletIds: fields.alternativeOutletIds || [],
    lastMessageId: fields.lastMessageId || null,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function isValidPendingContext(ctx) {
  if (!ctx) return false;
  if (!ctx.workspaceId) return false;
  if (!ctx.contactId) return false;
  if (!ctx.lastMessageId) return false;
  return true;
}
