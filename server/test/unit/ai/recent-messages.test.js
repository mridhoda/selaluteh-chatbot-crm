import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMessageEligibleForContext } from '../../../src/ai/context/recent-messages.js';
import { buildMessage } from '../../helpers/ai/index.js';

describe('isMessageEligibleForContext', () => {
  it('returns true for normal customer message', () => {
    const msg = buildMessage({ senderType: 'customer', direction: 'inbound', content: 'Halo' });
    assert.equal(isMessageEligibleForContext(msg), true);
  });

  it('returns true for assistant message', () => {
    const msg = buildMessage({ senderType: 'assistant', direction: 'outbound', content: 'Halo juga' });
    assert.equal(isMessageEligibleForContext(msg), true);
  });

  it('returns false for system/internals', () => {
    const msg = buildMessage({ senderType: 'system', direction: 'internal', content: 'webhook received' });
    assert.equal(isMessageEligibleForContext(msg), false);
  });

  it('returns false for null message', () => {
    assert.equal(isMessageEligibleForContext(null), false);
  });

  it('returns true for human agent messages', () => {
    const msg = buildMessage({ senderType: 'human_agent', direction: 'outbound', content: 'Saya akan bantu' });
    assert.equal(isMessageEligibleForContext(msg), true);
  });
});
