import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeTelegramUpdate } from '../../../src/integrations/telegram/telegram-parser.js';

describe('telegram-parser location normalization', () => {
  it('normalizes Telegram shared location payload', () => {
    const normalized = normalizeTelegramUpdate({
      update_id: 123,
      message: {
        message_id: 456,
        chat: { id: 789, first_name: 'Customer' },
        from: { id: 789, first_name: 'Customer' },
        location: {
          latitude: -0.502106,
          longitude: 117.153709,
        },
      },
    });

    assert.equal(normalized.text, '');
    assert.deepEqual(normalized.location, {
      latitude: -0.502106,
      longitude: 117.153709,
    });
  });
});