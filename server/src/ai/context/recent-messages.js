import { messagesSupabaseRepository } from '../../db/repositories/index.js';

const DEFAULT_LIMIT = 25;

const EXCLUDED_SENDER_TYPES = new Set([
  'system',
  'webhook',
  'internal',
]);

const EXCLUDED_DIRECTIONS = new Set([
  'internal',
]);

const EXCLUDED_CONTENT_PATTERNS = [
  /^\[Voice Note\]/,
  /^\[File:/,
];

export function isMessageEligibleForContext(message) {
  if (!message) return false;

  if (EXCLUDED_SENDER_TYPES.has(message.senderType)) return false;
  if (EXCLUDED_DIRECTIONS.has(message.direction)) return false;

  if (message.content) {
    for (const pattern of EXCLUDED_CONTENT_PATTERNS) {
      if (pattern.test(message.content)) return false;
    }
  }

  return true;
}

export async function loadRecentMessages({ chatId, limit = DEFAULT_LIMIT }) {
  const rawMessages = await messagesSupabaseRepository.listByChatId(chatId, {
    limit: limit * 2,
  });

  const eligible = rawMessages.filter(isMessageEligibleForContext);

  const sorted = eligible.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return sorted.slice(-limit);
}
