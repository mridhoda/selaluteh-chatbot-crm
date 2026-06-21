import { platformsSupabaseRepository } from '../db/repositories/index.js';

let healthCheckHandle = null;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function createTelegramWebhookManager({ repository, publicBaseUrl } = {}) {
  const repo = repository || platformsSupabaseRepository;

  function isValidPublicWebhookBaseUrl(baseUrl = '') {
    try {
      return new URL(baseUrl).protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function setWebhookForPlatform(platform) {
    const baseUrl = (publicBaseUrl || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
    if (!isValidPublicWebhookBaseUrl(baseUrl)) return { ok: false, error: 'no_valid_https_base_url' };
    if (!platform?.token) return { ok: false, error: 'no_token' };

    const webhookUrl = baseUrl + '/webhook/telegram';
    const res = await fetch('https://api.telegram.org/bot' + platform.token + '/setWebhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40,
        drop_pending_updates: false,
        allowed_updates: ['message', 'callback_query'],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return { ok: data.ok, webhookUrl, result: data };
  }

  async function checkWebhookForPlatform(platform) {
    if (!platform?.token) return { ok: false, error: 'no_token' };
    const res = await fetch('https://api.telegram.org/bot' + platform.token + '/getWebhookInfo', {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.description };

    const info = data.result;
    const expectedUrl = ((publicBaseUrl || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '') + '/webhook/telegram');

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
    if (!isValidPublicWebhookBaseUrl(baseUrl)) {
      return;
    }

    try {
      const platform = await repo.findLatestByType({ type: 'telegram' });
      if (!platform) return;

      const check = await checkWebhookForPlatform(platform);
      if (!check.ok || !check.urlMatch || check.lastErrorMessage) {
        const result = await setWebhookForPlatform(platform);
        if (result.ok) {
          console.log('[webhook-manager] Webhook renewed for ' + platform.id?.slice(0, 8) + ' → ' + result.webhookUrl);
        } else {
          console.error('[webhook-manager] Failed to set webhook: ' + result.error);
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

  return { setWebhookForPlatform, checkWebhookForPlatform, ensureAllTelegramWebhooks, start, stop };
}
