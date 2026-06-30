import { channelConnectionsRepository } from '../db/repositories/index.js';
import { decrypt } from '../utils/encryption.js';
import { buildTelegramWebhookUrl } from '../services/telegram/telegram-connection-id.service.js';

let healthCheckHandle = null;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function createTelegramWebhookManager({ repository, publicBaseUrl } = {}) {
  const repo = repository || channelConnectionsRepository;

  function isValidPublicWebhookBaseUrl(baseUrl = '') {
    try {
      return new URL(baseUrl).protocol === 'https:';
    } catch {
      return false;
    }
  }

  function getToken(connection) {
    try {
      return decrypt(connection?.credentialCiphertext || '');
    } catch {
      return '';
    }
  }

  function getWebhookSecret(connection) {
    try {
      return decrypt(connection?.webhookSecretCiphertext || '');
    } catch {
      return '';
    }
  }

  function expectedWebhookUrl(connection) {
    const baseUrl = (publicBaseUrl || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
    return buildTelegramWebhookUrl({ publicBaseUrl: baseUrl, connectionPublicId: connection.publicId });
  }

  async function setWebhookForConnection(connection) {
    const baseUrl = (publicBaseUrl || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
    if (!isValidPublicWebhookBaseUrl(baseUrl)) return { ok: false, error: 'no_valid_https_base_url' };
    const token = getToken(connection);
    if (!token) return { ok: false, error: 'no_token' };
    const webhookSecret = getWebhookSecret(connection);
    if (!webhookSecret) return { ok: false, error: 'no_webhook_secret' };

    const webhookUrl = expectedWebhookUrl(connection);
    const res = await fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40,
        drop_pending_updates: false,
        allowed_updates: ['message', 'callback_query'],
        secret_token: webhookSecret,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return { ok: data.ok, webhookUrl, result: data, error: data.description };
  }

  async function checkWebhookForConnection(connection) {
    const token = getToken(connection);
    if (!token) return { ok: false, error: 'no_token' };
    const res = await fetch('https://api.telegram.org/bot' + token + '/getWebhookInfo', {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.description };

    const info = data.result;
    const expectedUrl = expectedWebhookUrl(connection);

    return {
      ok: true,
      url: info.url || '',
      expectedUrl,
      urlMatch: (info.url || '') === expectedUrl,
      pendingUpdateCount: info.pending_update_count,
      lastErrorDate: info.last_error_date,
      lastErrorMessage: info.last_error_message,
    };
  }

  async function ensureAllTelegramWebhooks() {
    const baseUrl = publicBaseUrl || process.env.PUBLIC_BASE_URL || '';
    if (!isValidPublicWebhookBaseUrl(baseUrl)) return;

    try {
      const connections = await repo.listActiveByProvider({ provider: 'TELEGRAM' });
      if (!connections?.length) return;

      for (const connection of connections) {
        const check = await checkWebhookForConnection(connection);
        if (check.ok && check.urlMatch && !check.lastErrorMessage) continue;

        const result = await setWebhookForConnection(connection);
        if (result.ok) {
          await repo.markConnected?.({
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
            webhookUrl: result.webhookUrl,
            allowedUpdates: ['message', 'callback_query'],
          });
          console.log('[webhook-manager] Webhook renewed for connection ' + connection.id?.slice(0, 8) + ' -> ' + result.webhookUrl);
        } else {
          const marker = connection.lastWebhookVerifiedAt ? repo.markDegraded : repo.markError;
          await marker?.({
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
            errorCode: result.error || 'TELEGRAM_SET_WEBHOOK_FAILED',
            errorMessage: result.error || 'Failed to set webhook',
          });
          console.error('[webhook-manager] Failed to set webhook for connection ' + connection.id?.slice(0, 8) + ': ' + result.error);
        }
      }
    } catch (err) {
      console.error('[webhook-manager] Error:', err.message);
    }
  }

  function start(opts = {}) {
    if (healthCheckHandle) return;
    const interval = opts.intervalMs || CHECK_INTERVAL_MS;

    ensureAllTelegramWebhooks();
    healthCheckHandle = setInterval(ensureAllTelegramWebhooks, interval);
    console.log('[webhook-manager] Worker started (interval: ' + (interval / 1000) + 's)');
  }

  function stop() {
    if (healthCheckHandle) {
      clearInterval(healthCheckHandle);
      healthCheckHandle = null;
    }
  }

  return { setWebhookForConnection, checkWebhookForConnection, ensureAllTelegramWebhooks, start, stop };
}
