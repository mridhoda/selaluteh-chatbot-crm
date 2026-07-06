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
import { buildInvalidAddressReply, buildNearestOutletReplyPayloadFromCoordinates, buildNearestOutletReplyPayloadFromText, validateCustomerLocationText } from '../location-intelligence/nearest-outlet-reply.service.js';
import { findDatabaseFileMention, findUrlFileMention } from '../../utils/fileMentions.js';
import { buildManagedFileUrl } from '../../utils/file-urls.js';
import { downloadFile } from '../../utils/downloader.js';
import {
  buildOutletRecommendationKeyboard,
  buildSingleOutletConfirmationKeyboard,
  getLatestRecommendedOutletId,
  getRecommendedOutletIdFromTextSelection,
  handleTelegramCommerceAction,
  isOutletConfirmationText,
  parseTelegramAction,
  rememberLatestOutletRecommendation,
  selectOutletForChat,
} from '../telegram-commerce.service.js';
import { buildCallbackKey, COMMERCE_VERSION } from '../telegram-commerce.service.js';
import { createInlineKeyboard } from '../../integrations/telegram/telegram-keyboards.js';
import { cartsRepository as defaultCartsRepository, checkoutsRepository as defaultCheckoutsRepository } from '../../db/repositories/index.js';
import { telegramFileService as defaultTelegramFileService } from './telegram-file.service.js';
import { decrypt } from '../../utils/encryption.js';
import path from 'node:path';

function resolveMessage(update = {}, normalized = {}) {
  return normalized.message || update.message || update.edited_message || update.callback_query?.message || null;
}

function resolveTelegramActor(update = {}, msgObj = {}) {
  return update.callback_query?.from || msgObj.from || msgObj.chat || {};
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

function shouldAttachOutletConfirmationButton(text = '', chat = {}) {
  if (!getLatestRecommendedOutletId(chat)) return false;
  const normalized = String(text || '').toLowerCase();
  return normalized.includes('setuju')
    || normalized.includes('outlet itu')
    || normalized.includes('memesan dari outlet')
    || normalized.includes('memilih outlet')
    || normalized.includes('tea lanjutkan');
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

async function reverseGeocodeLocation({ latitude, longitude }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !process.env.GOOGLE_MAPS_API_KEY) return null;
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lon}`);
    url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY);
    url.searchParams.set('language', 'id');
    const response = await fetch(url);
    const payload = await response.json();
    const result = payload?.results?.[0];
    if (!result?.formatted_address) return null;
    const preferredName = result.address_components?.find((component) => (
      component.types?.some((type) => ['point_of_interest', 'establishment', 'premise', 'route'].includes(type))
    ))?.long_name;
    return {
      name: preferredName || result.formatted_address.split(',')[0],
      address: result.formatted_address,
    };
  } catch (err) {
    console.warn('[telegram] reverse geocode warning:', err.message);
    return null;
  }
}

async function buildLocationAttachment(location = {}, fallbackName = 'Shared location') {
  const latitude = location.latitude;
  const longitude = location.longitude;
  const enriched = (!location.name || !location.address)
    ? await reverseGeocodeLocation({ latitude, longitude })
    : null;
  const address = location.address || enriched?.address || '';
  return {
    type: 'location',
    latitude,
    longitude,
    name: location.name || enriched?.name || (address ? address.split(',')[0] : fallbackName),
    address,
    url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  };
}

async function buildIncomingAttachment({ msgObj, token, telegramFileService, transcribeAudio }) {
  const sharedLocation = msgObj.location || msgObj.venue?.location || null;
  if (sharedLocation) {
    const attachment = await buildLocationAttachment({
      ...sharedLocation,
      name: msgObj.venue?.title,
      address: msgObj.venue?.address,
    });
    return {
      text: '[Lokasi dibagikan]',
      attachment,
    };
  }
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
  const connectionAgent = agents.find((agent) => agent.channelConnectionId === connection.id);
  if (connectionAgent) return connectionAgent;
  const platformAgent = platformId ? agents.find((agent) => agent.platformId === platformId) : null;
  if (platformAgent) return platformAgent;
  const unassignedAgents = agents.filter((agent) => !agent.channelConnectionId && !agent.platformId);
  return unassignedAgents.length === 1 ? unassignedAgents[0] : null;
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

    const isCallbackQuery = !!update.callback_query;
    const actor = resolveTelegramActor(update, msgObj);
    const providerConversationId = String(msgObj.chat.id);
    const providerUserId = String(actor?.id || msgObj.chat.id);
    const originalProviderMessageId = msgObj.message_id ? String(msgObj.message_id) : null;
    const providerMessageId = isCallbackQuery
      ? (update.callback_query?.id ? `callback:${update.callback_query.id}` : null)
      : originalProviderMessageId;
    let text = resolveText(update, normalized);
    let platformId = connection.legacyPlatformId || connection.platformId || connection.metadata?.legacyPlatformId || null;
    if (!platformId) {
      const legacyPlatform = await platformsRepo.findByChannelConnectionId?.({ workspaceId: event.workspaceId, channelConnectionId: connection.id });
      platformId = legacyPlatform?.id || null;
    }

    // For callback_query, msgObj is the *original bot message* that contained the
    // inline keyboard — its message_id already exists in the DB as an outbound
    // message.  Checking for duplicates here would always fire and silently drop
    // every button press.  Skip the check for callback_query events.
    if (providerMessageId && !isCallbackQuery) {
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
        name: resolveContactName(actor),
        handle: actor.username ? `@${actor.username}` : null,
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
      messageType: incomingAttachment?.type === 'location' ? 'location' : (text ? 'text' : 'unknown'),
      content: text || null,
      attachment: incomingAttachment,
      platformMessageId: providerMessageId,
      providerMessageId,
      providerUpdateId: update.update_id !== undefined ? String(update.update_id) : null,
      rawPayload: {
        telegram: { updateId: update.update_id, eventId: event.id, originalMessageId: originalProviderMessageId, callbackQueryId: update.callback_query?.id || null },
        ...(incomingAttachment ? { attachment: incomingAttachment } : {}),
      },
    });
    await chatsRepo.markInboundActivity({ workspaceId: event.workspaceId, chatId: chat.id });

    const agent = await findAgent({ agentsRepo, workspaceId: event.workspaceId, connection, platformId });
    if (!agent) {
      console.warn('[telegram-v1] no agent configured for connection', connection.id);
      return { ok: true, chatId: chat.id, contactId: contact.id, ignored: true, reason: 'no_agent_configured' };
    }
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
      const nearestReply = await buildNearestOutletReplyPayloadFromCoordinates({
        workspaceId: event.workspaceId,
        latitude: sharedLocation.latitude,
        longitude: sharedLocation.longitude,
      });
      if (nearestReply) {
        await rememberLatestOutletRecommendation({ chat, recommendedOutlets: nearestReply.recommendedOutlets });
        await outboundService.sendTelegramConversationMessage({
          workspaceId: event.workspaceId,
          chatId: chat.id,
          text: nearestReply.text,
          replyMarkup: buildOutletRecommendationKeyboard(nearestReply.recommendedOutlets),
          senderType: 'ai',
        });
        return { ok: true, chatId: chat.id, contactId: contact.id, location: true };
      }
    } else if (text) {
      const locationValidation = validateCustomerLocationText(text);
      if (!locationValidation.valid && ['contradictory_address', 'outside_supported_area'].includes(locationValidation.reason)) {
        const invalidAddressReply = buildInvalidAddressReply(locationValidation.reason);
        await outboundService.sendTelegramConversationMessage({ workspaceId: event.workspaceId, chatId: chat.id, text: invalidAddressReply, senderType: 'ai' });
        return { ok: true, chatId: chat.id, contactId: contact.id, location: true };
      }
      const nearestReply = await buildNearestOutletReplyPayloadFromText({ workspaceId: event.workspaceId, text });
      if (nearestReply) {
        await rememberLatestOutletRecommendation({ chat, recommendedOutlets: nearestReply.recommendedOutlets });
        await outboundService.sendTelegramConversationMessage({
          workspaceId: event.workspaceId,
          chatId: chat.id,
          text: nearestReply.text,
          replyMarkup: buildOutletRecommendationKeyboard(nearestReply.recommendedOutlets),
          senderType: 'ai',
        });
        return { ok: true, chatId: chat.id, contactId: contact.id, location: true };
      }

      {
        const recommendedOutletId = getRecommendedOutletIdFromTextSelection(text, chat)
          || (isOutletConfirmationText(text) ? getLatestRecommendedOutletId(chat) : null);
        if (recommendedOutletId) {
          const { message } = await selectOutletForChat({
            workspaceId: event.workspaceId,
            chat,
            contact,
            agent,
            outletId: recommendedOutletId,
            chatMessageId: inboundMessage.id,
          });
          await outboundService.sendTelegramConversationMessage({
            workspaceId: event.workspaceId,
            chatId: chat.id,
            text: message.text,
            replyMarkup: message.keyboard,
            senderType: 'ai',
          });
          return { ok: true, chatId: chat.id, contactId: contact.id, commerce: true };
        }
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
        replyMarkup: shouldAttachOutletConfirmationButton(replyText, chat)
          ? buildSingleOutletConfirmationKeyboard(getLatestRecommendedOutletId(chat))
          : null,
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
