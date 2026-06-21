import express from 'express';
import { aiRunsRepository, aiToolCallsRepository, aiFeedbackRepository } from '../../db/repositories/index.js';

const router = express.Router();

router.get('/chats/:chatId/runs', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const runs = await aiRunsRepository.list({
      workspaceId: req.workspaceId,
      chatId: req.params.chatId,
      limit: parseInt(limit),
      offset,
    });
    res.json({ data: runs });
  } catch (err) { next(err); }
});

router.get('/runs/:runId', async (req, res, next) => {
  try {
    const run = await aiRunsRepository.findById({ workspaceId: req.workspaceId, runId: req.params.runId });
    if (!run) return res.status(404).json({ error: 'not_found' });
    res.json({ data: run });
  } catch (err) { next(err); }
});

router.get('/runs/:runId/tool-calls', async (req, res, next) => {
  try {
    const calls = await aiToolCallsRepository.listByRun({ runId: req.params.runId });
    res.json({ data: calls });
  } catch (err) { next(err); }
});

router.post('/runs/:runId/feedback', async (req, res, next) => {
  try {
    const { rating, reasonCode, comment } = req.body;
    const feedback = await aiFeedbackRepository.create({
      workspaceId: req.workspaceId,
      runId: req.params.runId,
      rating: rating || null,
      reasonCode: reasonCode || null,
      comment: comment || null,
      reviewedBy: req.userId || null,
    });
    res.status(201).json({ data: feedback });
  } catch (err) { next(err); }
});

export default router;
