import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expireQrSessions } from '../../../src/services/qr-order-session.service.js';

describe('QR session cleanup', () => {
  it('expires old QR sessions without deleting operational history', async () => {
    const now = new Date('2026-07-07T08:00:00.000Z');
    let receivedNow = null;
    const expiredSession = {
      id: 'qr-session-1',
      sessionStatus: 'expired',
      isActive: false,
      orderId: 'order-1',
    };

    const result = await expireQrSessions({ now }, {
      qrOrderSessionsRepository: {
        expireOldSessions: async (inputNow) => {
          receivedNow = inputNow;
          return [expiredSession];
        },
      },
    });

    assert.equal(receivedNow, now);
    assert.equal(result.expiredCount, 1);
    assert.equal(result.sessions[0].id, 'qr-session-1');
    assert.equal(result.sessions[0].orderId, 'order-1');
  });
});
