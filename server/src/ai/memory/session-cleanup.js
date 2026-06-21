import { conversationSessionsRepository } from '../../db/repositories/index.js';

const DEFAULT_INACTIVITY_HOURS = 24;

export async function closeIdleSessions({ workspaceId, inactivityHours = DEFAULT_INACTIVITY_HOURS }) {
  const sessions = await conversationSessionsRepository.closeIdleSessions({
    workspaceId,
    thresholdMinutes: inactivityHours * 60,
  });
  return { closedCount: sessions.length };
}

export async function closeAllIdleSessionsForWorkspace(workspaceId) {
  return closeIdleSessions({ workspaceId });
}
