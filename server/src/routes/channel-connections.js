import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { channelConnectionsRepository } from '../db/repositories/index.js';
import { buildTelegramWebhookUrl } from '../services/telegram/telegram-connection-id.service.js';
import { env } from '../config/env.js';

const router = express.Router();
router.use(authRequired, attachUser, attachWorkspaceContext);

function sanitizeConnection(connection) {
  const expectedWebhookUrl = connection.provider === 'TELEGRAM'
    ? buildTelegramWebhookUrl({ publicBaseUrl: env.publicBaseUrl, connectionPublicId: connection.publicId })
    : null;
  return {
    id: connection.id,
    publicId: connection.publicId,
    workspaceId: connection.workspaceId,
    provider: connection.provider,
    providerAccountId: connection.providerAccountId,
    providerUsername: connection.providerUsername,
    displayName: connection.displayName,
    connectionStatus: connection.connectionStatus,
    webhookStatus: connection.webhookStatus,
    webhookUrl: connection.webhookUrl,
    expectedWebhookUrl,
    webhookMatchesExpected: expectedWebhookUrl ? connection.webhookUrl === expectedWebhookUrl : null,
    lastWebhookRegisteredAt: connection.lastWebhookRegisteredAt,
    lastWebhookVerifiedAt: connection.lastWebhookVerifiedAt,
    lastWebhookReceivedAt: connection.lastWebhookReceivedAt,
    lastOutboundSuccessAt: connection.lastOutboundSuccessAt,
    lastReconciledAt: connection.lastReconciledAt,
    pendingUpdateCount: connection.pendingUpdateCount,
    lastErrorCode: connection.lastErrorCode,
    lastErrorMessage: connection.lastErrorMessage,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const provider = req.query.provider ? String(req.query.provider).toUpperCase() : 'TELEGRAM';
    const connections = await channelConnectionsRepository.listByWorkspaceProvider({
      workspaceId: req.me.workspaceId,
      provider,
    });
    res.json(connections.map(sanitizeConnection));
  } catch (error) {
    next(error);
  }
});

export default router;
