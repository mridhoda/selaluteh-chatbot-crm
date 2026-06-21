import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createConfirmation, isValidConfirmation, revalidateConfirmation } from '../../../src/services/location-intelligence/confirmation-service.js';

describe('ConfirmationService — Section 17', () => {
  it('creates confirmation bound to flow', () => {
    const c = createConfirmation({ flowId: 'flow-1', workspaceId: 'ws-1', contactId: 'contact-1', recommendedOutletId: 'outlet-1' });
    assert(c.confirmationId);
    assert.equal(c.flowId, 'flow-1');
    assert(c.expiresAt);
  });

  it('validates active confirmation', () => {
    const c = createConfirmation({ flowId: 'flow-1', workspaceId: 'ws-1', contactId: 'contact-1', recommendedOutletId: 'outlet-1' });
    assert.ok(isValidConfirmation(c));
  });

  it('expired confirmation invalid', () => {
    const c = createConfirmation({ flowId: 'flow-1', workspaceId: 'ws-1', contactId: 'contact-1', recommendedOutletId: 'outlet-1' }, -1);
    assert.equal(isValidConfirmation(c), false);
  });

  it('revalidates outlet eligibility', async () => {
    const c = createConfirmation({ flowId: 'flow-1', workspaceId: 'ws-1', contactId: 'contact-1', recommendedOutletId: 'outlet-1' });
    const result = await revalidateConfirmation(c, { active: true, pickupEnabled: true, deletedAt: null, locationStatus: 'VERIFIED', latitude: -0.5, longitude: 117 });
    assert.equal(result.valid, true);
  });

  it('deactivated outlet invalidates confirmation', async () => {
    const c = createConfirmation({ flowId: 'flow-1', workspaceId: 'ws-1', contactId: 'contact-1', recommendedOutletId: 'outlet-1' });
    const result = await revalidateConfirmation(c, { active: false });
    assert.equal(result.valid, false);
  });

  it('rejects cross-workspace', async () => {
    const c = createConfirmation({ flowId: 'flow-1', workspaceId: 'ws-1', contactId: 'contact-1', recommendedOutletId: 'outlet-1' });
    const result = await revalidateConfirmation(c, { active: true, pickupEnabled: true, workspaceId: 'ws-2' });
    assert.equal(result.valid, false);
  });
});
