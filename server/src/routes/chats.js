import express from 'express';
import path from 'path';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { tgSend, waSend, tgSendDocument, waSendDocument } from '../services/sender.js';

const router = express.Router();

router.get('/', authRequired, attachUser, async (req, res) => {
  const {
    unreadOnly,
    agentId,
    from,
    to,
    tags = [],
    search = '',
    assignment,
  } = req.query;

  const queryFilter = { workspaceId: req.me.workspaceId };

  // Debug logging
  console.log('[CHATS] User:', req.me.email, 'Role:', req.me.role, 'Assignment:', assignment);

  // Role-based filtering: agents only see chats assigned to them
  if (req.me.role === 'agent') {
    queryFilter.takeoverBy = req.me._id;
    console.log('[CHATS] Agent filter applied, takeoverBy:', req.me._id);
  }

  if (unreadOnly === 'true') {
    queryFilter.unread = { $gt: 0 };
  }
  if (agentId) {
    queryFilter.agentId = agentId;
  }
  if (assignment === 'assigned') {
    queryFilter.$or = [
      { takeoverBy: { $ne: null } },
      { isEscalated: true }
    ];
  } else if (assignment === 'unassigned') {
    queryFilter.takeoverBy = null;
    queryFilter.isEscalated = { $ne: true };
  }

  if (from || to) {
    queryFilter.lastMessageAt = {};
    if (from) {
      queryFilter.lastMessageAt.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      queryFilter.lastMessageAt.$lte = toDate;
    }
  }

  let tagList = [];
  if (Array.isArray(tags)) {
    tagList = tags;
  } else if (typeof tags === 'string' && tags.length) {
    tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
  } else if (tags && typeof tags === 'object') {
    tagList = Object.values(tags);
  }

  const contactPopulate = { path: 'contactId' };
  if (tagList.length) {
    contactPopulate.match = { tags: { $all: tagList } };
  }

  const requireContactMatch = !!tagList.length;

  const rows = await Chat.find(queryFilter)
    .populate(contactPopulate)
    .populate('agentId')
    .populate('takeoverBy')
    .sort({ lastMessageAt: -1 })
    .limit(200);

  const populatedRows = await Promise.all(
    rows.map(async (chat) => {
      if (requireContactMatch && !chat.contactId) return null;
      const lastMessage = await Message.findOne({ chatId: chat._id }).sort({
        createdAt: -1,
      });
      return {
        ...chat.toObject(),
        lastMessage: lastMessage?.text || '',
        platformType: chat.contactId?.platformType,
      };
    })
  );

  const regexSafe = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchTerm = search.trim();
  const searchRegex = searchTerm
    ? new RegExp(regexSafe(searchTerm), 'i')
    : null;

  const filteredRows = populatedRows
    .filter(Boolean)
    .filter((chat) => {
      if (!searchRegex) return true;
      const nameMatches = searchRegex.test(chat.contactId?.name || '');
      const messageMatches = searchRegex.test(chat.lastMessage || '');
      return nameMatches || messageMatches;
    });

  res.json(filteredRows);
});

router.get('/:chatId/messages', authRequired, attachUser, async (req, res) => {
  const { chatId } = req.params;
  await Chat.updateOne({ _id: chatId, workspaceId: req.me.workspaceId }, { $set: { unread: 0 } });
  const chat = await Chat.findOne({ _id: chatId, workspaceId: req.me.workspaceId });
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found or access denied' });
  }
  const rows = await Message.find({ chatId })
    .populate('replyTo')
    .sort({ createdAt: 1 })
    .limit(500);
  res.json(rows);
});

router.post('/:chatId/send', authRequired, attachUser, async (req, res) => {
  const { chatId } = req.params;
  const { text, attachment, replyTo } = req.body;
  if (!text && !attachment) return res.status(400).json({ error: 'Text or attachment required' });

  const chat = await Chat.findOne({ _id: chatId, workspaceId: req.me.workspaceId }).populate('contactId').populate('platformId');
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Get platformMessageId for reply if replyTo is provided
  let replyToMessageId = null;
  if (replyTo) {
    const originalMsg = await Message.findById(replyTo);
    if (originalMsg && originalMsg.platformMessageId) {
      replyToMessageId = originalMsg.platformMessageId;
    }
  }

  // as human
  const msg = await Message.create({
    chatId,
    from: 'human',
    text: text || '',
    attachment: attachment || null,
    replyTo: replyTo || null,
    workspaceId: req.me.workspaceId
  });
  await Chat.updateOne({ _id: chatId }, { $set: { lastMessageAt: new Date() } });

  // Send to client
  if (chat.platformId && chat.contactId) {
    if (chat.platformType === 'telegram') {
      try {
        let tgResponse;
        if (attachment && attachment.url) {
          const filename = path.basename(attachment.url);
          const localFilePath = path.resolve('uploads', filename);
          tgResponse = await tgSendDocument(chat.platformId.token, chat.contactId.platformAccountId, localFilePath, text || '', replyToMessageId);
        } else if (text) {
          tgResponse = await tgSend(chat.platformId.token, chat.contactId.platformAccountId, text, replyToMessageId);
        }

        // Save platformMessageId from Telegram response
        if (tgResponse && tgResponse.ok && tgResponse.result && tgResponse.result.message_id) {
          await Message.updateOne(
            { _id: msg._id },
            { platformMessageId: String(tgResponse.result.message_id) }
          );
        }
      } catch (e) {
        console.error('Failed to send message to Telegram:', e);
      }
    } else if (chat.platformType === 'whatsapp') {
      // WhatsApp still needs a public URL
      try {
        const serverUrl = process.env.PUBLIC_BASE_URL || `http://${req.headers.host}`;
        if (attachment && attachment.url) {
          const fullUrl = attachment.url.startsWith('http') ? attachment.url : `${serverUrl}${attachment.url}`;
          await waSendDocument(chat.platformId.token, chat.platformId.phoneNumberId, chat.contactId.platformAccountId, fullUrl, attachment.filename);
          if (text) { // WA doesn't support caption with document, send separately
            await waSend(chat.platformId.token, chat.platformId.phoneNumberId, chat.contactId.platformAccountId, text);
          }
        } else if (text) {
          await waSend(chat.platformId.token, chat.platformId.phoneNumberId, chat.contactId.platformAccountId, text);
        }
      } catch (e) {
        console.error('Failed to send message to WhatsApp:', e);
      }
    }
  }

  res.json(msg);
});

router.post('/:chatId/takeover', authRequired, attachUser, async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  const assigneeId = userId || req.me._id;

  const chat = await Chat.findOneAndUpdate(
    { _id: chatId, workspaceId: req.me.workspaceId },
    { $set: { takeoverBy: assigneeId, isEscalated: false, status: 'open' } },
    { new: true }
  ).populate('contactId').populate('agentId').populate('takeoverBy');
  res.json(chat);
});

router.post('/:chatId/resolve', authRequired, attachUser, async (req, res) => {
  const { chatId } = req.params;
  const chat = await Chat.findOneAndUpdate(
    { _id: chatId, workspaceId: req.me.workspaceId },
    { $set: { takeoverBy: null, isEscalated: false, status: 'resolved' } },
    { new: true }
  ).populate('contactId').populate('agentId').populate('takeoverBy');
  res.json(chat);
});

router.delete('/:chatId', authRequired, attachUser, async (req, res) => {
  const { chatId } = req.params;
  const chat = await Chat.findOneAndDelete({ _id: chatId, workspaceId: req.me.workspaceId });
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  await Message.deleteMany({ chatId, workspaceId: req.me.workspaceId });
  res.json({ success: true });
});

export default router;
