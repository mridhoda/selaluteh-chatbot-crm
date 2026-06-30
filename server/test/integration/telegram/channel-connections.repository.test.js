import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  channelConnectionsRepository,
  outletChannelAssignmentsRepository,
  telegramWebhookEventsRepository,
} from '../../../src/db/repositories/index.js';

describe('telegram channel connection repositories contract', () => {
  it('exposes channel connection methods required by exact webhook resolution', () => {
    for (const method of [
      'create',
      'findActiveByPublicId',
      'findById',
      'findActiveByProviderAccountId',
      'markConnected',
      'markError',
      'recordInboundReceived',
      'recordOutboundSuccess',
      'listActiveByProvider',
    ]) {
      assert.equal(typeof channelConnectionsRepository[method], 'function', `${method} exists`);
    }
  });

  it('exposes Telegram webhook event methods required by async processing', () => {
    for (const method of [
      'insertOnce',
      'findByConnectionUpdateId',
      'claimNext',
      'markProcessed',
      'scheduleRetry',
      'moveToDeadLetter',
    ]) {
      assert.equal(typeof telegramWebhookEventsRepository[method], 'function', `${method} exists`);
    }
  });

  it('exposes outlet channel assignment methods for workspace-level connections', () => {
    for (const method of ['create', 'listByConnection', 'listByWorkspace']) {
      assert.equal(typeof outletChannelAssignmentsRepository[method], 'function', `${method} exists`);
    }
  });
});
