import crypto from 'node:crypto';

const confirmations = new Map();

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function buildPayloadHash(payload) {
  return crypto.createHash('sha256').update(stableStringify(payload || {})).digest('hex');
}

function contextBinding(context = {}) {
  return {
    workspaceId: context.workspaceId,
    channelConnectionId: context.channelConnectionId || null,
    conversationId: context.conversationId || null,
    contactId: context.contactId || null,
    activeCartId: context.activeCartId || null,
    cartVersion: context.cartVersion ?? null,
    checkoutId: context.checkoutId || null,
  };
}

export async function createAIActionConfirmation({ context = {}, action, payload = {}, stateVersion = null, expiresInMs = 10 * 60 * 1000 } = {}) {
  const token = `aic_${crypto.randomBytes(24).toString('hex')}`;
  const record = Object.freeze({
    token,
    action,
    context: Object.freeze(contextBinding(context)),
    payloadHash: buildPayloadHash(payload),
    stateVersion,
    consumedAt: null,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  });
  confirmations.set(token, record);
  return record;
}

export async function consumeAIActionConfirmation({ token, context = {}, action, payload = {}, stateVersion = null } = {}) {
  const record = confirmations.get(token);
  if (!record) return { valid: false, reason: 'not_found' };
  if (record.consumedAt) return { valid: false, reason: 'already_consumed' };
  if (new Date(record.expiresAt).getTime() < Date.now()) return { valid: false, reason: 'expired' };
  if (record.action !== action) return { valid: false, reason: 'action_mismatch' };
  if (record.payloadHash !== buildPayloadHash(payload)) return { valid: false, reason: 'payload_mismatch' };
  if ((record.stateVersion || null) !== (stateVersion || null)) return { valid: false, reason: 'state_version_mismatch' };

  const incoming = contextBinding(context);
  for (const [key, value] of Object.entries(record.context)) {
    if ((incoming[key] ?? null) !== (value ?? null)) return { valid: false, reason: 'context_mismatch' };
  }

  const consumed = Object.freeze({ ...record, consumedAt: new Date().toISOString() });
  confirmations.set(token, consumed);
  return { valid: true, confirmation: consumed };
}

export function clearAIActionConfirmationsForTest() {
  confirmations.clear();
}
