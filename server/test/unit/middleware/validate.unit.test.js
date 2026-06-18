import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { validateBody, validateParams, validateQuery } from '../../../src/middleware/validate.js';

describe('validate middleware', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      statusCode: 0,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(obj) { this.body = obj; },
    };
  });

  it('validateBody passes valid data and calls next', () => {
    const schema = (body) => {
      if (!body.name) return { error: 'name is required' };
      return { value: body };
    };
    let nextCalled = false;
    mockReq.body = { name: 'test' };
    validateBody(schema)(mockReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.deepStrictEqual(mockReq.body, { name: 'test' });
  });

  it('validateBody returns 400 on validation failure', () => {
    const schema = (body) => ({ error: 'name is required' });
    mockReq.body = {};
    validateBody(schema)(mockReq, mockRes, () => {});
    assert.strictEqual(mockRes.statusCode, 400);
    assert.strictEqual(mockRes.body.error.code, 'VALIDATION_ERROR');
  });

  it('validateParams validates req.params', () => {
    const schema = (params) => {
      if (!params.id) return { error: 'id required' };
      return { value: params };
    };
    let nextCalled = false;
    mockReq.params = { id: 'abc' };
    validateParams(schema)(mockReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  it('validateQuery validates req.query', () => {
    const schema = (query) => {
      if (query.limit && parseInt(query.limit) > 100) return { error: 'limit too high' };
      return { value: query };
    };
    let nextCalled = false;
    mockReq.query = { limit: '50' };
    validateQuery(schema)(mockReq, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);

    mockReq.query = { limit: '200' };
    validateQuery(schema)(mockReq, mockRes, () => {});
    assert.strictEqual(mockRes.statusCode, 400);
  });
});
