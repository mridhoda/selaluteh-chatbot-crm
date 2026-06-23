import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { complaintsSupabaseRepository } from '../../../src/db/repositories/index.js';

describe('complaint scope', () => {
  it('exports expected methods', () => {
    assert.ok(typeof complaintsSupabaseRepository.list === 'function');
    assert.ok(typeof complaintsSupabaseRepository.findById === 'function');
    assert.ok(typeof complaintsSupabaseRepository.create === 'function');
    assert.ok(typeof complaintsSupabaseRepository.update === 'function');
    assert.ok(typeof complaintsSupabaseRepository.deleteById === 'function');
    assert.ok(typeof complaintsSupabaseRepository.addEvent === 'function');
    assert.ok(typeof complaintsSupabaseRepository.getEvents === 'function');
  });

  it('list requires workspaceId', async () => {
    await assert.rejects(
      () => complaintsSupabaseRepository.list({}),
      (err) => {
        assert.match(err.message || err.code || '', /workspace/i);
        return true;
      }
    );
  });
});
