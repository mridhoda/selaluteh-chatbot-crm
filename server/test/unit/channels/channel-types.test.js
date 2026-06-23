import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConnectionStatus, ChannelType, CHANNEL_ERRORS } from '../../../src/channels/channel-types.js';

describe('channel-types', () => {
  it('has expected statuses', () => {
    assert.strictEqual(ConnectionStatus.CONNECTED, 'CONNECTED');
    assert.strictEqual(ConnectionStatus.NEEDS_REAUTHORIZATION, 'NEEDS_REAUTHORIZATION');
  });

  it('has WHATSAPP and TELEGRAM', () => {
    assert.strictEqual(ChannelType.WHATSAPP, 'WHATSAPP');
    assert.strictEqual(ChannelType.TELEGRAM, 'TELEGRAM');
  });

  it('has error codes', () => {
    assert.strictEqual(CHANNEL_ERRORS.NOT_CONNECTED.code, 'CHANNEL_NOT_CONNECTED');
    assert.strictEqual(CHANNEL_ERRORS.OUTLET_DISABLED.code, 'CHANNEL_OUTLET_DISABLED');
  });
});
