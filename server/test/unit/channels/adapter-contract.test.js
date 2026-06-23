import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeTelegramAdapter, createFakeWhatsAppAdapter, DELIVERY_STATUSES } from '../../../test/helpers/fake-channel-adapters.js';

describe('channel adapter contracts', () => {
  it('telegram adapter contract', async () => {
    const adapter = createFakeTelegramAdapter();
    const result = await adapter.sendMessage('123', 'hello');
    assert.ok(result.messageId);
    assert.strictEqual(result.status, 'SENT');
    const verify = await adapter.verifyWebhook({}, {});
    assert.ok(verify.verified);
  });

  it('whatsapp adapter contract', async () => {
    const adapter = createFakeWhatsAppAdapter();
    const result = await adapter.sendMessage('456', 'hello');
    assert.ok(result.messageId);
    assert.strictEqual(result.status, 'SENT');
    const verify = await adapter.verifyWebhook({}, {});
    assert.ok(verify.verified);
  });

  it('delivery statuses defined', () => {
    assert.ok(DELIVERY_STATUSES.includes('SENT'));
    assert.ok(DELIVERY_STATUSES.includes('DELIVERED'));
    assert.ok(DELIVERY_STATUSES.includes('FAILED'));
  });
});
