import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramWebhookEventsWorker } from '../../../src/workers/telegram-webhook-events.worker.js';

describe('telegram webhook events worker', () => {
  it('claims one event, processes it, then marks processed', async () => {
    const calls = [];
    const worker = createTelegramWebhookEventsWorker({
      eventRepository: {
        claimNext: async () => ({ id: 'event-1', workspaceId: 'workspace-1', connectionId: 'conn-1', payload: { update_id: 1 } }),
        markProcessed: async (id) => calls.push(['markProcessed', id]),
      },
      processor: {
        process: async (event) => calls.push(['process', event.id]),
      },
    });

    const processed = await worker.processOnce();

    assert.equal(processed, true);
    assert.deepEqual(calls, [['process', 'event-1'], ['markProcessed', 'event-1']]);
  });

  it('schedules retry for retryable processing errors', async () => {
    const calls = [];
    const worker = createTelegramWebhookEventsWorker({
      eventRepository: {
        claimNext: async () => ({ id: 'event-1', attemptCount: 1, payload: {} }),
        scheduleRetry: async (data) => calls.push(['scheduleRetry', data.eventId, data.errorCode]),
        moveToDeadLetter: async (data) => calls.push(['moveToDeadLetter', data.eventId, data.errorCode]),
      },
      processor: {
        process: async () => {
          const err = new Error('temporary');
          err.retryable = true;
          throw err;
        },
      },
      retryBaseMs: 1,
      maxAttempts: 3,
    });

    const processed = await worker.processOnce();

    assert.equal(processed, true);
    assert.equal(calls[0][0], 'scheduleRetry');
    assert.equal(calls[0][1], 'event-1');
  });
});
