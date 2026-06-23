import express from 'express';
import multer from 'multer';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { uploadRateLimit } from '../middleware/rate-limit.js';
import { uploadFile, getFile, deleteFile } from '../services/file.service.js';

const router = express.Router();
const upload = multer({
  dest: 'uploads/tmp/',
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

router.use(authRequired, attachUser, attachWorkspaceContext);

router.post('/upload', authorizePermission('files', 'write'), uploadRateLimit, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const file = await uploadFile({
      workspaceId: req.me.workspaceId,
      file: req.file,
      userId: req.me.id,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
    });
    res.status(201).json({ data: file });
  } catch (err) { next(err); }
});

router.get('/:fileId', authorizePermission('files', 'read'), async (req, res, next) => {
  try {
    const file = await getFile({ workspaceId: req.me.workspaceId, fileId: req.params.fileId });
    res.json({ data: file });
  } catch (err) { next(err); }
});

router.delete('/:fileId', authorizePermission('files', 'delete'), async (req, res, next) => {
  try {
    await deleteFile({ workspaceId: req.me.workspaceId, fileId: req.params.fileId });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
