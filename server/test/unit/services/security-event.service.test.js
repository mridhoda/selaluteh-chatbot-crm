import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recordSecurityEvent } from '../../../src/services/security-event.service.js';

describe('security event service', () => {
  it('delegates security event metadata to the repository', async () => {
    const rows = [];
    await recordSecurityEvent({
      workspaceId: 'workspace-1',
      eventType: 'qr.invalid_attempt',
      severity: 'medium',
      metadata: { code: 'QR_INVALID', authorization: 'Bearer abcdefghijklmnop' },
    }, {
      securityEventsRepository: {
        async log(entry) {
          rows.push(entry);
          return entry;
        },
      },
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].eventType, 'qr.invalid_attempt');
    assert.equal(rows[0].severity, 'medium');
    assert.equal(rows[0].metadata.authorization, 'Bearer abcdefghijklmnop');
  });

  it('does not throw when security event persistence fails', async () => {
    const result = await recordSecurityEvent({ eventType: 'checkout.idempotency_conflict' }, {
      securityEventsRepository: {
        async log() {
          throw new Error('db unavailable');
        },
      },
    });

    assert.equal(result, null);
  });
});
