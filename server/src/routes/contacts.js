import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { contactsRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', async (req, res, next) => {
  try {
    const { search, tags, page, limit, sort } = req.query;
    const data = await contactsRepository.list({ workspaceId: req.me.workspaceId, search, tags, page, limit, sort });
    const total = await contactsRepository.count({ workspaceId: req.me.workspaceId, search, tags });
    res.json({ data, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const contact = await contactsRepository.findById({ workspaceId: req.me.workspaceId, contactId: req.params.id });
    if (!contact) throw new AppError('NOT_FOUND', 'Contact not found', 404);
    res.json({ data: contact });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const contact = await contactsRepository.update({ workspaceId: req.me.workspaceId, contactId: req.params.id, updates: req.body });
    if (!contact) throw new AppError('NOT_FOUND', 'Contact not found', 404);
    res.json({ data: contact });
  } catch (err) { next(err); }
});

export default router;
