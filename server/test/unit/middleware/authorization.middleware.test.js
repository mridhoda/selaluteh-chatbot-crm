import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authorizePermission } from '../../../src/middleware/authorization.js';

describe('authorization middleware', () => {
  it('allows a role with permission', async () => {
    const middleware = authorizePermission('payments', 'read');
    const req = { me: { role: 'owner' }, workspace: { role: 'owner' } };
    let called = false;
    await middleware(req, {}, (err) => {
      assert.equal(err, undefined);
      called = true;
    });
    assert.equal(called, true);
  });

  it('blocks a role without permission', async () => {
    const middleware = authorizePermission('settings', 'write');
    const req = { me: { role: 'agent' }, workspace: { role: 'human_agent' } };
    let captured = null;
    await middleware(req, {}, (err) => {
      captured = err;
    });
    assert.equal(captured.code, 'FORBIDDEN');
    assert.equal(captured.status, 403);
  });
});
