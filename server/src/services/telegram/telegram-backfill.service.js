import { encrypt } from '../../utils/encryption.js';
import {
  channelConnectionsRepository,
  platformsRepository,
} from '../../db/repositories/index.js';
import { telegramApi as defaultTelegramApi } from './telegram-api.service.js';
import {
  fingerprintCredential,
  hashTelegramWebhookSecret,
} from './telegram-connection-crypto.service.js';
import {
  generateConnectionPublicId,
  generateTelegramWebhookSecret,
} from './telegram-connection-id.service.js';

function normalizeBot(bot = {}) {
  return {
    id: String(bot.id ?? bot.result?.id),
    username: bot.username ?? bot.result?.username ?? null,
    displayName: bot.first_name ?? bot.result?.first_name ?? null,
  };
}

export function createTelegramBackfillService({
  platformsRepository: platformsRepo = platformsRepository,
  connectionRepository = channelConnectionsRepository,
  telegramApi = defaultTelegramApi,
  idGenerator = generateConnectionPublicId,
  secretGenerator = generateTelegramWebhookSecret,
  encryptCredential = encrypt,
  keyVersion = process.env.CHANNEL_CREDENTIAL_KEY_VERSION || 'v1',
  fingerprintPepper = process.env.CHANNEL_CREDENTIAL_FINGERPRINT_PEPPER || '',
} = {}) {
  async function backfillLegacyTelegramPlatforms() {
    const platforms = await platformsRepo.listWithCredentialsByType({ type: 'telegram' });
    const summary = { scanned: platforms.length, created: 0, skipped: 0, errors: [] };

    for (const platform of platforms) {
      try {
        if (!platform.token) {
          summary.skipped += 1;
          continue;
        }
        const bot = normalizeBot(await telegramApi.getMe(platform.token));
        const existing = await connectionRepository.findActiveByProviderAccountId({
          provider: 'TELEGRAM',
          providerAccountId: bot.id,
        });
        if (existing) {
          summary.skipped += 1;
          continue;
        }

        const webhookSecret = secretGenerator();
        const connection = await connectionRepository.create({
          publicId: idGenerator(),
          workspaceId: platform.workspaceId,
          provider: 'TELEGRAM',
          providerAccountId: bot.id,
          providerUsername: bot.username,
          displayName: bot.displayName || platform.label,
          credentialCiphertext: encryptCredential(platform.token),
          credentialKeyVersion: keyVersion,
          credentialFingerprint: fingerprintCredential(platform.token, fingerprintPepper),
          webhookSecretCiphertext: encryptCredential(webhookSecret),
          webhookSecretHash: hashTelegramWebhookSecret(webhookSecret),
          webhookSecretVersion: 1,
          connectionStatus: 'DRAFT',
          webhookStatus: 'NOT_REGISTERED',
          allowedUpdates: ['message', 'callback_query'],
          createdBy: null,
        });

        const metadata = {
          ...(platform.metadata || {}),
          channelConnectionId: connection.id,
          telegramBackfilledAt: new Date().toISOString(),
        };
        await platformsRepo.update({
          workspaceId: platform.workspaceId,
          platformId: platform.id,
          updates: { metadata },
        });
        summary.created += 1;
      } catch (error) {
        summary.errors.push({ platformId: platform.id, message: error?.message || String(error) });
      }
    }

    return summary;
  }

  return { backfillLegacyTelegramPlatforms };
}

export const telegramBackfillService = createTelegramBackfillService();
