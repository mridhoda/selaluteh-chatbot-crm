import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import {
  platformsSupabaseRepository,
  agentsSupabaseRepository,
  contactsSupabaseRepository,
  chatsSupabaseRepository,
  messagesSupabaseRepository,
} from '../../db/repositories/index.js';
import { generateAIReply } from '../../services/ai.service.js';
import {
  igGetUserProfile,
  igSend,
  igSendDocument,
  waSend,
  waSendDocument,
  waSendImage,
  waSendSticker,
} from '../../services/sender.js';
import { findDatabaseFileMention } from '../../utils/fileMentions.js';
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

const router = express.Router();

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
  if (!mention?.file?.storedName) return null;
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
    if (!verifyMetaSignature(req.body, signatureHeader, process.env.META_APP_SECRET)) {
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

async function handleWhatsapp(data) {
  for (const entry of data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      if (!value?.messages?.length) continue;

      const fromPhoneNumberId = value.metadata?.phone_number_id;
      const platformAccountId = entry.id;
      let platform = await platformsSupabaseRepository.findByAccountId({ accountId: platformAccountId, type: 'whatsapp' });

      if (!platform && fromPhoneNumberId) {
        console.log('[meta] whatsapp platform not found by accountId, attempting lookup by phone_number_id:', fromPhoneNumberId);
        platform = await platformsSupabaseRepository.findByPhoneNumberId({ phoneNumberId: fromPhoneNumberId, type: 'whatsapp' });
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

      const workspaceAgents = await agentsSupabaseRepository.list({ workspaceId: platform.workspaceId });
      let agent = workspaceAgents.find((a) => a.platformId === platform.id);
      if (!agent) agent = workspaceAgents[0] || null;
      const system = agent?.behavior || 'You are a helpful assistant.';
      const prompt = agent?.prompt || '';
      const welcome =
        agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

      for (const message of value.messages) {
        let webhookEvent = null;
        const from = message.from;
        const text = message.text?.body || '';
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

        if (!text && !incomingAttachment) {
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

        if (isNewChat) {
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
      const system = agent?.behavior || 'You are a helpful assistant.';
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
