import express from 'express';
import { telegramWebhookController } from '../../controllers/telegram-webhook.controller.js';

const router = express.Router();

router.post('/:connectionPublicId', (req, res) => telegramWebhookController.handle(req, res));

export default router;
