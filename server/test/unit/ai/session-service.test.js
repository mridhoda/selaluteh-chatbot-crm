import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionService } from '../../../src/ai/memory/session-service.js';
import { FixedClock } from '../../helpers/ai/index.js';

function createMockRepo(sessions = []) {
  let store = [...sessions];
  return {
    findActiveByChat: mock.fn(async ({ workspaceId, chatId }) => {
      return store.find((s) => s.chatId === chatId && s.status === 'active') || null;
    }),
    create: mock.fn(async ({ workspaceId, chatId, agentId, now }) => {
      const s = { id: `session-${chatId}`, workspaceId, chatId, agentId, status: 'active', startedAt: now, lastCustomerMessageAt: now, lastAssistantMessageAt: null, closedAt: null, closeReason: null };
      store.push(s);
      return s;
    }),
    close: mock.fn(async ({ id, reason }) => {
      const s = store.find((x) => x.id === id);
      if (s) { s.status = 'closed_idle'; s.closedAt = new Date().toISOString(); s.closeReason = reason; }
      return s;
    }),
    touchCustomerActivity: mock.fn(async ({ id }) => {
      const s = store.find((x) => x.id === id);
      if (s) s.lastCustomerMessageAt = new Date().toISOString();
      return s;
    }),
    touchAssistantActivity: mock.fn(async ({ id }) => {
      const s = store.find((x) => x.id === id);
      if (s) s.lastAssistantMessageAt = new Date().toISOString();
      return s;
    }),
    closeIdleSessions: mock.fn(async ({ workspaceId }) => []),
  };
}

describe('SessionService — boundary policy', () => {
  it('reuses existing active session before inactivity threshold', async () => {
    const clock = new FixedClock('2026-06-19T08:00:00Z');
    const existing = { id: 's1', workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1', status: 'active', startedAt: '2026-06-19T07:00:00Z', lastCustomerMessageAt: '2026-06-19T07:30:00Z' };
    const repo = createMockRepo([existing]);
    const svc = createSessionService({ repository: repo, inactivityHours: 24, clock });

    const { session, created } = await svc.getOrCreateActiveSession({ workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1' });

    assert.equal(created, false);
    assert.equal(session.id, 's1');
    assert.equal(repo.close.mock.calls.length, 0);
  });

  it('creates new session after 24h inactivity', async () => {
    const clock = new FixedClock('2026-06-20T09:00:00Z');
    const stale = { id: 's1', workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1', status: 'active', startedAt: '2026-06-19T07:00:00Z', lastCustomerMessageAt: '2026-06-19T07:30:00Z' };
    const repo = createMockRepo([stale]);
    const svc = createSessionService({ repository: repo, inactivityHours: 24, clock });

    const { session, created } = await svc.getOrCreateActiveSession({ workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1' });

    assert.equal(created, true);
    assert.equal(repo.close.mock.calls.length, 1);
    assert.equal(repo.create.mock.calls.length, 1);
  });

  it('chat remains the same across sessions', async () => {
    const clock = new FixedClock('2026-06-20T09:00:00Z');
    const stale = { id: 's1', workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1', status: 'active', startedAt: '2026-06-19T07:00:00Z', lastCustomerMessageAt: '2026-06-19T07:30:00Z' };
    const repo = createMockRepo([stale]);
    const svc = createSessionService({ repository: repo, inactivityHours: 24, clock });

    const { session } = await svc.getOrCreateActiveSession({ workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1' });

    assert.equal(session.chatId, 'chat-1');
  });

  it('handles configurable threshold', async () => {
    const clock = new FixedClock('2026-06-19T10:00:00Z');
    const existing = { id: 's1', workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1', status: 'active', startedAt: '2026-06-19T07:00:00Z', lastCustomerMessageAt: '2026-06-19T08:30:00Z' };
    const repo = createMockRepo([existing]);
    // 2 hour threshold — 1.5h since last message, so active
    const svc = createSessionService({ repository: repo, inactivityHours: 2, clock });

    const { created } = await svc.getOrCreateActiveSession({ workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1' });
    assert.equal(created, false);

    // With 1 hour threshold — 1.5h > 1h, should create new
    clock.advanceMinutes(30);
    const svc2 = createSessionService({ repository: repo, inactivityHours: 1, clock });
    const { created: created2 } = await svc2.getOrCreateActiveSession({ workspaceId: 'ws-1', chatId: 'chat-1', agentId: 'a1' });
    assert.equal(created2, true);
  });

  it('touchCustomerActivity updates timestamp', async () => {
    const repo = createMockRepo([{ id: 's1', workspaceId: 'ws-1', chatId: 'chat-1', status: 'active' }]);
    const svc = createSessionService({ repository: repo });
    await svc.touchCustomerActivity({ sessionId: 's1' });
    assert.equal(repo.touchCustomerActivity.mock.calls.length, 1);
  });

  it('touchAssistantActivity updates timestamp', async () => {
    const repo = createMockRepo([{ id: 's1', workspaceId: 'ws-1', chatId: 'chat-1', status: 'active' }]);
    const svc = createSessionService({ repository: repo });
    await svc.touchAssistantActivity({ sessionId: 's1' });
    assert.equal(repo.touchAssistantActivity.mock.calls.length, 1);
  });

  it('closeForHandoff closes with handoff reason', async () => {
    const repo = createMockRepo([{ id: 's1', workspaceId: 'ws-1', status: 'active' }]);
    const svc = createSessionService({ repository: repo });
    await svc.closeForHandoff({ sessionId: 's1' });
    assert.equal(repo.close.mock.calls.length, 1);
  });
});
