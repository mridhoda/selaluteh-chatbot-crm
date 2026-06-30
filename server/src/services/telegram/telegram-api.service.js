export function createTelegramApi({ fetchImpl = fetch } = {}) {
  async function request(token, method, payload = null) {
    if (!token) throw new Error('TELEGRAM_TOKEN_REQUIRED');
    const options = payload
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        }
      : { signal: AbortSignal.timeout(10000) };
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, options);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      const error = new Error(`Telegram API failed: ${JSON.stringify(data)}`);
      error.code = method === 'getMe' ? 'TELEGRAM_GET_ME_FAILED' : 'TELEGRAM_API_FAILED';
      error.providerResponse = data;
      throw error;
    }
    return data.result ?? data;
  }

  return {
    getMe(token) {
      return request(token, 'getMe');
    },
    setWebhook(token, payload) {
      return request(token, 'setWebhook', payload);
    },
    getWebhookInfo(token) {
      return request(token, 'getWebhookInfo');
    },
    deleteWebhook(token, payload = {}) {
      return request(token, 'deleteWebhook', payload);
    },
  };
}

export const telegramApi = createTelegramApi();
