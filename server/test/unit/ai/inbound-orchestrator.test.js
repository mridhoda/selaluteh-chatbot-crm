import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { prepareInboundTurn } from '../../../src/ai/inbound/inbound-orchestrator.js';

function createMockSessionService() {
  return {
    getOrCreateActiveSession: mock.fn(async () => ({
      session: { id: 'session-test', workspaceId: 'ws-1', chatId: 'chat-test', startedAt: new Date().toISOString() },
      created: false,
    })),
    touchCustomerActivity: mock.fn(async () => {}),
    touchAssistantActivity: mock.fn(async () => {}),
    closeForHandoff: mock.fn(async () => {}),
    closeManual: mock.fn(async () => {}),
  };
}

describe('prepareInboundTurn', () => {
  it('returns allowed=true for valid inputs', async () => {
    const sessionSvc = createMockSessionService();
    const loadRecentMessages = mock.fn(async () => []);
    const buildContext = mock.fn(async () => ({
      greetingFlags: { isFirstAssistantMessageInChat: true, isFirstAssistantMessageInSession: true, assistantMessageCount: 0 },
      systemMessages: [{ role: 'system', content: 'Test' }],
      conversationMessages: [],
    }));
    const result = await prepareInboundTurn({
      platform: { enabled: true },
      chat: { id: 'chat-test', workspaceId: 'ws-1' },
      agent: { id: 'a1', status: 'active' },
      message: { id: 'msg-1', content: 'Halo' },
      humanTakeoverActive: false,
      sessionSvc,
      loadRecentMessages,
      buildContext,
    });
    assert.equal(result.allowed, true);
    assert.ok(result.session);
    assert.ok(result.context);
    assert.equal(typeof result.releaseLock, 'function');
    if (result.releaseLock) result.releaseLock();
  });

  it('returns allowed=false for disabled platform', async () => {
    const result = await prepareInboundTurn({
      platform: { enabled: false },
      chat: { id: 'chat-1', workspaceId: 'ws-1' },
      agent: { id: 'a1', status: 'active' },
      message: { id: 'msg-1' },
      humanTakeoverActive: false,
    });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'platform_disabled');
  });

  it('returns allowed=false for human takeover', async () => {
    const result = await prepareInboundTurn({
      platform: { enabled: true },
      chat: { id: 'chat-1', workspaceId: 'ws-1', takenOverByUserId: 'user-1' },
      agent: { id: 'a1', status: 'active' },
      message: { id: 'msg-1' },
      humanTakeoverActive: true,
    });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'human_takeover_active');
  });
});
