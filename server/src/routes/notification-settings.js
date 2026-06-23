import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission, requireOutletAccess } from '../middleware/authorization.js';
import {
  getNotificationSettings,
  updateNotificationSettings,
  setOutletRecipient,
} from '../services/notification-settings.service.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

router.get('/settings/notifications', authorizePermission('notifications', 'read'), async (req, res, next) => {
  try {
    const prefs = await getNotificationSettings({ workspaceId: req.me.workspaceId });
    res.json({ data: prefs });
  } catch (err) { next(err); }
});

router.put('/settings/notifications', authorizePermission('notifications', 'write'), async (req, res, next) => {
  try {
    const prefs = await updateNotificationSettings({ workspaceId: req.me.workspaceId, updates: req.body });
    res.json({ data: prefs });
  } catch (err) { next(err); }
});

router.put('/settings/notifications/outlet-recipients/:outletId', authorizePermission('notifications', 'write'), requireOutletAccess('outletId'), async (req, res, next) => {
  try {
    const { telegramChatId } = req.body;
    if (telegramChatId !== null && (typeof telegramChatId !== 'string' || !telegramChatId.trim())) {
      throw new AppError('VALIDATION', 'telegramChatId must be a non-empty string or null', 400);
    }
    const result = await setOutletRecipient({
      workspaceId: req.me.workspaceId,
      outletId: req.params.outletId,
      telegramChatId,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
