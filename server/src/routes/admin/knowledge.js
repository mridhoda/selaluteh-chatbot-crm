import express from 'express';
import { knowledgeSourcesRepository, knowledgeChunksRepository } from '../../db/repositories/index.js';

const router = express.Router();

router.get('/sources', async (req, res, next) => {
  try {
    const { status, outletId, page = 1, limit = 20 } = req.query;
    const sources = await knowledgeSourcesRepository.list({
      workspaceId: req.workspaceId,
      status: status || null,
      outletId: outletId || null,
    });
    const offset = (parseInt(page) - 1) * parseInt(limit);
    res.json({ data: sources.slice(offset, offset + parseInt(limit)) });
  } catch (err) { next(err); }
});

router.post('/sources', async (req, res, next) => {
  try {
    const { title, sourceType, content, outletId, scope } = req.body;
    const source = await knowledgeSourcesRepository.createDraft({
      workspaceId: req.workspaceId, title, sourceType, content, outletId, scope,
    });
    res.status(201).json({ data: source });
  } catch (err) { next(err); }
});

router.get('/sources/:id', async (req, res, next) => {
  try {
    const source = await knowledgeSourcesRepository.findById({ workspaceId: req.workspaceId, sourceId: req.params.id });
    if (!source) return res.status(404).json({ error: 'not_found' });
    res.json({ data: source });
  } catch (err) { next(err); }
});

router.get('/sources/:id/chunks', async (req, res, next) => {
  try {
    const chunks = await knowledgeChunksRepository.listChunks({ sourceId: req.params.id });
    res.json({ data: chunks });
  } catch (err) { next(err); }
});

export default router;
