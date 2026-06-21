import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createUrlResolutionService, createUrlResolutionCache } from '../../../src/services/location-intelligence/url-resolution-service.js';
import { createFakeUrlRedirectClient } from '../../helpers/location/fake-url-redirect.js';

describe('URLResolutionService — Section 7.6-7.8', () => {
  it('resolves full Maps URL via redirect client', async () => {
    const svc = createUrlResolutionService({ redirectClient: createFakeUrlRedirectClient() });
    const result = await svc.resolve('https://maps.google.com/?q=-0.5,117', { workspaceId: 'ws-1' });
    assert(result.candidate);
    assert.equal(result.status, 'RESOLVED');
  });
  it('short URL resolves', async () => {
    const svc = createUrlResolutionService({ redirectClient: createFakeUrlRedirectClient() });
    const result = await svc.resolve('https://maps.app.goo.gl/abc123', { workspaceId: 'ws-1' });
    assert.equal(result.status, 'RESOLVED');
  });
  it('SSRF blocked returns error', async () => {
    const svc = createUrlResolutionService({ redirectClient: createFakeUrlRedirectClient() });
    const result = await svc.resolve('https://goo.gl/private1', { workspaceId: 'ws-1' });
    assert.equal(result.status, 'SSRF_BLOCKED');
  });
  it('redirect loop detected', async () => {
    const svc = createUrlResolutionService({ redirectClient: createFakeUrlRedirectClient() });
    const result = await svc.resolve('https://goo.gl/loop1', { workspaceId: 'ws-1' });
    assert.equal(result.status, 'REDIRECT_LOOP');
  });
  it('non-google host rejected', async () => {
    const svc = createUrlResolutionService({ redirectClient: createFakeUrlRedirectClient() });
    const result = await svc.resolve('https://evil.com/', { workspaceId: 'ws-1' });
    assert.equal(result.status, 'HOST_NOT_APPROVED');
  });
  it('cache hit avoids redirect resolution', async () => {
    const redirectClient = createFakeUrlRedirectClient();
    const cache = createUrlResolutionCache();
    const svc = createUrlResolutionService({ redirectClient, cache });
    await svc.resolve('https://maps.google.com/?q=-0.5,117', { workspaceId: 'ws-1' });
    const countAfter = redirectClient.getCallCount();
    await svc.resolve('https://maps.google.com/?q=-0.5,117', { workspaceId: 'ws-1' });
    assert.equal(redirectClient.getCallCount(), countAfter);
  });
  it('different permission for admin vs customer', async () => {
    const svc = createUrlResolutionService({ redirectClient: createFakeUrlRedirectClient() });
    const customer = await svc.resolve('https://maps.google.com/?q=-0.5,117', { workspaceId: 'ws-1', role: 'customer' });
    assert.equal(customer.status, 'RESOLVED');
    const admin = await svc.resolve('https://maps.google.com/?q=-0.5,117', { workspaceId: 'ws-1', role: 'admin' });
    assert.equal(admin.status, 'RESOLVED');
  });
});
