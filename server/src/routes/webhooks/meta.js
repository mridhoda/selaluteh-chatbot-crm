import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import Platform from '../../models/Platform.js';
import Agent from '../../models/Agent.js';
import Chat from '../../models/Chat.js';
import Message from '../../models/Message.js';
import Contact from '../../models/Contact.js';
import { generateAIReply } from '../../services/ai.service.js';
import {
  igGetUserProfile,
  igSend,
  igSendDocument,
  waSend,
  waSendDocument,
} from '../../services/sender.js';
import {
  beginWebhookEvent,
  getMetaMessageEventId,
  markWebhookFailed,
  markWebhookProcessed,
} from '../../services/webhook-idempotency.service.js';
import { recordInboundMessage, recordOutboundMessage } from '../../services/chat-message.service.js';

const router = express.Router();

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
    const data = req.body;
    console.log('[meta] webhook received:', JSON.stringify(data, null, 2));

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
      const platform = await Platform.findOne({
        accountId: platformAccountId,
        type: 'whatsapp',
      });

      if (!platform) {
        console.warn(
          '[meta] whatsapp platform not found for accountId:',
          platformAccountId,
        );
        continue;
      }

      let agent = await Agent.findOne({ platformId: platform._id });
      if (!agent) {
        agent = await Agent.findOne({
          workspaceId: platform.workspaceId,
        }).sort({ createdAt: 1 });
      }
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
          platformId: platform._id,
          payload: message,
          signatureValid: null,
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
              url: `/files/${saved.storedName}`,
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

        let contact = await Contact.findOne({
          userId: platform.userId,
          platformAccountId: from,
        });
        if (!contact) {
          const name = value.contacts?.[0]?.profile?.name || from;
          contact = await Contact.create({
            userId: platform.userId,
            workspaceId: platform.workspaceId,
            name,
            platformType: 'whatsapp',
            platformAccountId: from,
            handle: from,
            lastSeen: new Date(),
          });
        }

        let chat = await Chat.findOne({
          userId: platform.userId,
          platformId: platform._id,
          contactId: contact._id,
        });
        const isNewChat = !chat;
        if (!chat) {
          chat = await Chat.create({
            userId: platform.userId,
            workspaceId: platform.workspaceId,
            platformId: platform._id,
            platformType: 'whatsapp',
            contactId: contact._id,
            agentId: agent?._id || null,
            lastMessageAt: new Date(),
          });
        } else if (!chat.agentId && agent) {
          chat.agentId = agent._id;
          await chat.save();
        }

        const userMessage = await recordInboundMessage({
          chat,
          workspaceId: platform.workspaceId,
          text,
          attachment: incomingAttachment,
          platformMessageId: message.id || null,
        });

        if (chat.takeoverBy) {
          console.log(
            `[meta] chat ${chat._id} is handled by human (takeoverBy: ${chat.takeoverBy}), skipping AI reply.`,
          );
          await markWebhookProcessed(webhookEvent);
          continue;
        } else {
          console.log(`[meta] chat ${chat._id} is NOT handled by human (takeoverBy: ${chat.takeoverBy}), proceeding to AI reply.`);
        }

        if (isNewChat) {
          const processedWelcome = welcome.replace('{{name}}', contact.name);
          await waSend(
            platform.token,
            fromPhoneNumberId,
            from,
            processedWelcome,
          );
          await recordOutboundMessage({
            chatId: chat._id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: processedWelcome,
          });
        }

        if (userMessage && (!isNewChat || userMessage.text?.toLowerCase() !== '/start')) {
          let reply;
          try {
            const history = await Message.find({ chatId: chat._id })
              .sort({ createdAt: -1 })
              .limit(10);
            history.reverse();
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

          const replyText = typeof reply === 'string' ? reply : reply.text;
          const attachment =
            typeof reply === 'object' && reply.attachment
              ? reply.attachment
              : null;

          if (attachment && attachment.url) {
            await waSendDocument(
              platform.token,
              fromPhoneNumberId,
              from,
              attachment.url,
              attachment.filename,
            );
            if (replyText) {
              await waSend(platform.token, fromPhoneNumberId, from, replyText);
            }
          } else {
            await waSend(platform.token, fromPhoneNumberId, from, replyText);
          }

          await recordOutboundMessage({
            chatId: chat._id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: replyText,
            attachment,
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
              url: `/files/${saved.storedName}`,
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
      const platform = await Platform.findOne({
        accountId: platformAccountId,
        type: 'instagram',
      });

      if (!platform) {
        console.warn(`[meta] instagram platform not found for accountId: ${platformAccountId}`);
        continue;
      }

      const webhookResult = await beginWebhookEvent({
        provider: 'meta:instagram',
        eventType: 'message',
        externalEventId: getMetaMessageEventId(message.message, { senderId: from, timestamp: message.timestamp }),
        workspaceId: platform.workspaceId,
        platformId: platform._id,
        payload: message,
        signatureValid: null,
      });
      webhookEvent = webhookResult.event;
      if (webhookResult.duplicate) {
        console.log('[meta] duplicate Instagram webhook ignored:', message.message.mid || message.timestamp);
        continue;
      }

      try {

      let agent = await Agent.findOne({ platformId: platform._id });
      if (!agent) {
        agent = await Agent.findOne({ workspaceId: platform.workspaceId }).sort({ createdAt: 1 });
      }
      const system = agent?.behavior || 'You are a helpful assistant.';
      const prompt = agent?.prompt || '';
      const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

      let contact = await Contact.findOne({ userId: platform.userId, platformAccountId: from });
      if (!contact) {
        let name = `Instagram User ${from}`;
        if (platform.token) {
          try {
            const profile = await igGetUserProfile(from, platform.token);
            if (profile?.name) name = profile.name;
          } catch (e) {
            console.error('[meta] failed to fetch instagram profile:', e);
          }
        }
        contact = await Contact.create({
          userId: platform.userId,
          workspaceId: platform.workspaceId,
          name,
          platformType: 'instagram',
          platformAccountId: from,
          handle: from,
          lastSeen: new Date(),
        });
      }

      let chat = await Chat.findOne({
        userId: platform.userId,
        platformId: platform._id,
        contactId: contact._id,
      });
      const isNewChat = !chat;
      if (!chat) {
        chat = await Chat.create({
          userId: platform.userId,
          workspaceId: platform.workspaceId,
          platformId: platform._id,
          platformType: 'instagram',
          contactId: contact._id,
          agentId: agent?._id || null,
          lastMessageAt: new Date(),
        });
      } else if (!chat.agentId && agent) {
        chat.agentId = agent._id;
        await chat.save();
      }

      const userMessage = await recordInboundMessage({
        chat,
        workspaceId: platform.workspaceId,
        text,
        attachment: incomingAttachment,
        platformMessageId: message.message.mid || null,
      });

      if (chat.takeoverBy) {
        console.log(`[meta] chat ${chat._id} is handled by human (takeoverBy: ${chat.takeoverBy}), skipping AI reply.`);
        await markWebhookProcessed(webhookEvent);
        continue;
      } else {
        console.log(`[meta] chat ${chat._id} is NOT handled by human (takeoverBy: ${chat.takeoverBy}), proceeding to AI reply.`);
      }

      if (isNewChat && (text || incomingAttachment)) {
        const processedWelcome = welcome.replace('{{name}}', contact.name);
        await igSend(platform.token, platform.accountId, from, processedWelcome);
        await recordOutboundMessage({
          chatId: chat._id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: processedWelcome,
        });
      }

      if (userMessage && (!isNewChat || userMessage.text?.toLowerCase() !== '/start')) {
        let reply;
        try {
          const history = await Message.find({ chatId: chat._id }).sort({ createdAt: -1 }).limit(10);
          history.reverse();
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

        const replyText = typeof reply === 'string' ? reply : (reply.text || '');
        const attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;

        if (attachment && attachment.url) {
          await igSendDocument(platform.token, platform.accountId, from, attachment.url, replyText);
        } else if (replyText) {
          await igSend(platform.token, platform.accountId, from, replyText);
        }

        await recordOutboundMessage({
          chatId: chat._id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: replyText,
          attachment,
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
