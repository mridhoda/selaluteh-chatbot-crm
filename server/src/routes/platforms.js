/**
 * platforms.js — Supabase-backed (task 24.9 complete)
 *
 * Platform management routes.
 * Migrated from Mongoose to platformsSupabaseRepository.
 * UUID params validated with native UUID regex, not Mongoose ObjectId.
 */

import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { providerSyncRateLimit } from '../middleware/rate-limit.js';
import { canManageWorkspace } from '../services/access-control.service.js';
import { platformsSupabaseRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => UUID_RE.test(id);

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/', authorizePermission('platforms', 'read'), async (req, res, next) => {
  try {
    const platforms = await platformsSupabaseRepository.list({ workspaceId: req.me.workspaceId });
    res.json(platforms);
  } catch (err) { next(err); }
});

router.get('/:id', authorizePermission('platforms', 'read'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    const platform = await platformsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, platformId: req.params.id });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json(platform);
  } catch (err) { next(err); }
});

router.post('/', authorizePermission('platforms', 'write'), async (req, res, next) => {
  try {
    if (!req.body.type || !req.body.label) throw new AppError('VALIDATION', 'Missing type or label', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const platform = await platformsSupabaseRepository.create({
      workspaceId: req.me.workspaceId,
      userId: req.me.id,
      payload: req.body,
    });
    res.status(201).json(platform);
  } catch (err) { next(err); }
});

router.put('/:id', authorizePermission('platforms', 'write'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const platform = await platformsSupabaseRepository.update({
      workspaceId: req.me.workspaceId,
      platformId: req.params.id,
      updates: req.body,
    });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json(platform);
  } catch (err) { next(err); }
});

router.delete('/:id', authorizePermission('platforms', 'write'), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    if (!canManageWorkspace(req.me)) throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    const deleted = await platformsSupabaseRepository.remove({ workspaceId: req.me.workspaceId, platformId: req.params.id });
    if (!deleted) throw new AppError('NOT_FOUND', 'Platform not found', 404);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/:id/test', authorizePermission('platforms', 'test'), providerSyncRateLimit, async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw new AppError('VALIDATION', 'Invalid platform id', 400);
    const platform = await platformsSupabaseRepository.findByIdWithCredentials({
      workspaceId: req.me.workspaceId,
      platformId: req.params.id,
    });
    if (!platform) throw new AppError('NOT_FOUND', 'Platform not found', 404);

    let ok = false;
    let message = '';

    try {
      if (platform.type === 'telegram') {
        if (!platform.token) throw new AppError('VALIDATION', 'Telegram token is missing', 400);
        const resp = await fetch(`https://api.telegram.org/bot${platform.token}/getMe`);
        const data = await resp.json();
        if (data.ok) {
          ok = true;
          message = `Connected to Telegram bot: @${data.result.username}`;
        } else {
          message = `Telegram error: ${data.description}`;
        }
      } else if (platform.type === 'whatsapp') {
        if (!platform.token || !platform.phoneNumberId) {
          throw new AppError('VALIDATION', 'WhatsApp token or Phone Number ID is missing', 400);
        }
        const resp = await fetch(`https://graph.facebook.com/v19.0/${platform.phoneNumberId}`, {
          headers: { Authorization: `Bearer ${platform.token}` }
        });
        const data = await resp.json();
        if (!data.error) {
          ok = true;
          message = `Connected to WhatsApp Number: ${data.display_phone_number || platform.phoneNumberId}`;
        } else {
          message = `Meta error: ${data.error.message}`;
        }
      } else if (platform.type === 'instagram') {
        if (!platform.token || !platform.pageId) {
          throw new AppError('VALIDATION', 'Instagram token or Page ID is missing', 400);
        }
        const resp = await fetch(`https://graph.facebook.com/v19.0/${platform.pageId}?fields=name`, {
          headers: { Authorization: `Bearer ${platform.token}` }
        });
        const data = await resp.json();
        if (!data.error) {
          ok = true;
          message = `Connected to Instagram Page: ${data.name}`;
        } else {
          message = `Meta error: ${data.error.message}`;
        }
      } else {
        return res.json({ supported: false });
      }
    } catch (fetchErr) {
      if (fetchErr instanceof AppError) throw fetchErr;
      ok = false;
      message = `Connection failed: ${fetchErr.message}`;
    }

    if (ok) {
      res.json({ supported: true, ok: true, message });
    } else {
      res.status(400).json({ supported: true, ok: false, error: message });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
