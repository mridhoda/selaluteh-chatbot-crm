import express from 'express';
import Contact from '../models/Contact.js';
import Chat from '../models/Chat.js';
import Agent from '../models/Agent.js';
import Message from '../models/Message.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all contacts
router.get('/', authRequired, attachUser, async (req, res) => {
  const contacts = await Contact.find({ workspaceId: req.me.workspaceId }).sort({ updatedAt: -1 });

  const enrichedContacts = await Promise.all(contacts.map(async (contact) => {
    const chat = await Chat.findOne({ contactId: contact._id }).populate('agentId');
    const lastMessage = await Message.findOne({ chatId: chat?._id }).sort({ createdAt: -1 });

    return {
      ...contact.toObject(),
      agentName: chat?.agentId?.name || '',
      lastMessage: lastMessage?.text || '',
      lastMessageAt: chat?.lastMessageAt || contact.createdAt, // Fallback to createdAt
    };
  }));

  res.json(enrichedContacts);
});

// Update a contact (tags and notes)
router.put('/:id', authRequired, attachUser, async (req, res) => {
  const { id } = req.params;
  const { tags, notes } = req.body;

  const contact = await Contact.findOneAndUpdate(
    { _id: id, workspaceId: req.me.workspaceId },
    { $set: { tags, notes } },
    { new: true }
  );

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json(contact);
});

export default router;
