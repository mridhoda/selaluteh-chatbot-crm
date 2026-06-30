import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  contactsRepository,
  chatsRepository,
  messagesRepository,
  platformsRepository,
} from '../../../src/db/repositories/index.js';

describe('connection-scoped repository contracts', () => {
  it('exposes contact identity methods scoped by channel connection', () => {
    assert.equal(typeof contactsRepository.upsertByChannelIdentity, 'function');
  });

  it('exposes conversation methods scoped by channel connection', () => {
    assert.equal(typeof chatsRepository.upsertByChannelConversation, 'function');
    assert.equal(typeof chatsRepository.findByIdWithConnectionAndContact, 'function');
  });

  it('exposes message methods scoped by channel connection', () => {
    assert.equal(typeof messagesRepository.createWithConnection, 'function');
    assert.equal(typeof messagesRepository.findByConnectionProviderMessage, 'function');
  });

  it('exposes channel connection diagnostics listing by workspace/provider', async () => {
    const { channelConnectionsRepository } = await import('../../../src/db/repositories/index.js');
    assert.equal(typeof channelConnectionsRepository.listByWorkspaceProvider, 'function');
    assert.equal(typeof channelConnectionsRepository.markDegraded, 'function');
    assert.equal(typeof platformsRepository.findByChannelConnectionId, 'function');
  });
});
