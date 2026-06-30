import { AppError } from '../../utils/errors.js';
import { decrypt } from '../../utils/encryption.js';
import {
  channelConnectionsRepository,
  chatsRepository,
  messagesRepository,
} from '../../db/repositories/index.js';
import { tgSend, tgSendDocument, tgSendPhoto, tgSendSticker } from '../sender.js';

function resolveConnection(chat = {}) {
  return chat.channelConnections || chat.channel_connections || null;
}

function resolveProviderConversationId(chat = {}) {
  return chat.providerConversationId || chat.provider_conversation_id || chat.platformAccountId || chat.contacts?.externalId || null;
}

function isAbsoluteHttpUrl(value = '') {
  return /^https?:\/\//i.test(String(value || ''));
}

export function createTelegramOutboundService({
  chatsRepository: chatsRepo = chatsRepository,
  messagesRepository: messagesRepo = messagesRepository,
  connectionRepository = channelConnectionsRepository,
  decryptCredential = decrypt,
  sender = tgSend,
  photoSender = tgSendPhoto,
  documentSender = tgSendDocument,
  stickerSender = tgSendSticker,
} = {}) {
  async function sendTelegramConversationMessage({
    workspaceId,
    chatId,
    text,
    senderType = 'ai',
    userId = null,
    replyToMessageId = null,
    attachment = null,
    replyMarkup = null,
  }) {
    if (!text && !attachment) throw new AppError('VALIDATION', 'Message text or attachment is required', 400);
    const chat = await chatsRepo.findByIdWithConnectionAndContact({ workspaceId, chatId });
    if (!chat) throw new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404);

    const connection = resolveConnection(chat);
    if (!connection || connection.provider !== 'TELEGRAM') {
      throw new AppError('TELEGRAM_CONNECTION_NOT_FOUND', 'Telegram connection not found for conversation', 409);
    }
    if (!['CONNECTED', 'DEGRADED'].includes(connection.connectionStatus)) {
      throw new AppError('TELEGRAM_CONNECTION_INACTIVE', 'Telegram connection is inactive', 409);
    }

    const providerConversationId = resolveProviderConversationId(chat);
    if (!providerConversationId) {
      throw new AppError('TELEGRAM_OUTBOUND_CHAT_NOT_FOUND', 'Telegram provider conversation id missing', 409);
    }

    const botToken = decryptCredential(connection.credentialCiphertext, connection.credentialKeyVersion);
    if (!botToken) throw new AppError('TELEGRAM_TOKEN_INVALID', 'Telegram credential unavailable', 409);

    let result;
    if (attachment?.localFilePath) {
      if (attachment.format === 'sticker') {
        if (isAbsoluteHttpUrl(attachment.url)) {
          result = await stickerSender(botToken, providerConversationId, attachment.url);
        } else {
          result = await documentSender(botToken, providerConversationId, attachment.localFilePath, text || '', replyToMessageId);
        }
      } else if (attachment.type === 'image' || attachment.format === 'image') {
        result = await photoSender(botToken, providerConversationId, attachment.localFilePath, text || '', replyToMessageId);
      } else {
        result = await documentSender(botToken, providerConversationId, attachment.localFilePath, text || '', replyToMessageId);
      }
    } else {
      result = await sender(botToken, providerConversationId, text, replyToMessageId, replyMarkup ? { replyMarkup } : {});
    }
    const providerMessageId = result?.result?.message_id ? String(result.result.message_id) : null;

    const message = await messagesRepo.createWithConnection({
      workspaceId,
      chatId,
      channelConnectionId: connection.id,
      contactId: chat.contactId,
      platformId: chat.platformId,
      senderType,
      userId,
      direction: 'outbound',
      messageType: attachment ? (attachment.type === 'image' ? 'image' : 'file') : 'text',
      content: text || null,
      attachment,
      platformMessageId: providerMessageId,
      providerMessageId,
    });

    await connectionRepository.recordOutboundSuccess({ workspaceId, connectionId: connection.id });
    return { message, providerMessageId };
  }

  return { sendTelegramConversationMessage };
}

export const telegramOutboundService = createTelegramOutboundService();
