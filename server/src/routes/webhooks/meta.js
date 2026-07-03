import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import {
  platformsSupabaseRepository,
  agentsSupabaseRepository,
  contactsSupabaseRepository,
  chatsSupabaseRepository,
  messagesSupabaseRepository,
  checkoutsRepository,
  cartsRepository,
} from '../../db/repositories/index.js';
import { generateAIReply, getAgentPromptRules } from '../../services/ai.service.js';
import { createCheckout, confirmCheckout } from '../../services/checkout.service.js';
import { createOrderFromCheckout } from '../../services/order.service.js';
import { buildPaymentInstruction, createPaymentForOrder, createPaymentSessionForOrder } from '../../services/payment.service.js';
import {
  igGetUserProfile,
  igSend,
  igSendDocument,
  waSend,
  waSendDocument,
  waSendImage,
  waSendSticker,
  waSendInteractiveButton,
} from '../../services/sender.js';
import { findDatabaseFileMention, findUrlFileMention } from '../../utils/fileMentions.js';
import {
  beginWebhookEvent,
  getMetaMessageEventId,
  markWebhookFailed,
  markWebhookProcessed,
} from '../../services/webhook-idempotency.service.js';
import { recordInboundMessage, recordOutboundMessage } from '../../services/chat-message.service.js';
import { assertWebhookPayloadSafe, verifyMetaSignature } from '../../security/webhook-security.js';
import { logSecurityEvent } from '../../config/logger.js';
import { buildManagedFileUrl, buildPublicFileUrl } from '../../utils/file-urls.js';
import { buildContext } from '../../ai/context/context-builder.js';
import { buildInvalidAddressReply, buildNearestOutletReplyFromCoordinates, validateCustomerLocationText } from '../../services/location-intelligence/nearest-outlet-reply.service.js';

const router = express.Router();

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
    console.warn('[meta] reverse geocode warning:', err.message);
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

function getPublicFileUrl(storedName) {
  const base = process.env.PUBLIC_FILES_BASE_URL || `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/public-files`;
  return `${base.replace(/\/$/, '')}/${storedName}`;
}

function isImageFile(filename = '') {
  return /\.(png|jpe?g|gif|webp)$/i.test(filename);
}

function isWhatsappStickerFile(filename = '') {
  return /\.webp$/i.test(filename);
}

function resolveMessageType(filename = '', format = null) {
  if (format === 'image' || isImageFile(filename)) return 'image';
  return 'file';
}

function extractDatabaseAttachment(replyText, agent) {
  const mention = findDatabaseFileMention(replyText, agent);
  if (mention?.file?.storedName) {
    const cleanedText = (replyText || '').replace(mention.token, mention.altText || '').trim();
    const filename = mention.file.originalName || mention.file.storedName;
    return {
      text: cleanedText || mention.altText || '',
      messageType: resolveMessageType(filename, mention.format),
      attachment: {
        url: getPublicFileUrl(mention.file.storedName),
        filename,
        storedName: mention.file.storedName,
        type: resolveMessageType(filename, mention.format) === 'image' ? 'image' : 'document',
        format: mention.format || null,
      },
    };
  }

  const urlMention = findUrlFileMention(replyText);
  if (urlMention) {
    const cleanedText = (replyText || '').replace(urlMention.token, urlMention.altText || '').trim();
    const filename = urlMention.url.split('/').pop() || 'file';
    return {
      text: cleanedText || urlMention.altText || '',
      messageType: resolveMessageType(filename, urlMention.format),
      attachment: {
        url: urlMention.url,
        filename,
        storedName: filename,
        type: resolveMessageType(filename, urlMention.format) === 'image' ? 'image' : 'document',
        format: urlMention.format || null,
      },
    };
  }

  return null;
}

async function sendWhatsappTextOrAttachment({ platform, fromPhoneNumberId, to, text, agent }) {
  let replyText = text || '';
  let messageType = 'text';
  let attachment = null;
  const databaseAttachment = extractDatabaseAttachment(replyText, agent);
  if (databaseAttachment) {
    replyText = databaseAttachment.text;
    messageType = databaseAttachment.messageType || 'file';
    attachment = databaseAttachment.attachment;
  }

  if (attachment?.url) {
    if (attachment.format === 'sticker' && isWhatsappStickerFile(attachment.filename || attachment.url)) {
      await waSendSticker(platform.token, fromPhoneNumberId, to, attachment.url);
      if (replyText) await waSend(platform.token, fromPhoneNumberId, to, replyText);
    } else if (attachment.format === 'image' || isImageFile(attachment.filename || attachment.url)) {
      await waSendImage(platform.token, fromPhoneNumberId, to, attachment.url, replyText || '');
    } else {
      await waSendDocument(platform.token, fromPhoneNumberId, to, attachment.url, attachment.filename);
      if (replyText) await waSend(platform.token, fromPhoneNumberId, to, replyText);
    }
  } else if (replyText) {
    await waSend(platform.token, fromPhoneNumberId, to, replyText);
  }

  return { text: replyText, messageType, attachment };
}

async function sendInstagramTextOrAttachment({ platform, to, text, agent }) {
  let replyText = text || '';
  let messageType = 'text';
  let attachment = null;
  const databaseAttachment = extractDatabaseAttachment(replyText, agent);
  if (databaseAttachment) {
    replyText = databaseAttachment.text;
    messageType = databaseAttachment.messageType || 'file';
    attachment = databaseAttachment.attachment;
  }

  if (attachment?.url) {
    await igSendDocument(platform.token, to, attachment.url, replyText);
  } else if (replyText) {
    await igSend(platform.token, to, replyText);
  }

  return { text: replyText, messageType, attachment };
}

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  console.log('[meta] verification request received');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

router.post('/', async (req, res) => {
  res.sendStatus(200);

  try {
    assertWebhookPayloadSafe(req.body);
    const data = req.body;
    const signatureHeader = req.get('x-hub-signature-256');
    console.log('[meta] webhook received, signature present:', !!signatureHeader, 'object:', data?.object);
    if (!verifyMetaSignature(req.rawBody || req.body, signatureHeader, process.env.META_APP_SECRET)) {
      console.warn('[meta] signature REJECTED, header:', signatureHeader?.slice(0, 20));
      logSecurityEvent('warn', '[meta] invalid webhook signature', { signatureHeader });
      return;
    }

    if (data.object === 'whatsapp_business_account') {
      await handleWhatsapp(data);
    } else if (data.object === 'instagram') {
      await handleInstagram(data);
    }
  } catch (err) {
    console.error('Webhook /meta error:', err);
  }
});

async function getMetaMediaUrl(mediaId, token) {
  const url = `https://graph.facebook.com/v20.0/${mediaId}?access_token=${token}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.error || !data.url) {
    throw new Error(
      `Failed to get Meta media URL: ${JSON.stringify(data.error || data)}`,
    );
  }
  return data.url;
}

async function saveMetaFileLocally({ url, token, preferredName }) {
  const downloadResp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!downloadResp.ok) {
    throw new Error(
      `Download failed from Meta: ${downloadResp.status} ${downloadResp.statusText}`,
    );
  }
  const buffer = Buffer.from(await downloadResp.arrayBuffer());
  const originalBase = preferredName || `meta_file_${Date.now()}`;
  const safeOriginal = originalBase.replace(/[\\/:*?"<>|]+/g, '_');
  await fs.mkdir('uploads', { recursive: true });
  const storedName = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}_${safeOriginal}`;
  const storedPath = path.resolve('uploads', storedName);
  await fs.writeFile(storedPath, buffer);
  return { storedName, originalName: safeOriginal };
}

export async function handleWhatsAppCommerceAction({ actionId, workspaceId, chat, contact, agent, platform, fromPhoneNumberId, from }) {
  if (!actionId) return null;

  // actionId format: wa_cart_view
  if (actionId === 'wa_cart_view') {
    try {
      const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId: contact.id });
      if (!cart || !cart.items?.length) {
        return { text: 'Keranjang belanja kamu kosong.' };
      }
      const lines = ['Keranjang Belanja:\n'];
      for (const item of cart.items) {
        const subtotal = (item.subtotal || item.subtotalAmount || 0).toLocaleString('id-ID');
        lines.push(`${item.name} x${item.quantity} = Rp ${subtotal}`);
      }
      const total = (cart.total || 0).toLocaleString('id-ID');
      lines.push('', `Total: Rp ${total}`);
      return { text: lines.join('\n') };
    } catch (err) {
      return { text: `Gagal melihat keranjang: ${err.message}` };
    }
  }

  // actionId format: wa_checkout_confirm_{checkoutId}
  if (actionId.startsWith('wa_checkout_confirm_')) {
    const checkoutId = actionId.replace('wa_checkout_confirm_', '');
    try {
      const confirmed = await confirmCheckout({ workspaceId, checkoutId });
      const order = await createOrderFromCheckout({ workspaceId, checkout: confirmed, user: null });

      let payment;
      let paymentInstruction;
      try {
        payment = await createPaymentSessionForOrder({
          workspaceId,
          orderId: order.id,
          customer: {
            name: contact?.name || '',
            phone: contact?.phone || contact?.platformAccountId || '',
          },
        });
        paymentInstruction = `🔗 *Link pembayaran:* ${payment.paymentUrl || payment.paymentLink}`;
      } catch (paymentLinkErr) {
        console.warn('[wa-commerce] Payment link session request failed, falling back to manual payment:', paymentLinkErr.message);
        payment = await createPaymentForOrder({
          workspaceId,
          orderId: order.id,
          customer: {
            name: contact?.name || '',
            phone: contact?.phone || contact?.platformAccountId || '',
          },
          provider: 'manual',
        });
        paymentInstruction = `Gagal membuat link pembayaran. Silakan lakukan pembayaran manual.\n\n${buildPaymentInstruction(payment)}`;
      }
      await checkoutsRepository.updateStatus({ workspaceId, checkoutId, status: 'converted' });

      if (confirmed.cartId) {
        await cartsRepository.setStatus({ workspaceId, cartId: confirmed.cartId, status: 'converted' });
      }

      return {
        text: `Silakan lanjutkan pembayaran:\n\nNo. Pesanan: ${order.orderNumber}\nTotal: Rp ${(order.totals?.total || 0).toLocaleString('id-ID')}\n\n${paymentInstruction}`,
      };
    } catch (err) {
      return { text: `Gagal konfirmasi: ${err.message}` };
    }
  }

  return null;
}

async function handleWhatsapp(data) {
  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      if (!value?.messages?.length) continue;

      const fromPhoneNumberId = value.metadata?.phone_number_id;
      const platformAccountId = entry.id;
      // WhatsApp webhook entry.id is the WABA ID, while phone_number_id is the
      // exact receiving number. In multi-workspace setups the phone number is
      // the safest primary routing key; account_id remains a legacy fallback.
      let platform = fromPhoneNumberId
        ? await platformsSupabaseRepository.findByPhoneNumberId({ phoneNumberId: fromPhoneNumberId, type: 'whatsapp' })
        : null;

      if (!platform && platformAccountId) {
        platform = await platformsSupabaseRepository.findByAccountId({ accountId: platformAccountId, type: 'whatsapp' });
      }

      if (!platform) {
        console.warn(
          '[meta] whatsapp platform not found for accountId:',
          platformAccountId,
          'or phone_number_id:',
          fromPhoneNumberId
        );
        continue;
      }

      if (platform && !platform.webhookConfigured) {
        await platformsSupabaseRepository.update({
          workspaceId: platform.workspaceId,
          platformId: platform.id,
          updates: { webhookConfigured: true },
        });
        platform.webhookConfigured = true;
      }

      const workspaceAgents = await agentsSupabaseRepository.list({ workspaceId: platform.workspaceId });
      let agent = workspaceAgents.find((a) => a.platformId === platform.id);
      if (!agent) agent = workspaceAgents[0] || null;
      const promptRules = getAgentPromptRules(agent);
      const system = agent?.behavior || promptRules.fallbackSystemPrompt;
      const prompt = agent?.prompt || '';
      const welcome =
        agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

      for (const message of value.messages) {
        let webhookEvent = null;
        const from = message.from;
        const text = message.text?.body || '';
        const sharedLocation = message.location || null;
        let incomingAttachment = null;

        const webhookResult = await beginWebhookEvent({
          provider: 'meta:whatsapp',
          eventType: message.type || 'message',
          externalEventId: getMetaMessageEventId(message, { senderId: from }),
          workspaceId: platform.workspaceId,
          platformId: platform.id,
          payload: message,
          signatureValid: true,
        });
        webhookEvent = webhookResult.event;
        if (webhookResult.duplicate) {
          console.log('[meta] duplicate WhatsApp webhook ignored:', message.id || message.timestamp);
          continue;
        }

        try {

        if (message.image) {
          try {
            const mediaUrl = await getMetaMediaUrl(
              message.image.id,
              platform.token,
            );
            const saved = await saveMetaFileLocally({
              url: mediaUrl,
              token: platform.token,
              preferredName: `whatsapp_image_${message.image.id}.jpg`,
            });
            incomingAttachment = {
              url: buildPublicFileUrl(saved.storedName),
              filename: saved.originalName,
            };
          } catch (e) {
            console.error('[meta] Failed to process WhatsApp image:', e);
          }
        }

        // ── Handle interactive button reply (checkout confirm) ──
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
          const contactName = value.contacts?.[0]?.profile?.name || from;
          const contact = await contactsSupabaseRepository.upsertByProviderIdentity(
            platform.workspaceId,
            platform.id,
            from,
            { name: contactName, handle: from },
          );
          const chat = await chatsSupabaseRepository.upsertByPlatformContact({
            workspaceId: platform.workspaceId,
            platformId: platform.id,
            contactId: contact.id,
            data: { agent_id: agent?.id || null, last_message_at: new Date().toISOString() },
          });

          const actionId = message.interactive.button_reply.id;
          console.log(`[wa-commerce] interactive reply: ${actionId}`);
          const actionResult = await handleWhatsAppCommerceAction({
            actionId,
            workspaceId: platform.workspaceId,
            chat,
            contact,
            agent,
            platform,
            fromPhoneNumberId,
            from,
          });
          if (actionResult?.text) {
            await waSend(platform.token, fromPhoneNumberId, from, actionResult.text);
            await recordOutboundMessage({
              chatId: chat.id,
              workspaceId: platform.workspaceId,
              from: 'ai',
              text: actionResult.text,
            });
          }
          await markWebhookProcessed(webhookEvent);
          continue;
        }

        if (!text && !incomingAttachment && !sharedLocation) {
          console.log('[meta] Skipping empty WhatsApp message.');
          await markWebhookProcessed(webhookEvent);
          continue;
        }

        const contactName = value.contacts?.[0]?.profile?.name || from;
        const contact = await contactsSupabaseRepository.upsertByProviderIdentity(
          platform.workspaceId,
          platform.id,
          from,
          { name: contactName, handle: from },
        );

        const chat = await chatsSupabaseRepository.upsertByPlatformContact({
          workspaceId: platform.workspaceId,
          platformId: platform.id,
          contactId: contact.id,
          data: { agent_id: agent?.id || null, last_message_at: new Date().toISOString() },
        });

        if (sharedLocation) {
          const locationAttachment = await buildLocationAttachment(sharedLocation);
          const nearestReply = await buildNearestOutletReplyFromCoordinates({
            workspaceId: platform.workspaceId,
            latitude: sharedLocation.latitude,
            longitude: sharedLocation.longitude,
          });
          const locationText = locationAttachment.name || locationAttachment.address
            ? [locationAttachment.name, locationAttachment.address].filter(Boolean).join(' - ')
            : `Shared location: ${sharedLocation.latitude},${sharedLocation.longitude}`;
          await recordInboundMessage({
            chat,
            workspaceId: platform.workspaceId,
            text: locationText,
            attachment: locationAttachment,
            messageType: 'location',
            platformMessageId: message.id || null,
          });
          if (nearestReply) {
            await waSend(platform.token, fromPhoneNumberId, from, nearestReply);
            await recordOutboundMessage({
              chatId: chat.id,
              workspaceId: platform.workspaceId,
              from: 'ai',
              text: nearestReply,
            });
          }
          await markWebhookProcessed(webhookEvent);
          continue;
        }

        if (text) {
          const locationValidation = validateCustomerLocationText(text);
          if (!locationValidation.valid && ['contradictory_address', 'outside_supported_area'].includes(locationValidation.reason)) {
            const invalidAddressReply = buildInvalidAddressReply(locationValidation.reason);
            await waSend(platform.token, fromPhoneNumberId, from, invalidAddressReply);
            await recordOutboundMessage({
              chatId: chat.id,
              workspaceId: platform.workspaceId,
              from: 'ai',
              text: invalidAddressReply,
            });
            await markWebhookProcessed(webhookEvent);
            continue;
          }
        }
        const isNewChat = !chat.updatedAt || (new Date(chat.createdAt).getTime() > Date.now() - 2000);

        const userMessage = await recordInboundMessage({
          chat,
          workspaceId: platform.workspaceId,
          text,
          attachment: incomingAttachment,
          platformMessageId: message.id || null,
        });

        if (chat.takenOverByUserId || chat.takeoverBy) {
          const takeoverUser = chat.takenOverByUserId || chat.takeoverBy;
          console.log(`[meta] chat ${chat.id} is handled by human (takeoverBy: ${takeoverUser}), skipping AI reply.`);
          await markWebhookProcessed(webhookEvent);
          continue;
        } else {
          console.log(`[meta] chat ${chat.id} is NOT handled by human, proceeding to AI reply.`);
        }

        const chatHistoryForGreeting = await messagesSupabaseRepository.listByChatId(chat.id, { limit: 5 });
        const { greetingFlags: computedGreetingFlags } = await buildContext({
          chat,
          agent: agent ? { ...agent, displayName: agent.name } : null,
          recentMessages: chatHistoryForGreeting,
        });

        if (computedGreetingFlags.isFirstAssistantMessageInChat) {
          const processedWelcome = welcome.replace('{{name}}', contact.name);
          const sentWelcome = await sendWhatsappTextOrAttachment({
            platform,
            fromPhoneNumberId,
            to: from,
            text: processedWelcome,
            agent,
          });
          await recordOutboundMessage({
            chatId: chat.id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: sentWelcome.text,
            attachment: sentWelcome.attachment,
            messageType: sentWelcome.messageType,
          });
          await markWebhookProcessed(webhookEvent);
          continue;
        }

        if (userMessage && (!isNewChat || userMessage.text?.toLowerCase() !== '/start')) {
          let reply;
          try {
            const history = await messagesSupabaseRepository.listByChatId(chat.id, { limit: 20 });
            const effectiveSystem = computedGreetingFlags.isFirstAssistantMessageInChat
              ? system
              : `${system}\n\n${promptRules.noReintroInstruction}`;
            reply = await generateAIReply({
              system: effectiveSystem,
              prompt,
              message: userMessage,
              knowledge: agent?.knowledge,
              agent,
              chat,
              history,
            });
          } catch (e) {
            console.error('[meta] AI error:', e);
            reply = { text: `Echo: ${userMessage.text}` };
          }

          let replyText = typeof reply === 'string' ? reply : reply.text;
          let attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;
          let sentReply = { text: replyText, attachment, messageType: attachment ? resolveMessageType(attachment.filename || attachment.url) : 'text' };

          if (attachment?.url) {
            if (isImageFile(attachment.filename || attachment.url)) {
              await waSendImage(platform.token, fromPhoneNumberId, from, attachment.url, replyText || '');
            } else {
              await waSendDocument(platform.token, fromPhoneNumberId, from, attachment.url, attachment.filename);
              if (replyText) await waSend(platform.token, fromPhoneNumberId, from, replyText);
            }
          } else {
            sentReply = await sendWhatsappTextOrAttachment({
              platform,
              fromPhoneNumberId,
              to: from,
              text: replyText,
              agent,
            });
          }

          await recordOutboundMessage({
            chatId: chat.id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: sentReply.text,
            attachment: sentReply.attachment,
            messageType: sentReply.messageType,
          });

          // ── Show checkout button ONLY when add_cart_item was called this turn ──
          const cartItemAdded = typeof reply === 'object' ? (reply?.cartItemAdded || false) : false;
          if (replyText && contact.id && cartItemAdded) {
            try {
              const cart = await cartsRepository.findActiveByContact({ workspaceId: platform.workspaceId, contactId: contact.id });
              if (cart && cart.items?.length > 0 && !['converted', 'cancelled'].includes(cart.status)) {
                const idempotencyKey = `wa_checkout_${cart.id}`;
                let checkout = await checkoutsRepository.findByIdempotencyKey({ workspaceId: platform.workspaceId, key: idempotencyKey });
                if (!checkout || checkout.status !== 'pending') {
                  const checkoutKey = checkout ? `wa_checkout_${cart.id}_${Date.now()}` : idempotencyKey;
                  checkout = await createCheckout({
                    workspaceId: platform.workspaceId,
                    outletId: cart.outletId,
                    contactId: contact.id,
                    chatId: chat.id,
                    idempotencyKey: checkoutKey,
                    customerSnapshot: { contactName: contact?.name || '' },
                    fulfillmentSnapshot: { method: 'pickup', outletName: cart.outletName || '' },
                  });
                }
                await waSendInteractiveButton(
                  platform.token, fromPhoneNumberId, from,
                  'Silakan klik tombol di bawah untuk checkout dan dapatkan link pembayaran:',
                  [
                    { id: `wa_checkout_confirm_${checkout.id}`, title: 'Checkout & Bayar' },
                    { id: 'wa_cart_view', title: 'Lihat Keranjang' },
                  ],
                );
                await recordOutboundMessage({ chatId: chat.id, workspaceId: platform.workspaceId, from: 'ai', text: 'WhatsApp checkout button sent' });
              }
            } catch (checkoutBtnErr) {
              console.error('[wa-commerce] Failed to show checkout button:', checkoutBtnErr);
            }
          }
        }
        await markWebhookProcessed(webhookEvent);
        } catch (err) {
          await markWebhookFailed(webhookEvent, err);
          throw err;
        }
      }
    }
  }
}

async function handleInstagram(data) {
  for (const entry of data.entry ?? []) {
    for (const message of entry.messaging ?? []) {
      let webhookEvent = null;
      if (!message.message) {
        console.log('[meta] skipping instagram event without message payload:', message);
        continue;
      }

      const from = message.sender?.id;
      if (!from) {
        console.warn('[meta] instagram message missing sender id:', message);
        continue;
      }

      const text = message.message.text || '';
      let incomingAttachment = null;

      if (message.message.attachments) {
        const imageAttachment = message.message.attachments.find(a => a.type === 'image');
        if (imageAttachment) {
          try {
            const saved = await saveMetaFileLocally({
              url: imageAttachment.payload.url,
              token: null, // Instagram attachment URLs are public
              preferredName: `instagram_image_${from}_${Date.now()}.jpg`,
            });
            incomingAttachment = {
              url: buildPublicFileUrl(saved.storedName),
              filename: saved.originalName,
            };
          } catch (e) {
            console.error('[meta] Failed to process Instagram image:', e);
          }
        }
      }

      if (!text && !incomingAttachment) {
        console.log('[meta] Skipping empty Instagram message.');
        continue;
      }

      const platformAccountId = message.recipient?.id || entry.id;
      const platform = await platformsSupabaseRepository.findByAccountId({ accountId: platformAccountId, type: 'instagram' });

      if (!platform) {
        console.warn(`[meta] instagram platform not found for accountId: ${platformAccountId}`);
        continue;
      }

      if (platform && !platform.webhookConfigured) {
        await platformsSupabaseRepository.update({
          workspaceId: platform.workspaceId,
          platformId: platform.id,
          updates: { webhookConfigured: true },
        });
        platform.webhookConfigured = true;
      }

      const webhookResult = await beginWebhookEvent({
        provider: 'meta:instagram',
        eventType: 'message',
        externalEventId: getMetaMessageEventId(message.message, { senderId: from, timestamp: message.timestamp }),
        workspaceId: platform.workspaceId,
        platformId: platform.id,
        payload: message,
        signatureValid: true,
      });
      webhookEvent = webhookResult.event;
      if (webhookResult.duplicate) {
        console.log('[meta] duplicate Instagram webhook ignored:', message.message.mid || message.timestamp);
        continue;
      }

      try {

      const workspaceAgents2 = await agentsSupabaseRepository.list({ workspaceId: platform.workspaceId });
      let agent = workspaceAgents2.find((a) => a.platformId === platform.id);
      if (!agent) agent = workspaceAgents2[0] || null;
      const promptRules = getAgentPromptRules(agent);
      const system = agent?.behavior || promptRules.fallbackSystemPrompt;
      const prompt = agent?.prompt || '';
      const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

      let igContactName = `Instagram User ${from}`;
      if (platform.token) {
        try {
          const profile = await igGetUserProfile(from, platform.token);
          if (profile?.name) igContactName = profile.name;
        } catch (e) {
          console.error('[meta] failed to fetch instagram profile:', e);
        }
      }
      const contact = await contactsSupabaseRepository.upsertByProviderIdentity(
        platform.workspaceId,
        platform.id,
        from,
        { name: igContactName, handle: from },
      );

      const chat = await chatsSupabaseRepository.upsertByPlatformContact({
        workspaceId: platform.workspaceId,
        platformId: platform.id,
        contactId: contact.id,
        data: { agent_id: agent?.id || null, last_message_at: new Date().toISOString() },
      });
      const isNewChat = !chat.updatedAt || (new Date(chat.createdAt).getTime() > Date.now() - 2000);

      const userMessage = await recordInboundMessage({
        chat,
        workspaceId: platform.workspaceId,
        text,
        attachment: incomingAttachment,
        platformMessageId: message.message.mid || null,
      });

      if (chat.takenOverByUserId || chat.takeoverBy) {
        const takeoverUser = chat.takenOverByUserId || chat.takeoverBy;
        console.log(`[meta] chat ${chat.id} is handled by human (takeoverBy: ${takeoverUser}), skipping AI reply.`);
        await markWebhookProcessed(webhookEvent);
        continue;
      } else {
        console.log(`[meta] chat ${chat.id} is NOT handled by human, proceeding to AI reply.`);
      }

      if (isNewChat && (text || incomingAttachment)) {
        const processedWelcome = welcome.replace('{{name}}', contact.name);
        const sentWelcome = await sendInstagramTextOrAttachment({
          platform,
          to: from,
          text: processedWelcome,
          agent,
        });
        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: sentWelcome.text,
          attachment: sentWelcome.attachment,
          messageType: sentWelcome.messageType,
        });
      }

      if (userMessage && (!isNewChat || userMessage.text?.toLowerCase() !== '/start')) {
        let reply;
        try {
          const history = await messagesSupabaseRepository.listByChatId(chat.id, { limit: 10 });
          reply = await generateAIReply({
            system,
            prompt,
            message: userMessage,
            knowledge: agent?.knowledge,
            agent,
            chat,
            history,
          });
        } catch (e) {
          console.error('[meta] instagram AI error:', e);
          reply = { text: `Echo: ${userMessage.text}` };
        }

        let replyText = typeof reply === 'string' ? reply : (reply.text || '');
        let attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;
        let sentReply = { text: replyText, attachment, messageType: attachment ? resolveMessageType(attachment.filename || attachment.url) : 'text' };

        if (attachment?.url) {
          await igSendDocument(platform.token, from, attachment.url, replyText);
        } else {
          sentReply = await sendInstagramTextOrAttachment({
            platform,
            to: from,
            text: replyText,
            agent,
          });
        }

        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: sentReply.text,
          attachment: sentReply.attachment,
          messageType: sentReply.messageType,
        });
      }
      await markWebhookProcessed(webhookEvent);
      } catch (err) {
        await markWebhookFailed(webhookEvent, err);
        throw err;
      }
    }
  }
}

export default router;
