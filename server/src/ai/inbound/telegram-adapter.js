import crypto from 'node:crypto';
import { normalizeTelegramUpdate } from '../../integrations/telegram/telegram-parser.js';
import { createInboundEvent } from './inbound-event.js';

function extractSafeMedia(msgObj) {
  if (msgObj.photo && msgObj.photo.length > 0) {
    const largest = msgObj.photo.reduce((a, b) => (a.file_size > b.file_size ? a : b));
    return { type: 'image', fileId: largest.file_id, fileSize: largest.file_size };
  }
  if (msgObj.document) {
    return { type: 'file', fileId: msgObj.document.file_id, mimeType: msgObj.document.mime_type, fileName: msgObj.document.file_name };
  }
  if (msgObj.voice) {
    return { type: 'audio', fileId: msgObj.voice.file_id, duration: msgObj.voice.duration };
  }
  if (msgObj.audio) {
    return { type: 'audio', fileId: msgObj.audio.file_id, duration: msgObj.audio.duration };
  }
  return null;
}

function extractReplyContext(msgObj, normalized) {
  if (msgObj.reply_to_message) {
    return {
      externalMessageId: String(msgObj.reply_to_message.message_id),
      text: msgObj.reply_to_message.text || '',
    };
  }
  if (normalized.callbackData && normalized.callbackId) {
    return {
      callbackId: normalized.callbackId,
      callbackData: normalized.callbackData,
    };
  }
  return null;
}

export async function telegramToInboundEvent({ update, workspaceId, platformId }) {
  const normalized = normalizeTelegramUpdate(update);
  if (!normalized || !normalized.message) return null;

  const msgObj = normalized.message;
  const externalChatId = String(msgObj.chat?.id || '');
  const externalUserId = String(normalized.sender?.id || msgObj.chat?.id || '');
  const externalMessageId = String(msgObj.message_id || '');

  if (!externalChatId || !externalMessageId) return null;

  const messageType = normalized.eventType === 'callback_query' ? 'callback_query' : 'text';
  const text = normalized.text || '';

  const media = extractSafeMedia(msgObj);
  const replyContext = extractReplyContext(msgObj, normalized);

  return createInboundEvent({
    workspaceId,
    platformId,
    provider: 'telegram',
    externalMessageId,
    externalConversationId: externalChatId,
    externalUserId,
    messageType,
    text,
    media,
    replyContext,
    providerTimestamp: new Date().toISOString(),
    correlationId: crypto.randomUUID(),
  });
}
