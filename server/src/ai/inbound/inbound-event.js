import crypto from 'node:crypto';

const INBOUND_EVENT_FIELDS = [
  'workspaceId',
  'platformId',
  'provider',
  'externalMessageId',
  'externalConversationId',
  'externalUserId',
  'messageType',
  'text',
  'media',
  'replyContext',
  'providerTimestamp',
];

const ALLOWED_PROVIDERS = new Set(['telegram', 'whatsapp']);
const ALLOWED_MESSAGE_TYPES = new Set(['text', 'image', 'file', 'audio', 'callback_query']);
const MAX_TEXT_LENGTH = 10000;
const SAFE_MEDIA_KEYS = new Set(['type', 'url', 'mimeType', 'size', 'filename', 'fileId', 'fileSize', 'id', 'duration', 'fileName', 'caption']);

export function createInboundEvent(fields) {
  const missing = INBOUND_EVENT_FIELDS.filter((f) => {
    if (f === 'media' || f === 'replyContext' || f === 'correlationId') return false;
    return fields[f] === undefined || fields[f] === null || fields[f] === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }

  if (!ALLOWED_PROVIDERS.has(fields.provider)) {
    throw new ValidationError(`Unknown provider: ${fields.provider}`);
  }

  if (!ALLOWED_MESSAGE_TYPES.has(fields.messageType)) {
    throw new ValidationError(`Unknown message type: ${fields.messageType}`);
  }

  if (fields.text && fields.text.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`Text exceeds max length of ${MAX_TEXT_LENGTH}`);
  }

  if (fields.media) {
    if (typeof fields.media !== 'object' || Array.isArray(fields.media)) {
      throw new ValidationError('media must be an object');
    }
    const unsafeKeys = Object.keys(fields.media).filter((k) => !SAFE_MEDIA_KEYS.has(k));
    if (unsafeKeys.length > 0) {
      throw new ValidationError(`Unsafe media metadata keys: ${unsafeKeys.join(', ')}`);
    }
  }

  return {
    workspaceId: fields.workspaceId,
    platformId: fields.platformId,
    provider: fields.provider,
    externalMessageId: fields.externalMessageId,
    externalConversationId: fields.externalConversationId,
    externalUserId: fields.externalUserId,
    messageType: fields.messageType,
    text: fields.text || '',
    media: fields.media || null,
    replyContext: fields.replyContext || null,
    providerTimestamp: fields.providerTimestamp,
    correlationId: fields.correlationId || crypto.randomUUID(),
  };
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}
