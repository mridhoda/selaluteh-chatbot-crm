import crypto from 'node:crypto';

const CONFIRMATION_TTL_MS = 5 * 60 * 1000;
const confirmations = new Map();

export function createConfirmationToken({ chatId, contactId, toolName, args }) {
  const id = crypto.randomUUID();
  const snapshot = {
    id,
    chatId,
    contactId,
    toolName,
    args: JSON.parse(JSON.stringify(args)),
    createdAt: Date.now(),
    expiresAt: Date.now() + CONFIRMATION_TTL_MS,
    state: 'pending',
  };
  confirmations.set(id, snapshot);
  return snapshot;
}

export function validateConfirmation({ id, chatId, toolName, args }) {
  const snapshot = confirmations.get(id);
  if (!snapshot) {
    return { valid: false, reason: 'not_found' };
  }
  if (snapshot.state !== 'pending') {
    return { valid: false, reason: 'already_used' };
  }
  if (snapshot.chatId !== chatId) {
    return { valid: false, reason: 'wrong_chat' };
  }
  if (snapshot.toolName !== toolName) {
    return { valid: false, reason: 'wrong_tool' };
  }
  if (Date.now() > snapshot.expiresAt) {
    return { valid: false, reason: 'expired' };
  }

  const currentArgs = JSON.stringify(args);
  const snapArgs = JSON.stringify(snapshot.args);
  if (currentArgs !== snapArgs) {
    return { valid: false, reason: 'args_changed' };
  }

  confirmations.set(id, { ...snapshot, state: 'confirmed' });
  return { valid: true, snapshot };
}

export function invalidateConfirmation({ id }) {
  confirmations.delete(id);
}
