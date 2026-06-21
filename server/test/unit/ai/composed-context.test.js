import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { composeContext } from '../../../src/ai/context/composed-context.js';
import { buildChat, buildMessage, buildAgent } from '../../helpers/ai/index.js';

describe('composeContext', () => {
  it('includes platform policy and greeting for new chat', async () => {
    const chat = buildChat();
    const result = await composeContext({ chat, agent: null, recentMessages: [], currentMessage: null });
    assert.ok(result.systemMessages.some((m) => m.content.includes('Platform Policy')));
    assert.ok(result.greetingFlags.isFirstAssistantMessageInChat);
  });

  it('includes agent instruction when provided', async () => {
    const chat = buildChat();
    const agent = buildAgent({ behavior: 'You are a tea seller.' });
    const result = await composeContext({ chat, agent, recentMessages: [], currentMessage: null });
    assert.ok(result.systemMessages.some((m) => m.content.includes('tea seller')));
  });

  it('includes human takeover flag when active', async () => {
    const chat = buildChat({ takenOverByUserId: 'user-1' });
    const result = await composeContext({ chat, agent: null, recentMessages: [], currentMessage: null });
    const takeoverMsg = result.systemMessages.find((m) => m.content.includes('Human Takeover') || m.content.includes('Hentikan'));
    assert.ok(takeoverMsg, 'should have takeover message');
  });

  it('greeting policy shows welcome for new chat', async () => {
    const chat = buildChat();
    const agent = buildAgent({ name: 'Si Teh', displayName: 'Si Teh' });
    const result = await composeContext({ chat, agent, recentMessages: [], currentMessage: null });
    const hasIntro = result.systemMessages.some((m) => m.content.includes('Perkenalkan'));
    assert.ok(hasIntro, 'should have introduction in system messages');
    assert.ok(result.greetingFlags.isFirstAssistantMessageInChat);
  });

  it('greeting shows continue for existing conversation', async () => {
    const chat = buildChat();
    const prev = buildMessage({ chatId: chat.id, senderType: 'assistant', direction: 'outbound', content: 'Halo' });
    const result = await composeContext({ chat, agent: null, recentMessages: [prev], currentMessage: null });
    const gp = result.systemMessages.find((m) => m.content.includes('tanpa memperkenalkan'));
    assert.ok(gp, 'should have greeting without re-introduction');
  });

  it('third turn keeps accurate count', async () => {
    const chat = buildChat();
    const m1 = buildMessage({ chatId: chat.id, senderType: 'assistant', direction: 'outbound' });
    const m2 = buildMessage({ chatId: chat.id, senderType: 'customer', direction: 'inbound' });
    const m3 = buildMessage({ chatId: chat.id, senderType: 'assistant', direction: 'outbound' });
    const result = await composeContext({ chat, agent: null, recentMessages: [m1, m2, m3], currentMessage: null });
    assert.equal(result.greetingFlags.assistantMessageCount, 2);
  });

  it('includes customer memories when provided', async () => {
    const chat = buildChat();
    const memories = [
      { memoryKey: 'sweetness_preference', memoryValue: { preference: 'less_sweet' } },
    ];
    const result = await composeContext({ chat, agent: null, recentMessages: [], currentMessage: null, memories });
    const memorySection = result.systemMessages.find((m) => m.content.includes('Customer Preferences'));
    assert.ok(memorySection, 'should include memory section');
    assert.ok(memorySection.content.includes('sweetness_preference'));
  });
});
