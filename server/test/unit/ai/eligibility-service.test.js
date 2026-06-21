import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { checkEligibility } from '../../../src/ai/inbound/eligibility-service.js';
import { acquireRunLock, releaseRunLock, clearStaleLocks } from '../../../src/ai/inbound/run-lock.js';

describe('checkEligibility', () => {
  it('allows eligible message', async () => {
    const result = await checkEligibility({
      platform: { enabled: true },
      chat: { id: 'chat-1' },
      agent: { status: 'active' },
      message: { id: 'msg-1' },
      humanTakeoverActive: false,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.reason, null);
  });

  it('rejects disabled platform', async () => {
    const result = await checkEligibility({
      platform: { enabled: false },
      chat: { id: 'chat-1' },
      agent: { status: 'active' },
      message: { id: 'msg-1' },
      humanTakeoverActive: false,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'platform_disabled');
  });

  it('rejects missing message', async () => {
    const result = await checkEligibility({
      platform: { enabled: true },
      chat: { id: 'chat-1' },
      agent: { status: 'active' },
      message: null,
      humanTakeoverActive: false,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'no_message');
  });

  it('rejects active human takeover', async () => {
    const result = await checkEligibility({
      platform: { enabled: true },
      chat: { id: 'chat-1', takenOverByUserId: 'user-1' },
      agent: { status: 'active' },
      message: { id: 'msg-1' },
      humanTakeoverActive: true,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'human_takeover_active');
  });

  it('rejects no active agent', async () => {
    const result = await checkEligibility({
      platform: { enabled: true },
      chat: { id: 'chat-1' },
      agent: null,
      message: { id: 'msg-1' },
      humanTakeoverActive: false,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'no_active_agent');
  });

  it('rejects inactive agent', async () => {
    const result = await checkEligibility({
      platform: { enabled: true },
      chat: { id: 'chat-1' },
      agent: { status: 'inactive' },
      message: { id: 'msg-1' },
      humanTakeoverActive: false,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'no_active_agent');
  });
});

describe('acquireRunLock', () => {
  after(() => {
    clearStaleLocks();
  });

  it('acquires lock for new chat', () => {
    assert.equal(acquireRunLock('chat-new'), true);
  });

  it('rejects duplicate lock for same chat', () => {
    acquireRunLock('chat-same');
    assert.equal(acquireRunLock('chat-same'), false);
  });

  it('allows lock for different chats', () => {
    assert.equal(acquireRunLock('chat-a'), true);
    assert.equal(acquireRunLock('chat-b'), true);
  });

  it('releases lock', () => {
    acquireRunLock('chat-release');
    releaseRunLock('chat-release');
    assert.equal(acquireRunLock('chat-release'), true);
  });

  it('clearStaleLocks removes old locks', () => {
    acquireRunLock('chat-stale');
    const remaining = clearStaleLocks();
    assert.equal(typeof remaining, 'number');
  });
});
