import { agentsSupabaseRepository } from '../../db/repositories/index.js';

export function createAgentRouter({ repository = agentsSupabaseRepository } = {}) {
  async function resolveAgent({ workspaceId, platformId, chat, outletId }) {
    if (chat?.agentId) {
      const agent = await repository.findById({ workspaceId, agentId: chat.agentId });
      if (agent && agent.status === 'active') return agent;
    }

    const workspaceAgents = await repository.list({ workspaceId });
    const active = workspaceAgents.filter((a) => a.status === 'active');

    if (platformId) {
      const platformMatch = active.find((a) => a.platformId === platformId);
      if (platformMatch) return platformMatch;
    }

    return active[0] || null;
  }

  return { resolveAgent };
}
