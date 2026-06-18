/**
 * chats.js — Supabase-backed (task 24.10)
 *
 * Chat and message routes.
 * Migrated from Mongoose Chat/Message models to chatsSupabaseRepository +
 * messagesSupabaseRepository.
 */

import express from 'express';
import path from 'path';
import { authRequired, attachUser } from '../middleware/auth.js';
import { acquireTakeover, releaseTakeover } from '../services/human-takeover.service.js';
import { chatsSupabaseRepository, messagesSupabaseRepository } from '../db/repositories/index.js';
import { decrypt } from '../utils/encryption.js';
import { tgSend, tgSendDocument, tgSendPhoto, waSend, waSendDocument } from '../services/sender.js';

const router = express.Router();

router.get('/', authRequired, attachUser, async (req, res) => {
  try {
    const {
      unreadOnly,
      from,
      to,
      assignment,
      search = '',
    } = req.query;

    const workspaceId = req.me.workspaceId;
    const userId = req.me.id;

    // Build list options
    const opts = { workspaceId };

    // Role-based filter: agents only see their taken-over chats
    if (req.me.role === 'agent') {
      opts.takenOverByUserId = userId;
    }

    if (from) opts.dateFrom = new Date(from).toISOString();
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      opts.dateTo = toDate.toISOString();
    }

    if (assignment === 'assigned') opts.assigned = true;
    else if (assignment === 'unassigned') opts.unassigned = true;

    let rows = await chatsSupabaseRepository.list(opts);

    // Unread filter — in-memory since Supabase query would need count column
    if (unreadOnly === 'true') {
      rows = rows.filter((c) => (c.unread ?? 0) > 0);
    }

    // Attach last message for each chat
    const withLastMsg = await Promise.all(rows.map(async (chat) => {
      const lastMsg = await messagesSupabaseRepository.findLatestByChatId(chat.id);
      return { ...chat, lastMessage: lastMsg?.content || '' };
    }));

    // Search filter — in-memory
    const searchTerm = search.trim();
    const searchRegex = searchTerm ? new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    const filtered = searchRegex
      ? withLastMsg.filter((c) => searchRegex.test(c.contacts?.name || '') || searchRegex.test(c.lastMessage || ''))
      : withLastMsg;

    res.json(filtered);
  } catch (err) {
    console.error('[CHATS] GET / error:', err);
    res.status(500).json({ error: 'Failed to load chats' });
  }
});

router.get('/:chatId/messages', authRequired, attachUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const workspaceId = req.me.workspaceId;

    // Mark as read
    await chatsSupabaseRepository.markRead({ workspaceId, chatId });

    const chat = await chatsSupabaseRepository.findById({ workspaceId, chatId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const rows = await messagesSupabaseRepository.listByChatId(chatId, { limit: 500 });
    res.json(rows);
  } catch (err) {
    console.error('[CHATS] GET /:chatId/messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/:chatId/send', authRequired, attachUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, content, attachment, replyTo } = req.body;
    const messageText = text || content;
    if (!messageText && !attachment) return res.status(400).json({ error: 'Text or attachment required' });

    const workspaceId = req.me.workspaceId;
    const chat = await chatsSupabaseRepository.findByIdWithPlatformAndContact(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Resolve messageType to match database enum chat_message_type
    let messageType = 'text';
    if (attachment) {
      const isImg = attachment.type === 'image' || (attachment.filename && attachment.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i));
      messageType = isImg ? 'image' : 'file';
    }

    // Save message
    const msg = await messagesSupabaseRepository.create({
      workspaceId,
      chatId,
      platformId: chat.platformId,
      contactId: chat.contactId,
      senderType: 'human',
      userId: req.me.id,
      direction: 'outbound',
      messageType,
      content: messageText || null,
      rawPayload: attachment ? { attachment } : {},
    });

    // Update lastMessageAt
    await chatsSupabaseRepository.update({ chatId, updates: { last_message_at: new Date().toISOString() } });

    // Send to client platform (Telegram, WhatsApp, etc.)
    const platform = chat.platforms;
    const contact = chat.contacts;

    if (platform && contact) {
      let decryptedToken = '';
      if (platform.tokenEncrypted) {
        try {
          decryptedToken = decrypt(platform.tokenEncrypted);
        } catch (e) {
          console.error('[CHATS] Decryption failed for platform token:', e);
        }
      }

      if (decryptedToken) {
        // Resolve replyTo platformMessageId if provided
        let replyToMessageId = null;
        if (replyTo) {
          try {
            const originalMsg = await messagesSupabaseRepository.findById(replyTo);
            if (originalMsg && originalMsg.platformMessageId) {
              replyToMessageId = originalMsg.platformMessageId;
            }
          } catch (e) {
            console.error('[CHATS] Failed to resolve replyTo message:', e);
          }
        }

        if (platform.type === 'telegram' && contact.externalId) {
          try {
            let tgResponse;
            if (attachment && attachment.url) {
              const filename = path.basename(attachment.url);
              const localFilePath = path.resolve('uploads', filename);
              const isImg = attachment.type === 'image' || filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              if (isImg) {
                tgResponse = await tgSendPhoto(decryptedToken, contact.externalId, localFilePath, messageText || '', replyToMessageId);
              } else {
                tgResponse = await tgSendDocument(decryptedToken, contact.externalId, localFilePath, messageText || '', replyToMessageId);
              }
            } else if (messageText) {
              tgResponse = await tgSend(decryptedToken, contact.externalId, messageText, replyToMessageId);
            }

            // Save platformMessageId from Telegram response to allow replies
            if (tgResponse && tgResponse.ok && tgResponse.result && tgResponse.result.message_id) {
              await messagesSupabaseRepository.updatePlatformMessageId(msg.id, String(tgResponse.result.message_id));
            }
          } catch (e) {
            console.error('[CHATS] Failed to send message to Telegram:', e);
          }
        } else if (platform.type === 'whatsapp' && contact.externalId) {
          try {
            const serverUrl = process.env.PUBLIC_BASE_URL || `http://${req.headers.host}`;
            if (attachment && attachment.url) {
              const fullUrl = attachment.url.startsWith('http') ? attachment.url : `${serverUrl}${attachment.url}`;
              await waSendDocument(decryptedToken, platform.phoneNumberId, contact.externalId, fullUrl, attachment.filename || 'document');
              if (messageText) {
                await waSend(decryptedToken, platform.phoneNumberId, contact.externalId, messageText);
              }
            } else if (messageText) {
              await waSend(decryptedToken, platform.phoneNumberId, contact.externalId, messageText);
            }
          } catch (e) {
            console.error('[CHATS] Failed to send message to WhatsApp:', e);
          }
        }
      }
    }

    res.json(msg);
  } catch (err) {
    console.error('[CHATS] POST /:chatId/send error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/:chatId/takeover', authRequired, attachUser, async (req, res, next) => {
  try {
    const chat = await acquireTakeover({ chatId: req.params.chatId, userId: req.me.id });
    res.json({ data: chat });
  } catch (err) { next(err); }
});

router.post('/:chatId/release', authRequired, attachUser, async (req, res, next) => {
  try {
    const chat = await releaseTakeover({ chatId: req.params.chatId, userId: req.me.id });
    res.json({ data: chat });
  } catch (err) { next(err); }
});

router.delete('/:chatId', authRequired, attachUser, async (req, res) => {
  try {
    const { chatId } = req.params;
    const workspaceId = req.me.workspaceId;
    await chatsSupabaseRepository.deleteById({ workspaceId, chatId });
    res.json({ success: true });
  } catch (err) {
    console.error('[CHATS] DELETE /:chatId error:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
