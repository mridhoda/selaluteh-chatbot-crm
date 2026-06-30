import { AppError } from '../../utils/errors.js';
import { decrypt, encrypt } from '../../utils/encryption.js';
import { env } from '../../config/env.js';
import { channelConnectionsRepository } from '../../db/repositories/index.js';
import { telegramApi as defaultTelegramApi } from './telegram-api.service.js';
import {
  buildTelegramWebhookUrl,
  generateConnectionPublicId,
  generateTelegramWebhookSecret,
} from './telegram-connection-id.service.js';
import {
  fingerprintCredential,
  hashTelegramWebhookSecret,
} from './telegram-connection-crypto.service.js';

function normalizeBotIdentity(bot = {}) {
  const id = bot.id ?? bot.result?.id;
  if (!id) throw new AppError('TELEGRAM_GET_ME_FAILED', 'Telegram bot identity missing id', 502);
  return {
    id: String(id),
    username: bot.username ?? bot.result?.username ?? null,
    displayName: bot.first_name ?? bot.result?.first_name ?? bot.result?.firstName ?? null,
  };
}

function sanitizeErrorMessage(error) {
  return String(error?.message || error || '').replace(/bot[0-9]+:[A-Za-z0-9_-]+/g, 'bot[REDACTED]');
}

export function createTelegramConnectionService({
  connectionRepository = channelConnectionsRepository,
  telegramApi = defaultTelegramApi,
  idGenerator = generateConnectionPublicId,
  secretGenerator = generateTelegramWebhookSecret,
  encryptCredential = encrypt,
  keyVersion = process.env.CHANNEL_CREDENTIAL_KEY_VERSION || 'v1',
  fingerprintPepper = process.env.CHANNEL_CREDENTIAL_FINGERPRINT_PEPPER || '',
} = {}) {
  async function connectTelegramBot({ workspaceId, actorUserId, botToken, publicBaseUrl = env.publicBaseUrl }) {
    if (!workspaceId) throw new AppError('MISSING_WORKSPACE_SCOPE', 'Workspace is required', 400);
    if (!botToken) throw new AppError('TELEGRAM_TOKEN_INVALID', 'Telegram bot token is required', 400);

    const bot = normalizeBotIdentity(await telegramApi.getMe(botToken));
    const duplicate = await connectionRepository.findActiveByProviderAccountId({
      provider: 'TELEGRAM',
      providerAccountId: bot.id,
    });

    if (duplicate && duplicate.workspaceId !== workspaceId) {
      throw new AppError('TELEGRAM_BOT_ALREADY_CONNECTED', 'Telegram bot is already connected to another workspace', 409);
    }

    const publicId = idGenerator();
    const webhookSecret = secretGenerator();
    const webhookUrl = buildTelegramWebhookUrl({ publicBaseUrl, connectionPublicId: publicId });
    const allowedUpdates = ['message', 'callback_query'];

    const connection = await connectionRepository.create({
      publicId,
      workspaceId,
      provider: 'TELEGRAM',
      providerAccountId: bot.id,
      providerUsername: bot.username,
      displayName: bot.displayName,
      credentialCiphertext: encryptCredential(botToken),
      credentialKeyVersion: keyVersion,
      credentialFingerprint: fingerprintCredential(botToken, fingerprintPepper),
      webhookSecretCiphertext: encryptCredential(webhookSecret),
      webhookSecretHash: hashTelegramWebhookSecret(webhookSecret),
      webhookSecretVersion: 1,
      connectionStatus: 'CONNECTING',
      webhookStatus: 'NOT_REGISTERED',
      allowedUpdates,
      createdBy: actorUserId,
    });

    try {
      await telegramApi.setWebhook(botToken, {
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: allowedUpdates,
        drop_pending_updates: false,
      });

      const info = await telegramApi.getWebhookInfo(botToken);
      if (info?.url && info.url !== webhookUrl) {
        throw new AppError('TELEGRAM_WEBHOOK_VERIFICATION_FAILED', 'Telegram webhook URL verification failed', 502, {
          expectedUrl: webhookUrl,
          actualUrl: info.url,
        });
      }

      return connectionRepository.markConnected({
        workspaceId,
        connectionId: connection.id,
        webhookUrl,
        allowedUpdates,
      });
    } catch (error) {
      await connectionRepository.markError?.({
        workspaceId,
        connectionId: connection.id,
        errorCode: error.code || 'TELEGRAM_SET_WEBHOOK_FAILED',
        errorMessage: sanitizeErrorMessage(error),
      });
      throw error;
    }
  }

  async function reconnectTelegramWebhook({ workspaceId, connectionId, publicBaseUrl = env.publicBaseUrl }) {
    const connection = await connectionRepository.findById({ workspaceId, connectionId });
    if (!connection) throw new AppError('TELEGRAM_CONNECTION_NOT_FOUND', 'Telegram connection not found', 404);
    if (connection.provider !== 'TELEGRAM') throw new AppError('TELEGRAM_CONNECTION_NOT_FOUND', 'Connection is not Telegram', 404);

    const botToken = decrypt(connection.credentialCiphertext || '');
    if (!botToken) throw new AppError('TELEGRAM_TOKEN_INVALID', 'Telegram credential unavailable', 409);
    const webhookSecret = decrypt(connection.webhookSecretCiphertext || '');
    if (!webhookSecret) throw new AppError('TELEGRAM_WEBHOOK_SECRET_MISSING', 'Telegram webhook secret unavailable', 409);

    const webhookUrl = buildTelegramWebhookUrl({ publicBaseUrl, connectionPublicId: connection.publicId });
    const allowedUpdates = ['message', 'callback_query'];

    try {
      await telegramApi.setWebhook(botToken, {
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: allowedUpdates,
        drop_pending_updates: false,
      });
      const info = await telegramApi.getWebhookInfo(botToken);
      if (info?.url && info.url !== webhookUrl) {
        throw new AppError('TELEGRAM_WEBHOOK_VERIFICATION_FAILED', 'Telegram webhook URL verification failed', 502, {
          expectedUrl: webhookUrl,
          actualUrl: info.url,
        });
      }
      return connectionRepository.markConnected({ workspaceId, connectionId, webhookUrl, allowedUpdates });
    } catch (error) {
      const marker = connection.lastWebhookVerifiedAt ? connectionRepository.markDegraded : connectionRepository.markError;
      await marker?.({ workspaceId, connectionId, errorCode: error.code || 'TELEGRAM_SET_WEBHOOK_FAILED', errorMessage: sanitizeErrorMessage(error) });
      throw error;
    }
  }

  return { connectTelegramBot, reconnectTelegramWebhook };
}

export const telegramConnectionService = createTelegramConnectionService();
