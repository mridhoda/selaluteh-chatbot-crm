/**
 * human-takeover.service.js — Supabase-backed (task 24.10)
 *
 * Chat human takeover/release logic.
 * Migrated from Mongoose Chat model to chatsSupabaseRepository.
 */

import { chatsSupabaseRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

export async function acquireTakeover({ chatId, userId }) {
  // Try to acquire takeover (only if not already taken over)
  const chat = await chatsSupabaseRepository.acquireTakeover({ chatId, userId });
  if (!chat) {
    // Check if the chat exists at all
    const existing = await chatsSupabaseRepository.findByIdWithPlatformAndContact(chatId);
    if (!existing) throw new AppError('NOT_FOUND', 'Chat not found', 404);
    throw new AppError('TAKEOVER_CONFLICT', 'Chat is already taken over', 409);
  }
  return chat;
}

export async function releaseTakeover({ chatId, userId }) {
  const chat = await chatsSupabaseRepository.releaseTakeover({ chatId, userId });
  if (!chat) throw new AppError('NOT_FOUND', 'Chat not taken over by you', 404);
  return chat;
}

export function isTakeoverActive(chat) {
  return !!(chat?.takenOverByUserId || chat?.takeoverBy);
}

export function assertNoActiveTakeover(chat) {
  if (isTakeoverActive(chat)) {
    throw new AppError('TAKEOVER_ACTIVE', 'Chat is under human takeover; AI auto-reply disabled', 403);
  }
}
