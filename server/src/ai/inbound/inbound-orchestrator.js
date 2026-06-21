import { acquireRunLock, releaseRunLock } from './run-lock.js';
import { checkEligibility } from './eligibility-service.js';
import { createSessionService } from '../memory/session-service.js';
import { buildContext as defaultBuildContext } from '../context/context-builder.js';
import { loadRecentMessages as defaultLoadRecentMessages } from '../context/recent-messages.js';
import { conversationSessionsRepository } from '../../db/repositories/index.js';

export async function prepareInboundTurn({
  platform,
  chat,
  agent,
  message,
  humanTakeoverActive,
  sessionSvc,
  loadRecentMessages = defaultLoadRecentMessages,
  buildContext = defaultBuildContext,
}) {
  const eligibility = await checkEligibility({ platform, chat, agent, message, humanTakeoverActive });
  if (!eligibility.eligible) {
    return { allowed: false, reason: eligibility.reason };
  }

  if (!acquireRunLock(chat.id)) {
    return { allowed: false, reason: 'concurrent_run_locked' };
  }

  try {
    const svc = sessionSvc || createSessionService({ repository: conversationSessionsRepository });
    const { session } = await sessionSvc.getOrCreateActiveSession({
      workspaceId: chat.workspaceId,
      chatId: chat.id,
      agentId: agent?.id,
    });

    await sessionSvc.touchCustomerActivity({ sessionId: session.id });

    const recentMessages = await loadRecentMessages({ chatId: chat.id });

    const context = await buildContext({
      chat: { ...chat, sessionStartedAt: session.startedAt },
      workspaceId: chat.workspaceId,
      agent,
      currentMessage: message,
      recentMessages,
    });

    return {
      allowed: true,
      session,
      sessionSvc,
      context,
      releaseLock: () => releaseRunLock(chat.id),
    };
  } catch (err) {
    releaseRunLock(chat.id);
    throw err;
  }
}
