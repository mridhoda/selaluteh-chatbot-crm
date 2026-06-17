import Chat from '../models/Chat.js';
import { AppError } from '../utils/errors.js';

export async function acquireTakeover({ chatId, userId }) {
  const chat = await Chat.findOneAndUpdate(
    { _id: chatId, takeoverBy: null },
    { $set: { takeoverBy: userId, isEscalated: true } },
    { new: true },
  );
  if (!chat) {
    const existing = await Chat.findById(chatId);
    if (!existing) throw new AppError('NOT_FOUND', 'Chat not found', 404);
    throw new AppError('TAKEOVER_CONFLICT', 'Chat is already taken over', 409);
  }
  return chat;
}

export async function releaseTakeover({ chatId, userId }) {
  const chat = await Chat.findOneAndUpdate(
    { _id: chatId, takeoverBy: userId },
    { $set: { takeoverBy: null, isEscalated: false } },
    { new: true },
  );
  if (!chat) throw new AppError('NOT_FOUND', 'Chat not taken over by you', 404);
  return chat;
}

export function isTakeoverActive(chat) {
  return !!chat?.takeoverBy;
}

export function assertNoActiveTakeover(chat) {
  if (isTakeoverActive(chat)) {
    throw new AppError('TAKEOVER_ACTIVE', 'Chat is under human takeover; AI auto-reply disabled', 403);
  }
}
