import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AppError } from '../../../src/utils/errors.js';

describe('AppError', () => {
  it('creates error with code, message, status', () => {
    const err = new AppError('TEST_ERROR', 'Test message', 400);
    assert.strictEqual(err.name, 'AppError');
    assert.strictEqual(err.code, 'TEST_ERROR');
    assert.strictEqual(err.message, 'Test message');
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.expose, true);
  });

  it('sets expose false for 500+ status', () => {
    const err = new AppError('SERVER_ERROR', 'Internal', 500);
    assert.strictEqual(err.expose, false);
  });

  it('accepts details and cause', () => {
    const cause = new Error('root cause');
    const err = new AppError('WITH_CAUSE', 'wrapped', 400, { field: 'x' }, cause);
    assert.deepStrictEqual(err.details, { field: 'x' });
    assert.strictEqual(err.cause, cause);
  });
});
