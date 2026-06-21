import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import metaTestRouter from '../../../src/routes/webhooks/metaTest.js';

describe('metaTest webhook route', () => {
  it('GET / responds with challenge when verification token matches', async () => {
    let responseStatus = null;
    let responseBody = null;
    
    // Mock req and res
    const req = {
      method: 'GET',
      query: {
        'hub.mode': 'subscribe',
        'hub.challenge': 'my_test_challenge_123',
        'hub.verify_token': process.env.META_VERIFY_TOKEN || 'selaluteh_sandbox_verify_token'
      }
    };
    
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      send(body) {
        responseBody = body;
        return this;
      },
      sendStatus(code) {
        responseStatus = code;
        return this;
      }
    };
    
    // Find the GET handler inside the router stack
    const getLayer = metaTestRouter.stack.find(layer => layer.route && layer.route.methods.get);
    assert.ok(getLayer, 'GET handler should be registered');
    
    const handler = getLayer.route.stack[0].handle;
    await handler(req, res);
    
    assert.equal(responseStatus, 200);
    assert.equal(responseBody, 'my_test_challenge_123');
  });

  it('GET / responds with 403 when verification token is invalid', async () => {
    let responseStatus = null;
    
    const req = {
      method: 'GET',
      query: {
        'hub.mode': 'subscribe',
        'hub.challenge': 'my_test_challenge_123',
        'hub.verify_token': 'wrong_token'
      }
    };
    
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      send(body) {
        return this;
      },
      sendStatus(code) {
        responseStatus = code;
        return this;
      }
    };
    
    const getLayer = metaTestRouter.stack.find(layer => layer.route && layer.route.methods.get);
    const handler = getLayer.route.stack[0].handle;
    await handler(req, res);
    
    assert.equal(responseStatus, 403);
  });
});
