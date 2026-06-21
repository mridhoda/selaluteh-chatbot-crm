import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeUrlRedirectClient } from '../../helpers/location/fake-url-redirect.js';

describe('Fake URL Redirect Client', () => {
  it('resolves direct URL with zero redirects', async () => {
    const client = createFakeUrlRedirectClient();
    const result = await client.resolve('https://maps.google.com/?q=-0.502106,117.153709');
    assert.equal(result.resolved, true);
    assert.equal(result.redirectCount, 0);
  });

  it('resolves short URL with redirect', async () => {
    const client = createFakeUrlRedirectClient();
    const result = await client.resolve('https://maps.app.goo.gl/abc123');
    assert.equal(result.resolved, true);
    assert.equal(result.redirectCount, 1);
    assert(result.finalUrl.includes('maps.google.com'));
  });

  it('reports redirect loop', async () => {
    const client = createFakeUrlRedirectClient();
    const result = await client.resolve('https://goo.gl/loop1');
    assert.equal(result.resolved, false);
    assert.equal(result.status, 'REDIRECT_LOOP');
  });

  it('reports private IP redirect', async () => {
    const client = createFakeUrlRedirectClient();
    const result = await client.resolve('https://goo.gl/private1');
    assert.equal(result.resolved, false);
    assert.equal(result.status, 'SSRF_BLOCKED');
  });

  it('reports non-google redirect', async () => {
    const client = createFakeUrlRedirectClient();
    const result = await client.resolve('https://goo.gl/evil1');
    assert.equal(result.resolved, false);
    assert.equal(result.status, 'REDIRECT_OUTSIDE_ALLOWLIST');
  });

  it('tracks call count', async () => {
    const client = createFakeUrlRedirectClient();
    assert.equal(client.getCallCount(), 0);
    await client.resolve('https://maps.google.com/');
    assert.equal(client.getCallCount(), 1);
  });

  it('reset clears state', async () => {
    const client = createFakeUrlRedirectClient();
    await client.resolve('https://maps.google.com/');
    client.reset();
    assert.equal(client.getCallCount(), 0);
  });
});
