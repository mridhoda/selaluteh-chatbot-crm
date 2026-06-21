import crypto from 'node:crypto';
import { isOutletEligible } from './outlet-eligibility.js';

const CONFIRMATION_TTL_MINUTES = 15;

export function createConfirmation(fields, ttlMinutes = CONFIRMATION_TTL_MINUTES) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  return {
    confirmationId: 'conf-' + crypto.randomUUID().slice(0, 8),
    flowId: fields.flowId,
    workspaceId: fields.workspaceId,
    contactId: fields.contactId,
    chatId: fields.chatId,
    recommendedOutletId: fields.recommendedOutletId,
    allowedAlternativeOutletIds: fields.allowedAlternativeOutletIds || [],
    expectedOutletVersions: fields.expectedOutletVersions || {},
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };
}

export function isValidConfirmation(confirmation) {
  if (!confirmation) return false;
  if (!confirmation.flowId || !confirmation.workspaceId) return false;
  if (new Date(confirmation.expiresAt) < new Date()) return false;
  return true;
}

export async function revalidateConfirmation(confirmation, outletData) {
  if (!isValidConfirmation(confirmation)) {
    return { valid: false, reason: 'confirmation_expired' };
  }

  if (outletData.workspaceId && outletData.workspaceId !== confirmation.workspaceId) {
    return { valid: false, reason: 'cross_workspace' };
  }

  const eligible = isOutletEligible(outletData);
  if (!eligible) {
    return { valid: false, reason: 'outlet_not_eligible' };
  }

  return { valid: true };
}
