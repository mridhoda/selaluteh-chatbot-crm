import { conversationSessionsRepository } from '../../db/repositories/index.js';

const DEFAULT_INACTIVITY_HOURS = 24;

export function createSessionService({ repository = conversationSessionsRepository, inactivityHours = DEFAULT_INACTIVITY_HOURS, clock } = {}) {
  const now = () => (clock ? clock.now() : new Date());

  async function getOrCreateActiveSession({ workspaceId, chatId, agentId }) {
    const existing = await repository.findActiveByChat({ workspaceId, chatId });
    if (existing) {
      const lastMsg = existing.lastCustomerMessageAt
        ? new Date(existing.lastCustomerMessageAt)
        : new Date(existing.startedAt);
      const inactiveHours = (now().getTime() - lastMsg.getTime()) / (1000 * 60 * 60);
      if (inactiveHours < inactivityHours) {
        return { session: existing, created: false };
      }
      await repository.close({ id: existing.id, reason: 'idle' });
    }
    const session = await repository.create({
      workspaceId,
      chatId,
      agentId,
      now: now().toISOString(),
    });
    return { session, created: true };
  }

  async function touchCustomerActivity({ sessionId }) {
    return repository.touchCustomerActivity({ id: sessionId });
  }

  async function touchAssistantActivity({ sessionId }) {
    return repository.touchAssistantActivity({ id: sessionId });
  }

  async function closeForHandoff({ sessionId }) {
    return repository.close({ id: sessionId, reason: 'handoff' });
  }

  async function closeManual({ sessionId }) {
    return repository.close({ id: sessionId, reason: 'manual' });
  }

  async function closeIdleSessions({ workspaceId }) {
    return repository.closeIdleSessions({
      workspaceId,
      thresholdMinutes: inactivityHours * 60,
    });
  }

  return {
    getOrCreateActiveSession,
    touchCustomerActivity,
    touchAssistantActivity,
    closeForHandoff,
    closeManual,
    closeIdleSessions,
  };
}
