import { loadRecentMessages } from './recent-messages.js';
import { conversationSessionsRepository, conversationSummariesRepository, aiRunsRepository } from '../../db/repositories/index.js';

export async function loadSession({ workspaceId, chatId }) {
  try {
    const session = await conversationSessionsRepository.findActiveByChat({ workspaceId, chatId });
    return session || null;
  } catch {
    return null;
  }
}

export async function loadLatestSummary({ workspaceId, chatId }) {
  try {
    const summary = await conversationSummariesRepository.findLatestValid({ workspaceId, chatId });
    return summary || null;
  } catch {
    return null;
  }
}

export async function loadCommerceState({ workspaceId, chatId }) {
  return null;
}

export async function loadAllSources({ workspaceId, chatId }) {
  const [recentMessages, session, summary] = await Promise.all([
    loadRecentMessages({ chatId, limit: 25 }).catch(() => []),
    loadSession({ workspaceId, chatId }),
    loadLatestSummary({ workspaceId, chatId }),
  ]);

  return { recentMessages, session, summary };
}
