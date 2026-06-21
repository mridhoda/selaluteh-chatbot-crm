import { agentsSupabaseRepository } from '../../db/repositories/index.js';

export async function publishAgent({ workspaceId, agentId, publishedBy, repository = agentsSupabaseRepository }) {
  const agent = await repository.findById({ workspaceId, agentId });
  if (!agent) return { success: false, error: 'not_found' };
  if (agent.status === 'archived') return { success: false, error: 'archived' };

  const version = (agent.metadata?.version || 0) + 1;
  const updated = await repository.update({ workspaceId, agentId, updates: {
    metadata: { ...(agent.metadata || {}), version, publishedAt: new Date().toISOString(), publishedBy },
  } });
  return { success: true, agent: updated, version };
}

export async function rollbackAgent({ workspaceId, agentId, targetVersion, repository = agentsSupabaseRepository }) {
  const agent = await repository.findById({ workspaceId, agentId });
  if (!agent) return { success: false, error: 'not_found' };

  const versionHistory = agent.metadata?.versionHistory || [];
  const target = versionHistory.find((v) => v.version === targetVersion);
  if (!target) return { success: false, error: 'version_not_found' };

  const updated = await repository.update({ workspaceId, agentId, updates: {
    behavior: target.behavior,
    prompt: target.prompt,
    tools: target.tools,
    knowledge: target.knowledge,
    metadata: { ...(agent.metadata || {}), version: targetVersion + 1, rolledBackFrom: agent.metadata?.version },
  } });
  return { success: true, agent: updated };
}
