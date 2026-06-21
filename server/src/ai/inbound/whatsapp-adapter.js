import crypto from 'node:crypto';
import { createInboundEvent } from './inbound-event.js';

function extractSafeMedia(message) {
  if (message.type === 'image' && message.image) {
    return { type: 'image', mimeType: message.image.mime_type, id: message.image.id };
  }
  if (message.type === 'document' && message.document) {
    return { type: 'file', mimeType: message.document.mime_type, fileName: message.document.filename, id: message.document.id };
  }
  if (message.type === 'audio' && message.audio) {
    return { type: 'audio', mimeType: message.audio.mime_type, id: message.audio.id, duration: message.audio.duration };
  }
  if (message.type === 'voice' && message.voice) {
    return { type: 'audio', mimeType: message.voice.mime_type, id: message.voice.id, duration: message.voice.duration };
  }
  if (message.type === 'video' && message.video) {
    return { type: 'file', mimeType: message.video.mime_type, id: message.video.id };
  }
  return null;
}

function extractReplyContext(message) {
  if (message.context && message.context.id) {
    return { externalMessageId: message.context.id };
  }
  return null;
}

export async function whatsappToInboundEvent({ entry, workspaceId, platformId }) {
  if (!entry?.changes?.[0]?.value) return null;

  const value = entry.changes[0].value;
  if (!value.messages || value.messages.length === 0) return null;

  const message = value.messages[0];
  const metadata = value.metadata || {};

  if (!message?.id || !message?.from) return null;

  const externalMessageId = String(message.id);
  const externalConversationId = String(message.from);
  const externalUserId = String(message.from);
  const text = message.text?.body || message.caption || '';
  const messageType = message.type || 'text';

  const media = extractSafeMedia(message);
  const replyContext = extractReplyContext(message);

  return createInboundEvent({
    workspaceId,
    platformId,
    provider: 'whatsapp',
    externalMessageId,
    externalConversationId,
    externalUserId,
    messageType,
    text,
    media,
    replyContext,
    providerTimestamp: message.timestamp
      ? new Date(parseInt(message.timestamp) * 1000).toISOString()
      : new Date().toISOString(),
    correlationId: crypto.randomUUID(),
  });
}
