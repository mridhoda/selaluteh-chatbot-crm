import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateConnectionPublicId,
  generateTelegramWebhookSecret,
  buildTelegramWebhookUrl,
} from '../../../src/services/telegram/telegram-connection-id.service.js';

describe('telegram connection identity', () => {
  it('generates non-sequential public connection ids with tgc prefix', () => {
    const first = generateConnectionPublicId();
    const second = generateConnectionPublicId();

    assert.match(first, /^tgc_[A-Za-z0-9_-]{16}$/);
    assert.match(second, /^tgc_[A-Za-z0-9_-]{16}$/);
    assert.notEqual(first, second);
  });

  it('generates Telegram-compatible webhook secrets', () => {
    const secret = generateTelegramWebhookSecret();

    assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
  });

  it('builds a versioned webhook URL from a public base URL', () => {
    const url = buildTelegramWebhookUrl({
      publicBaseUrl: 'https://crm-dev.incretlabs.my.id/',
      connectionPublicId: 'tgc_abc123XYZ7890000',
    });

    assert.equal(url, 'https://crm-dev.incretlabs.my.id/webhooks/telegram/v1/tgc_abc123XYZ7890000');
  });
});
