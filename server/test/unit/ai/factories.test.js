import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkspace,
  buildContact,
  buildChat,
  buildMessage,
  buildConversationSession,
  buildAgent,
  buildMemory,
  buildAiRun,
  buildToolCall,
  buildHumanTakeoverState,
  createFakeProvider,
  createScriptedFakeProvider,
  createFakeToolExecutor,
  createFakeTelegramAdapter,
  createFakeWhatsAppAdapter,
  FixedClock,
} from '../../helpers/ai/index.js';

describe('AI Factory — isolation tests', () => {
  it('buildWorkspace produces valid shape', () => {
    const ws = buildWorkspace();
    assert.ok(ws.id);
    assert.equal(ws.status, 'active');
    assert.equal(ws.name, 'Test Workspace');
  });

  it('buildWorkspace merges overrides', () => {
    const ws = buildWorkspace({ name: 'Custom Workspace', status: 'inactive' });
    assert.equal(ws.name, 'Custom Workspace');
    assert.equal(ws.status, 'inactive');
  });

  it('buildContact produces valid shape', () => {
    const c = buildContact();
    assert.ok(c.id);
    assert.ok(c.externalUserId);
    assert.equal(c.language, 'id');
  });

  it('buildChat produces valid shape', () => {
    const chat = buildChat();
    assert.ok(chat.id);
    assert.equal(chat.status, 'active');
  });

  it('buildMessage produces valid shape with defaults', () => {
    const msg = buildMessage();
    assert.ok(msg.id);
    assert.equal(msg.senderType, 'customer');
    assert.equal(msg.direction, 'inbound');
    assert.equal(msg.messageType, 'text');
  });

  it('buildConversationSession produces valid shape', () => {
    const session = buildConversationSession();
    assert.ok(session.id);
    assert.equal(session.status, 'active');
    assert.equal(session.closeReason, null);
  });

  it('buildAgent produces valid shape', () => {
    const agent = buildAgent();
    assert.ok(agent.id);
    assert.equal(agent.status, 'active');
    assert.equal(agent.name, 'Test Agent');
  });

  it('buildMemory produces valid shape', () => {
    const mem = buildMemory();
    assert.ok(mem.id);
    assert.equal(mem.category, 'product_preference');
    assert.equal(mem.status, 'active');
  });

  it('buildAiRun produces valid shape', () => {
    const run = buildAiRun();
    assert.ok(run.id);
    assert.equal(run.status, 'completed');
    assert.equal(run.modelProvider, 'test-provider');
  });

  it('buildToolCall produces valid shape', () => {
    const tc = buildToolCall();
    assert.ok(tc.id);
    assert.equal(tc.toolName, 'test_tool');
    assert.equal(tc.status, 'completed');
  });

  it('buildHumanTakeoverState defaults to AI active', () => {
    const state = buildHumanTakeoverState();
    assert.equal(state.mode, 'ai_active');
    assert.equal(state.pinned, false);
    assert.equal(state.takenOverByUserId, null);
  });
});

describe('AI Fake — provider tests', () => {
  it('createFakeProvider default responds to chat', async () => {
    const provider = createFakeProvider('default');
    const res = await provider.chat({ messages: [] });
    assert.ok(res.content);
    assert.equal(res.role, 'assistant');
    assert.equal(provider.getCallCount(), 1);
  });

  it('createFakeProvider tool_call returns tool call', async () => {
    const provider = createFakeProvider('tool_call');
    const res = await provider.structured({ messages: [] });
    assert.equal(res.responseType, 'tool_call');
    assert.equal(res.toolCalls.length, 1);
    assert.equal(res.toolCalls[0].name, 'search_products');
  });

  it('createFakeProvider handoff returns handoff', async () => {
    const provider = createFakeProvider('handoff');
    const res = await provider.structured({ messages: [] });
    assert.equal(res.responseType, 'handoff');
    assert.equal(res.needsHuman, true);
  });

  it('createFakeProvider error throws', async () => {
    const provider = createFakeProvider('error');
    await assert.rejects(async () => {
      await provider.chat({ messages: [] });
    }, /Simulated provider error/);
  });

  it('createScriptedFakeProvider follows script order', async () => {
    const provider = createScriptedFakeProvider([
      { role: 'assistant', content: 'First' },
      { role: 'assistant', content: 'Second' },
    ]);
    const r1 = await provider.chat({ messages: [] });
    assert.equal(r1.content, 'First');
    const r2 = await provider.chat({ messages: [] });
    assert.equal(r2.content, 'Second');
  });

  it('createFakeProvider reset clears state', async () => {
    const provider = createFakeProvider('default');
    await provider.chat({ messages: [] });
    assert.equal(provider.getCallCount(), 1);
    provider.reset();
    assert.equal(provider.getCallCount(), 0);
    assert.equal(provider.getCalls().length, 0);
  });
});

describe('AI Fake — tool executor tests', () => {
  it('createFakeToolExecutor search_products returns list', async () => {
    const exec = createFakeToolExecutor();
    const result = await exec.execute('search_products', { query: 'teh' });
    assert.equal(result.success, true);
    assert.equal(result.data.length, 2);
  });

  it('createFakeToolExecutor unknown tool returns error', async () => {
    const exec = createFakeToolExecutor();
    const result = await exec.execute('unknown_tool', {});
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Unknown tool'));
  });

  it('createFakeToolExecutor tracks executed calls', async () => {
    const exec = createFakeToolExecutor();
    await exec.execute('search_products', { query: 'teh' });
    await exec.execute('select_outlet', { outletId: 'outlet-1' });
    const calls = exec.getExecutedCalls();
    assert.equal(calls.length, 2);
    assert.equal(calls[0].toolName, 'search_products');
    assert.equal(calls[1].toolName, 'select_outlet');
  });

  it('createFakeToolExecutor reset clears history', async () => {
    const exec = createFakeToolExecutor();
    await exec.execute('search_products', { query: 'teh' });
    assert.equal(exec.getExecutedCalls().length, 1);
    exec.reset();
    assert.equal(exec.getExecutedCalls().length, 0);
  });

  it('createFakeToolExecutor supports custom handlers', async () => {
    const exec = createFakeToolExecutor({
      custom_tool: async (args) => ({ success: true, data: { custom: args } }),
    });
    const result = await exec.execute('custom_tool', { foo: 'bar' });
    assert.equal(result.success, true);
    assert.equal(result.data.custom.foo, 'bar');
  });
});

describe('AI Fake — channel adapter tests', () => {
  it('createFakeTelegramAdapter parses inbound event', async () => {
    const adapter = createFakeTelegramAdapter();
    const events = await adapter.parseInbound({
      workspaceId: 'ws-1',
      platformId: 'plat-1',
      message: {
        message_id: 100,
        chat: { id: 12345 },
        from: { id: 67890 },
        text: 'Halo',
      },
    });
    assert.equal(events.length, 1);
    assert.equal(events[0].provider, 'telegram');
    assert.equal(events[0].text, 'Halo');
    assert.ok(events[0].correlationId);
  });

  it('createFakeTelegramAdapter sendText records message', async () => {
    const adapter = createFakeTelegramAdapter();
    await adapter.sendText({ conversationId: '123', text: 'Halo juga' });
    const msgs = adapter.getSentMessages();
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].text, 'Halo juga');
  });

  it('createFakeWhatsAppAdapter parses standard event', async () => {
    const adapter = createFakeWhatsAppAdapter();
    const events = await adapter.parseInbound({
      entry: [{
        changes: [{
          value: {
            messages: [{
              id: 'wa-msg-1',
              from: '628123456789',
              text: { body: 'Test WA' },
            }],
          },
        }],
      }],
    });
    assert.equal(events.length, 1);
    assert.equal(events[0].provider, 'whatsapp');
    assert.equal(events[0].text, 'Test WA');
  });
});

describe('FixedClock tests', () => {
  it('returns initial time', () => {
    const clock = new FixedClock('2026-06-19T00:00:00Z');
    assert.equal(clock.toISOString(), '2026-06-19T00:00:00.000Z');
  });

  it('advance increases time', () => {
    const clock = new FixedClock('2026-06-19T00:00:00Z');
    clock.advance(60000);
    assert.equal(clock.toISOString(), '2026-06-19T00:01:00.000Z');
  });

  it('advanceMinutes works', () => {
    const clock = new FixedClock('2026-06-19T00:00:00Z');
    clock.advanceMinutes(30);
    assert.equal(clock.toISOString(), '2026-06-19T00:30:00.000Z');
  });

  it('advanceDays works', () => {
    const clock = new FixedClock('2026-06-19T00:00:00Z');
    clock.advanceDays(1);
    assert.equal(clock.toISOString(), '2026-06-20T00:00:00.000Z');
  });
});
