import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { errorHandler } from '../../../src/middleware/error-handler.js';
import { AppError } from '../../../src/utils/errors.js';

describe('errorHandler', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = { requestId: 'req-123' };
    mockRes = {
      statusCode: 0,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(obj) { this.body = obj; },
    };
  });

  it('returns 500 with generic message for unexposed errors', () => {
    const err = new Error('db failure');
    err.status = 500;

    errorHandler(err, mockReq, mockRes, null);

    assert.strictEqual(mockRes.statusCode, 500);
    assert.strictEqual(mockRes.body.error.code, 'INTERNAL_ERROR');
    assert.strictEqual(mockRes.body.error.message, 'Internal server error');
    assert.strictEqual(mockRes.body.meta.request_id, 'req-123');
  });

  it('returns original message for exposed errors (status < 500)', () => {
    const err = new AppError('VALIDATION', 'Invalid field', 400);

    errorHandler(err, mockReq, mockRes, null);

    assert.strictEqual(mockRes.statusCode, 400);
    assert.strictEqual(mockRes.body.error.code, 'VALIDATION');
    assert.strictEqual(mockRes.body.error.message, 'Invalid field');
  });

  it('uses err.code when provided', () => {
    const err = new Error('Not found');
    err.status = 404;
    err.code = 'NOT_FOUND';

    errorHandler(err, mockReq, mockRes, null);

    assert.strictEqual(mockRes.body.error.code, 'NOT_FOUND');
    assert.strictEqual(mockRes.body.error.message, 'Not found');
  });

  it('honors err.httpStatus and redacts details for exposed errors', () => {
    const err = new Error('Provider failed');
    err.httpStatus = 502;
    err.code = 'UPSTREAM_ERROR';
    err.details = { token: 'super-secret-token' };

    errorHandler(err, mockReq, mockRes, null);

    assert.strictEqual(mockRes.statusCode, 502);
    assert.strictEqual(mockRes.body.error.code, 'UPSTREAM_ERROR');
    assert.ok(!mockRes.body.error.details);
  });
});
