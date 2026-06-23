/**
 * Fake provider adapters for channel-connections testing.
 */

export function createFakeTelegramAdapter() {
  return {
    sendMessage: async (chatId, text) => ({ messageId: `tg-${Date.now()}`, status: 'SENT' }),
    getUpdates: async () => [],
    verifyWebhook: async (headers, body) => ({ verified: true, provider: 'telegram' }),
  };
}

export function createFakeWhatsAppAdapter() {
  return {
    sendMessage: async (to, text) => ({ messageId: `wa-${Date.now()}`, status: 'SENT' }),
    verifyWebhook: async (headers, body) => ({ verified: true, provider: 'whatsapp' }),
  };
}

export const DELIVERY_STATUSES = ['SENT', 'DELIVERED', 'READ', 'FAILED', 'UNKNOWN'];
