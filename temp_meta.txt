import express from 'express';
import path from 'path';
import Platform from '../models/Platform.js';
import Agent from '../models/Agent.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Contact from '../models/Contact.js';
import { generateAIReply, findAndSendFile } from '../services/ai.js';
import { openaiClient, geminiClient } from '../services/aiClient.js';
import { tgSend, waSend, waSendDocument, igSend, igGetUserProfile, tgSendSticker, tgSendDocument, igSendDocument } from '../services/sender.js';

const router = express.Router();

// ---- WEBHOOK: TELEGRAM ----
router.post('/telegram', async (req, res) => {
  // balas cepat ke Telegram agar tidak timeout
  res.sendStatus(200)

  try {
    const update = req.body || {}
    console.log('[telegram] update:', JSON.stringify(update))

    const msgObj =
      update.message ||
      update.edited_message ||
      (update.callback_query && update.callback_query.message)

    const text =
      update.message?.text ||
      update.edited_message?.text ||
      update.callback_query?.data ||
      ''

    const chatId = msgObj?.chat?.id
    if (!chatId) return

    // ambil platform telegram terbaru yg punya token
    const platform = await Platform.findOne({ type: 'telegram', token: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 })
    if (!platform) {
      console.warn('[telegram] no platform/token found')
      return
    }

    let agent = await Agent.findOne({ platformId: platform._id })
    if (!agent) {
      agent = await Agent.findOne({ workspaceId: platform.workspaceId }).sort({ createdAt: 1 })
    }
    const system = agent?.behavior || 'You are a helpful assistant.'
    const prompt = agent?.prompt || ''
    const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?'

    // cari/buat kontak
    let contact = await Contact.findOne({ userId: platform.userId, platformAccountId: String(chatId) })
    if (!contact) {
      const from = msgObj?.chat || {}
      const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || `User ${chatId}`
      contact = await Contact.create({
        userId: platform.userId,
        workspaceId: platform.workspaceId, // <-- FIX: Add workspaceId
        name,
        platformType: 'telegram',
        platformAccountId: String(chatId),
        handle: from.username ? `@${from.username}` : '',
        lastSeen: new Date(),
      })
    }


    // buat/temukan chat lokal
    let chat = await Chat.findOne({
      userId: platform.userId,
      platformId: platform._id,
      contactId: contact._id,
    })
    const isNewChat = !chat;
    if (!chat) {
      chat = await Chat.create({
        userId: platform.userId,
        workspaceId: platform.workspaceId, // <-- FIX: Add workspaceId
        platformId: platform._id,
        platformType: 'telegram',
        contactId: contact._id, // tautkan contact
        agentId: agent?._id || null,
        lastMessageAt: new Date(),
      })
    } else if (!chat.agentId && agent) {
      chat.agentId = agent._id;
      await chat.save();
    }

    // simpan pesan user
    if (text) {
      await Message.create({
        chatId: chat._id,
        workspaceId: platform.workspaceId,
        from: 'user',
        text,
        createdAt: new Date(),
      })
      // Update last message time and increment unread count immediately
      await Chat.updateOne({ _id: chat._id }, { $set: { lastMessageAt: new Date() }, $inc: { unread: 1 } });
    }

    // Jika chat sudah diambil alih, jangan proses AI reply
    if (chat.takeoverBy) {
      console.log(`[telegram] chat ${chat._id} is handled by human, skipping AI reply.`);
      return;
    }

    if (isNewChat) {
        const processedWelcome = welcome.replace('{{name}}', contact.name);
        await tgSend(platform.token, chatId, processedWelcome);
        await Message.create({ chatId: chat._id, workspaceId: platform.workspaceId, from: 'ai', text: processedWelcome, createdAt: new Date() });

        if (agent && agent.stickerUrl) {
            try {
                const stickerUrl = `${process.env.PUBLIC_BASE_URL}${agent.stickerUrl}`;
                await tgSendSticker(platform.token, chatId, stickerUrl);
            } catch (e) {
                console.error('[telegram] Sticker error:', e);
            }
        }
    }

    // siapkan balasan
    if (text && (!isNewChat || text !== '/start')) {
      const fileResponse = await findAndSendFile({ agent, message: text, openaiClient, geminiClient });

      if (fileResponse) {
        const { text: replyText, attachment } = fileResponse;
        if (attachment && attachment.storedName) {
          const localFilePath = path.resolve('uploads', attachment.storedName);
          await tgSendDocument(platform.token, chatId, localFilePath, replyText);
        }
        await Message.create({ 
          chatId: chat._id, 
          workspaceId: platform.workspaceId, 
          from: 'ai', 
          text: replyText, 
          attachment: attachment, 
          createdAt: new Date() 
        });
        return;
      }

      let reply;
      try {
        const history = await Message.find({ chatId: chat._id }).sort({ createdAt: -1 }).limit(10);
        history.reverse(); // chronological order
        reply = await generateAIReply({ system, prompt, message: text, knowledge: agent?.knowledge, agent, chat, history });
      } catch (e) {
        console.error('[telegram] AI error:', e);
        reply = { text: `Echo: ${text}` };
      }

      const replyText = typeof reply === 'string' ? reply : reply.text;
      const attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;

      // kirim balasan ke Telegram
      if (attachment && attachment.storedName) {
        const localFilePath = path.resolve('uploads', attachment.storedName);
        await tgSendDocument(platform.token, chatId, localFilePath, replyText);
      } else if (replyText) {
        await tgSend(platform.token, chatId, replyText);
      }

      // simpan pesan AI
      await Message.create({ 
        chatId: chat._id, 
        workspaceId: platform.workspaceId, 
        from: 'ai', 
        text: replyText, 
        attachment: attachment, // Save attachment info
        createdAt: new Date() 
      });
    }

  } catch (err) {
    console.error('Webhook /telegram error:', err)
  }
})

// ---- WEBHOOK: META (WHATSAPP) ----
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  console.log('[meta] verification request:', req.query);
  console.log('[meta] server verify token:', process.env.META_VERIFY_TOKEN);

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

router.post('/meta', async (req, res) => {
  res.sendStatus(200);

  try {
    const data = req.body;
    console.log('[meta] webhook received:', JSON.stringify(data, null, 2));

    if (data.object === 'whatsapp_business_account') {
      // WhatsApp logic (existing code)
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          if (!value.messages) continue;

          const fromPhoneNumberId = value.metadata.phone_number_id;

          for (const message of value.messages) {
            if (message.type !== 'text') continue;

            const from = message.from;
            const text = message.text.body;
            const platformAccountId = entry.id;

            const platform = await Platform.findOne({ accountId: platformAccountId });
            let agent = await Agent.findOne({ platformId: platform._id });
            if (!agent) {
              agent = await Agent.findOne({ workspaceId: platform.workspaceId }).sort({ createdAt: 1 })
            }
            const system = agent?.behavior || 'You are a helpful assistant.';
            const prompt = agent?.prompt || '';
            const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

            let contact = await Contact.findOne({ userId: platform.userId, platformAccountId: from });
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

            await Message.create({
              chatId: chat._id,
              workspaceId: platform.workspaceId,
              from: 'user',
              text,
              createdAt: new Date(),
            });
            await Chat.updateOne({ _id: chat._id }, { $set: { lastMessageAt: new Date() }, $inc: { unread: 1 } });

            if (chat.takeoverBy) {
              console.log(`[meta] chat ${chat._id} is handled by human, skipping AI reply.`);
              continue;
            }

            if (isNewChat) {
              const processedWelcome = welcome.replace('{{name}}', contact.name);
              await waSend(platform.token, fromPhoneNumberId, from, processedWelcome);
              await Message.create({ chatId: chat._id, workspaceId: platform.workspaceId, from: 'ai', text: processedWelcome, createdAt: new Date() });
            }

            if (text && (!isNewChat || text.toLowerCase() !== '/start')) {
              let reply;
              try {
                const history = await Message.find({ chatId: chat._id }).sort({ createdAt: -1 }).limit(10);
                history.reverse(); // chronological order
                reply = await generateAIReply({ system, prompt, message: text, knowledge: agent?.knowledge, agent, chat, history });
              } catch (e) {
                console.error('[meta] AI error:', e);
                reply = { text: `Echo: ${text}` };
              }

              const replyText = typeof reply === 'string' ? reply : reply.text;
              const attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;

              if (attachment && attachment.url) {
                await waSendDocument(platform.token, fromPhoneNumberId, from, attachment.url, attachment.filename);
                // For WA, the caption is not supported in the same message, so we send the text separately if needed.
                if (replyText) {
                  await waSend(platform.token, fromPhoneNumberId, from, replyText);
                }
              } else {
                await waSend(platform.token, fromPhoneNumberId, from, replyText);
              }

              await Message.create({ 
                chatId: chat._id, 
                workspaceId: platform.workspaceId, 
                from: 'ai', 
                text: replyText, 
                attachment: attachment, // Save attachment info
                createdAt: new Date() 
              });
            }
          }
        }
      }
    } else if (data.object === 'instagram') {
      // Instagram logic
      console.log('[meta] processing instagram message');
      for (const entry of data.entry) {
        for (const message of entry.messaging) {
          if (message.message && message.message.text) {
            const from = message.sender.id;
            const text = message.message.text;
            const platformAccountId = entry.id;
            console.log(`[meta] instagram message from ${from}: ${text}`);

            const platform = await Platform.findOne({ accountId: platformAccountId, type: 'instagram' });
            console.log('[meta] platform found:', platform);
            if (!platform) {
              console.warn(`[meta] instagram platform not found for accountId: ${platformAccountId}`);
              continue;
            }

            let agent = await Agent.findOne({ platformId: platform._id });
            console.log('[meta] agent found:', agent);
            if (!agent) {
              agent = await Agent.findOne({ workspaceId: platform.workspaceId }).sort({ createdAt: 1 })
            }
            const system = agent?.behavior || 'You are a helpful assistant.';
            const prompt = agent?.prompt || '';
            const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

            let contact = await Contact.findOne({ userId: platform.userId, platformAccountId: from });
            console.log('[meta] contact found:', contact);

            if (!contact) {
              let name = `Instagram User ${from}`;
              try {
                const profile = await igGetUserProfile(from, platform.token);
                if (profile && profile.name) {
                  name = profile.name;
                }
              } catch (e) {
                console.error('[meta] failed to fetch instagram profile:', e);
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
              console.log('[meta] contact created:', contact);
            } else if (contact.name.startsWith('Instagram User')) {
              // Contact exists, but the name is a placeholder. Try to update it.
              try {
                const profile = await igGetUserProfile(from, platform.token);
                if (profile && profile.name) {
                  contact.name = profile.name;
                  await contact.save();
                  console.log('[meta] contact name updated:', contact);
                }
              } catch (e) {
                console.error('[meta] failed to update instagram profile:', e);
              }
            }

            let chat = await Chat.findOne({
              userId: platform.userId,
              platformId: platform._id,
              contactId: contact._id,
            });
            console.log('[meta] chat found:', chat);
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
              console.log('[meta] chat created:', chat);
            } else if (!chat.agentId && agent) {
              chat.agentId = agent._id;
              await chat.save();
            }

            await Message.create({
              chatId: chat._id,
              workspaceId: platform.workspaceId,
              from: 'user',
              text,
              createdAt: new Date(),
            });
            await Chat.updateOne({ _id: chat._id }, { $set: { lastMessageAt: new Date() }, $inc: { unread: 1 } });

            if (chat.takeoverBy) {
              console.log(`[meta] chat ${chat._id} is handled by human, skipping AI reply.`);
              continue;
            }

            if (isNewChat) {
              const processedWelcome = welcome.replace('{{name}}', contact.name);
              console.log(`[meta] sending welcome message to ${from}: ${processedWelcome}`);
              await igSend(platform.token, from, processedWelcome);
              console.log('[meta] welcome message sent.');
              await Message.create({ chatId: chat._id, workspaceId: platform.workspaceId, from: 'ai', text: processedWelcome, createdAt: new Date() });
            }

            if (text && (!isNewChat || text.toLowerCase() !== '/start')) {
              const replyText = typeof reply === 'string' ? reply : reply.text;
              const attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;

              if (attachment && attachment.url) {
                console.log(`[meta] sending AI reply with attachment to ${from}:`, attachment);
                await igSendDocument(platform.token, from, attachment.url, replyText);
              } else if (replyText) {
                console.log(`[meta] sending AI reply to ${from}: ${replyText}`);
                await igSend(platform.token, from, replyText);
              }

              console.log('[meta] AI reply sent.');
              await Message.create({ 
                chatId: chat._id, 
                workspaceId: platform.workspaceId, 
                from: 'ai', 
                text: replyText, 
                attachment: attachment, // Save attachment info
                createdAt: new Date() 
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook /meta error:', err);
  }
});

// ---- WEBHOOK: TEST META (WHATSAPP) ----
router.post('/test-meta', (req, res) => {
  console.log('[meta-test] received webhook:');
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// ping untuk test cepat di browser
router.get('/ping', (req, res) => res.json({ ok: true }))

export default router
