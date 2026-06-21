import express from 'express';
import { agentsSupabaseRepository } from '../../db/repositories/index.js';
import { validateAgentConfig } from '../../ai/agents/agent-schema.js';
import { publishAgent, rollbackAgent } from '../../ai/agents/agent-versioning.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const agents = await agentsSupabaseRepository.list({ workspaceId: req.workspaceId });
    res.json({ data: agents.map((a) => ({ id: a.id, name: a.name, status: a.status, displayName: a.displayName })) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const validation = validateAgentConfig(req.body);
    if (!validation.valid) return res.status(400).json({ error: 'validation_failed', details: validation.errors });
    const agent = await agentsSupabaseRepository.create({ workspaceId: req.workspaceId, ...req.body });
    res.status(201).json({ data: agent });
  } catch (err) { next(err); }
});

router.get('/:agentId', async (req, res, next) => {
  try {
    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.workspaceId, agentId: req.params.agentId });
    if (!agent) return res.status(404).json({ error: 'not_found' });
    res.json({ data: agent });
  } catch (err) { next(err); }
});

router.patch('/:agentId', async (req, res, next) => {
  try {
    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.workspaceId, agentId: req.params.agentId });
    if (!agent) return res.status(404).json({ error: 'not_found' });
    const updates = { ...req.body };
    delete updates.id; delete updates.workspace_id; delete updates.created_at;
    const validation = validateAgentConfig({ ...agent, ...updates });
    if (!validation.valid) return res.status(400).json({ error: 'validation_failed', details: validation.errors });
    const updated = await agentsSupabaseRepository.update({ workspaceId: req.workspaceId, agentId: req.params.agentId, updates });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

router.post('/:agentId/publish', async (req, res, next) => {
  try {
    const result = await publishAgent({ workspaceId: req.workspaceId, agentId: req.params.agentId, publishedBy: req.userId, repository: agentsSupabaseRepository });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ data: result.agent, version: result.version });
  } catch (err) { next(err); }
});

router.post('/:agentId/archive', async (req, res, next) => {
  try {
    const updated = await agentsSupabaseRepository.update({ workspaceId: req.workspaceId, agentId: req.params.agentId, updates: { status: 'archived' } });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

router.post('/:agentId/test', async (req, res, next) => {
  try {
    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.workspaceId, agentId: req.params.agentId });
    if (!agent) return res.status(404).json({ error: 'not_found' });
    res.json({ data: { status: 'test_ok', agentId: agent.id, tools: (agent.tools || []).length, knowledge: (agent.knowledge || []).length } });
  } catch (err) { next(err); }
});

router.get('/:agentId/versions', async (req, res, next) => {
  try {
    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.workspaceId, agentId: req.params.agentId });
    if (!agent) return res.status(404).json({ error: 'not_found' });
    res.json({ data: agent.metadata?.versionHistory || [{ version: agent.metadata?.version || 1, publishedAt: agent.createdAt }] });
  } catch (err) { next(err); }
});

router.get('/:agentId/health', async (req, res, next) => {
  try {
    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.workspaceId, agentId: req.params.agentId });
    if (!agent) return res.status(404).json({ error: 'not_found' });
    res.json({
      data: {
        agentId: agent.id, name: agent.name, status: agent.status,
        provider: agent.aiSettings?.provider || 'not_configured',
        model: agent.aiSettings?.model || 'not_configured',
        knowledgeReady: (agent.knowledge || []).length > 0,
        toolCount: (agent.tools || []).length,
      },
    });
  } catch (err) { next(err); }
});

export default router;
