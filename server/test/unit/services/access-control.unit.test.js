import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isWorkspaceWideRole } from '../../../src/services/access-control.service.js';

describe('access-control service', () => {
  it('isWorkspaceWideRole returns true for owner and admin', () => {
    assert.strictEqual(isWorkspaceWideRole('owner'), true);
    assert.strictEqual(isWorkspaceWideRole('admin'), true);
  });

  it('isWorkspaceWideRole returns false for outlet_manager and viewer', () => {
    assert.strictEqual(isWorkspaceWideRole('outlet_manager'), false);
    assert.strictEqual(isWorkspaceWideRole('viewer'), false);
  });
});
