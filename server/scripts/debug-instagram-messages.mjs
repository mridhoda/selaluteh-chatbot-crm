import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Chat from '../src/models/Chat.js';
import Message from '../src/models/Message.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGODB_URI);

const chats = await Chat.find({ platformType: 'instagram' }).lean();
console.log('Chats:', chats.map((c) => ({ id: c._id, contactId: c.contactId, lastMessageAt: c.lastMessageAt, unread: c.unread })));

for (const chat of chats) {
  const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 }).lean();
  console.log(`Messages for chat ${chat._id}:`, messages.map((m) => ({ from: m.from, text: m.text, createdAt: m.createdAt })));
}

await mongoose.disconnect();
