import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HandlingMode, ConversationStatus, CRM_ERRORS } from '../../../src/crm/crm-types.js';

describe('crm-types', () => {
  it('has handling modes', () => {
    assert.strictEqual(HandlingMode.AI, 'AI');
    assert.strictEqual(HandlingMode.HUMAN, 'HUMAN');
  });

  it('has conversation statuses', () => {
    assert.strictEqual(ConversationStatus.ACTIVE, 'ACTIVE');
    assert.strictEqual(ConversationStatus.RESOLVED, 'RESOLVED');
  });

  it('has error codes', () => {
    assert.strictEqual(CRM_ERRORS.CONTACT_NOT_FOUND.code, 'CONTACT_NOT_FOUND');
    assert.strictEqual(CRM_ERRORS.CONTACT_MERGE_CONFLICT.code, 'CONTACT_MERGE_CONFLICT');
  });
});
