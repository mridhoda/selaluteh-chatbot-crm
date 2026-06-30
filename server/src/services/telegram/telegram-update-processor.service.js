import {
  agentsRepository,
  channelConnectionsRepository,
  chatsRepository,
  contactsRepository,
  messagesRepository,
  platformsRepository,
} from '../../db/repositories/index.js';
import { normalizeTelegramUpdate } from '../../integrations/telegram/telegram-parser.js';
import { generateAIReply, getAgentPromptRules } from '../ai.service.js';
import { transcribeAudio as defaultTranscribeAudio } from '../ai.service.js';
import { loadRecentMessages as defaultLoadRecentMessages } from '../../ai/context/recent-messages.js';
import { buildContext } from '../../ai/context/context-builder.js';
import { telegramOutboundService } from './telegram-outbound.service.js';
import { buildNearestOutletReplyFromCoordinates, buildNearestOutletReplyFromText } from '../location-intelligence/nearest-outlet-reply.service.js';
import { findDatabaseFileMention, findUrlFileMention } from '../../utils/fileMentions.js';
import { buildManagedFileUrl } from '../../utils/file-urls.js';
import { downloadFile } from '../../utils/downloader.js';
import { handleTelegramCommerceAction, parseTelegramAction } from '../telegram-commerce.service.js';
import { buildCallbackKey, COMMERCE_VERSION } from '../telegram-commerce.service.js';
import { createInlineKeyboard } from '../../integrations/telegram/telegram-keyboards.js';
import { cartsRepository as defaultCartsRepository, checkoutsRepository as defaultCheckoutsRepository } from '../../db/repositories/index.js';
import { telegramFileService as defaultTelegramFileService } from './telegram-file.service.js';
import { decrypt } from '../../utils/encryption.js';
import path from 'node:path';

function resolveMessage(update = {}, normalized = {}) {
  return normalized.message || update.message || update.edited_message || update.callback_query?.message || null;
}

function resolveText(update = {}, normalized = {}) {
  return normalized.text || update.callback_query?.data || '';
}

function resolveContactName(chat = {}) {
  return [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || `User ${chat.id}`;
}

function isImageFile(filename = '') {
  return /\.(png|jpe?g|gif|webp)$/i.test(filename);
}

function buildDatabaseAttachment(mention) {
  if (!mention?.file?.storedName) return null;
  const filename = mention.file.originalName || mention.file.storedName;
  const type = mention.format === 'image' || isImageFile(filename) ? 'image' : 'document';
  return {
    localFilePath: path.resolve('uploads', mention.file.storedName),
    url: buildManagedFileUrl(mention.file.storedName),
    filename,
    type,
    format: mention.format || null,
  };
}

async function buildIncomingAttachment({ msgObj, token, telegramFileService, transcribeAudio }) {
  if (Array.isArray(msgObj.photo) && msgObj.photo.length > 0) {
    const largestPhoto = msgObj.photo[msgObj.photo.length - 1];
    const saved = await telegramFileService.saveTelegramFileLocally({
      token,
      fileId: largestPhoto.file_id,
      preferredName: `photo_${largestPhoto.file_unique_id || Date.now()}.jpg`,
    });
    return { text: '[Foto dikirim]', attachment: { ...saved, filename: saved.originalName || saved.storedName, type: 'image' } };
  }
  if (msgObj.document) {
    const saved = await telegramFileService.saveTelegramFileLocally({
      token,
      fileId: msgObj.document.file_id,
      preferredName: msgObj.document.file_name || '',
    });
    return { text: '[Dokumen dikirim]', attachment: { ...saved, filename: saved.originalName || saved.storedName, type: 'document' } };
  }
  if (msgObj.voice || msgObj.audio) {
    const audioObj = msgObj.voice || msgObj.audio;
    const ext = msgObj.voice ? '.ogg' : '.mp3';
    const saved = await telegramFileService.saveTelegramFileLocally({
      token,
      fileId: audioObj.file_id,
      preferredName: `voice_${audioObj.file_unique_id || Date.now()}${ext}`,
    });
    let text = '[Voice Note]';
    try {
      text = await transcribeAudio(path.resolve('uploads', saved.storedName));
    } catch {
      // Keep fallback text when transcription provider is unavailable.
    }
    return { text, attachment: { ...saved, filename: saved.originalName || saved.storedName, type: 'audio' } };
  }
  return { text: null, attachment: null };
}

async function findAgent({ agentsRepo, workspaceId, connection, platformId }) {
  const agents = await agentsRepo.list({ workspaceId });
  return agents.find((agent) => agent.channelConnectionId === connection.id)
    || agents.find((agent) => agent.platformId === platformId)
    || agents[0]
    || null;
}

export function createTelegramUpdateProcessor({
  connectionRepository = channelConnectionsRepository,
  contactsRepository: contactsRepo = contactsRepository,
  chatsRepository: chatsRepo = chatsRepository,
  messagesRepository: messagesRepo = messagesRepository,
  platformsRepository: platformsRepo = platformsRepository,
  agentsRepository: agentsRepo = agentsRepository,
  outboundService = telegramOutboundService,
  loadRecentMessages = defaultLoadRecentMessages,
  telegramFileService = defaultTelegramFileService,
  transcribeAudio = defaultTranscribeAudio,
  cartsRepository = defaultCartsRepository,
  checkoutsRepository = defaultCheckoutsRepository,
  generateAIReply: generateAIReplyFn = generateAIReply,
} = {}) {
  async function process(event) {
    const connection = await connectionRepository.findById({
      workspaceId: event.workspaceId,
      connectionId: event.connectionId,
    });

    if (!connection || !['CONNECTED', 'DEGRADED'].includes(connection.connectionStatus)) {
      const error = new Error('Telegram connection inactive');
      error.code = 'TELEGRAM_CONNECTION_INACTIVE';
      error.retryable = false;
      throw error;
    }

    const update = event.payload || {};
    const normalized = normalizeTelegramUpdate(update);
    const msgObj = resolveMessage(update, normalized);
    if (!msgObj?.chat?.id) return { ok: true, ignored: true };

    const providerConversationId = String(msgObj.chat.id);
    const providerUserId = String(msgObj.from?.id || msgObj.chat.id);
    const providerMessageId = msgObj.message_id ? String(msgObj.message_id) : null;
    let text = resolveText(update, normalized);
    let platformId = connection.legacyPlatformId || connection.platformId || connection.metadata?.legacyPlatformId || null;
    if (!platformId) {
      const legacyPlatform = await platformsRepo.findByChannelConnectionId?.({ workspaceId: event.workspaceId, channelConnectionId: connection.id });
      platformId = legacyPlatform?.id || null;
    }

    if (providerMessageId) {
      const existingMessage = await messagesRepo.findByConnectionProviderMessage({
        channelConnectionId: connection.id,
        providerMessageId,
      });
      if (existingMessage) return { ok: true, duplicate: true };
    }

    const botToken = connection.credentialCiphertext ? decrypt(connection.credentialCiphertext) : '';
    const incoming = await buildIncomingAttachment({ msgObj, token: botToken, telegramFileService, transcribeAudio });
    const incomingAttachment = incoming.attachment;
    if (!text && incoming.text) text = incoming.text;

    const contact = await contactsRepo.upsertByChannelIdentity({
      workspaceId: event.workspaceId,
      channelConnectionId: connection.id,
      providerUserId,
      platformId,
      data: {
        name: resolveContactName(msgObj.chat),
        handle: msgObj.chat.username ? `@${msgObj.chat.username}` : null,
      },
    });

    const chat = await chatsRepo.upsertByChannelConversation({
      workspaceId: event.workspaceId,
      channelConnectionId: connection.id,
      providerConversationId,
      contactId: contact.id,
      platformId,
      data: { last_message_at: new Date().toISOString() },
    });

    const inboundMessage = await messagesRepo.createWithConnection({
      workspaceId: event.workspaceId,
      chatId: chat.id,
      channelConnectionId: connection.id,
      platformId,
      contactId: contact.id,
      senderType: 'customer',
      direction: 'inbound',
      messageType: text ? 'text' : 'unknown',
      content: text || null,
      attachment: incomingAttachment,
      platformMessageId: providerMessageId,
      providerMessageId,
      providerUpdateId: update.update_id !== undefined ? String(update.update_id) : null,
      rawPayload: { telegram: { updateId: update.update_id, eventId: event.id } },
    });
    await chatsRepo.markInboundActivity(chat.id);

    const agent = await findAgent({ agentsRepo, workspaceId: event.workspaceId, connection, platformId });
    const commerceAction = parseTelegramAction(update.callback_query?.data || '');
    if (commerceAction) {
      const commerceResponse = await handleTelegramCommerceAction({
        action: commerceAction,
        workspaceId: event.workspaceId,
        chat,
        contact,
        agent,
        chatMessageId: inboundMessage.id,
      });
      if (commerceResponse?.text) {
        await outboundService.sendTelegramConversationMessage({
          workspaceId: event.workspaceId,
          chatId: chat.id,
          text: commerceResponse.text,
          replyMarkup: commerceResponse.keyboard,
          senderType: 'ai',
        });
      }
      return { ok: true, chatId: chat.id, contactId: contact.id, commerce: true };
    }

    const sharedLocation = normalized.location || normalized.venue?.location || null;
    if (sharedLocation) {
      const nearestReply = await buildNearestOutletReplyFromCoordinates({
        workspaceId: event.workspaceId,
        latitude: sharedLocation.latitude,
        longitude: sharedLocation.longitude,
      });
      if (nearestReply) {
        await outboundService.sendTelegramConversationMessage({ workspaceId: event.workspaceId, chatId: chat.id, text: nearestReply, senderType: 'ai' });
        return { ok: true, chatId: chat.id, contactId: contact.id, location: true };
      }
    } else if (text) {
      const nearestReply = await buildNearestOutletReplyFromText({ workspaceId: event.workspaceId, text });
      if (nearestReply) {
        await outboundService.sendTelegramConversationMessage({ workspaceId: event.workspaceId, chatId: chat.id, text: nearestReply, senderType: 'ai' });
        return { ok: true, chatId: chat.id, contactId: contact.id, location: true };
      }
    }

    const history = await loadRecentMessages({ chatId: chat.id, limit: 10 });
    const context = await buildContext({
      chat,
      agent: agent ? { ...agent, displayName: agent.name } : null,
      recentMessages: history,
    });

    let replyText = '';
    let shouldSendCheckoutPrompt = false;
    const isStartCommand = text?.trim() === '/start';
    if (isStartCommand || context.greetingFlags?.isFirstAssistantMessageInChat) {
      replyText = (agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?').replace('{{name}}', contact.name || '');
    } else if (text) {
      const promptRules = getAgentPromptRules(agent);
      const aiReply = await generateAIReplyFn({
        system: agent?.behavior || promptRules.fallbackSystemPrompt,
        prompt: agent?.prompt || '',
        message: inboundMessage,
        knowledge: agent?.knowledge,
        agent,
        chat,
        history,
      });
      replyText = typeof aiReply === 'string' ? aiReply : aiReply?.text || '';
      shouldSendCheckoutPrompt = typeof aiReply === 'object' ? aiReply?.cartItemAdded === true : false;
    }

    if (replyText) {
      const dbMention = findDatabaseFileMention(replyText, agent);
      if (dbMention) {
        const attachment = buildDatabaseAttachment(dbMention);
        const cleanedText = (replyText || '').replace(dbMention.token, dbMention.altText || '').trim();
        await outboundService.sendTelegramConversationMessage({
          workspaceId: event.workspaceId,
          chatId: chat.id,
          text: cleanedText || dbMention.altText || '',
          attachment,
          senderType: 'ai',
        });
        return { ok: true, chatId: chat.id, contactId: contact.id, attachment: true };
      }

      const urlMention = findUrlFileMention(replyText);
      if (urlMention) {
        const downloaded = await downloadFile(urlMention.url);
        const type = urlMention.format === 'image' || isImageFile(downloaded.filename) ? 'image' : 'document';
        const cleanedText = (replyText || '').replace(urlMention.token, urlMention.altText || '').trim();
        await outboundService.sendTelegramConversationMessage({
          workspaceId: event.workspaceId,
          chatId: chat.id,
          text: cleanedText || urlMention.altText || '',
          attachment: {
            localFilePath: downloaded.filePath,
            url: urlMention.url,
            filename: downloaded.originalName,
            type,
            format: urlMention.format || null,
          },
          senderType: 'ai',
        });
        return { ok: true, chatId: chat.id, contactId: contact.id, attachment: true };
      }

      await outboundService.sendTelegramConversationMessage({
        workspaceId: event.workspaceId,
        chatId: chat.id,
        text: replyText,
        senderType: 'ai',
      });

      if (shouldSendCheckoutPrompt) {
        await sendCheckoutPromptIfAvailable({
          workspaceId: event.workspaceId,
          chat,
          contact,
          cartsRepository,
          checkoutsRepository,
          outboundService,
        });
      }
    }

    return { ok: true, chatId: chat.id, contactId: contact.id };
  }

  return { process };
}

async function sendCheckoutPromptIfAvailable({ workspaceId, chat, contact, cartsRepository, checkoutsRepository, outboundService }) {
  const contactId = chat.contactId || contact.id;
  const currentOutletId = chat.currentOutletId || contact.lastOutletId || null;
  if (!contactId) return null;
  const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId, outletId: currentOutletId });
  if (!cart || !cart.items?.length || ['converted', 'cancelled'].includes(cart.status)) return null;
  const checkout = await checkoutsRepository.create({
    workspaceId,
    outletId: cart.outletId,
    contactId,
    chatId: chat.id,
    cartId: cart.id,
    items: cart.items,
    subtotalAmount: cart.total,
    totalAmount: cart.total,
    currency: 'IDR',
    idempotencyKey: `tg_checkout_${cart.id}_${Date.now()}`,
    status: 'pending',
    customerSnapshot: { contactName: contact?.name || '' },
    fulfillmentSnapshot: { method: 'pickup', outletName: cart.outletName || '' },
  });
  const checkoutPrompt = 'Silakan klik tombol di bawah untuk checkout dan dapatkan link pembayaran:';
  await outboundService.sendTelegramConversationMessage({
    workspaceId,
    chatId: chat.id,
    text: checkoutPrompt,
    replyMarkup: createInlineKeyboard([
      [{ text: '✅ Checkout & Dapatkan Link Bayar', callback_data: `${buildCallbackKey('checkout', 'confirm', String(checkout.id), COMMERCE_VERSION)}` }],
      [{ text: '🛒 Lihat Keranjang', callback_data: `${buildCallbackKey('cart', 'view', null, COMMERCE_VERSION)}` }],
    ]),
    senderType: 'ai',
  });
  return checkout;
}

export const telegramUpdateProcessor = createTelegramUpdateProcessor();
