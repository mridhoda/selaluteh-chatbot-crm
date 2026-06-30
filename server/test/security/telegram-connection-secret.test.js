import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  hashTelegramWebhookSecret,
  verifyTelegramWebhookSecret,
  fingerprintCredential,
} from '../../src/services/telegram/telegram-connection-crypto.service.js';

describe('telegram connection secret security', () => {
  it('hashes and verifies webhook secrets without storing plaintext', () => {
    const hash = hashTelegramWebhookSecret('secret_A');

    assert.notEqual(hash, 'secret_A');
    assert.equal(verifyTelegramWebhookSecret({ receivedSecret: 'secret_A', storedHash: hash }), true);
    assert.equal(verifyTelegramWebhookSecret({ receivedSecret: 'secret_B', storedHash: hash }), false);
  });

  it('uses credential fingerprints that are deterministic and pepper-bound', () => {
    const one = fingerprintCredential('123:ABC', 'pepper-a');
    const two = fingerprintCredential('123:ABC', 'pepper-a');
    const three = fingerprintCredential('123:ABC', 'pepper-b');

    assert.equal(one, two);
    assert.notEqual(one, three);
    assert.match(one, /^[a-f0-9]{64}$/);
  });
});
