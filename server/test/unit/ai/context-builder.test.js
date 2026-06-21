import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildContext } from '../../../src/ai/context/context-builder.js';
import { buildChat, buildMessage, buildAgent } from '../../helpers/ai/index.js';

describe('buildContext', () => {
  it('returns system messages with platform policy', async () => {
    const chat = buildChat();
    const result = await buildContext({ chat, agent: null, recentMessages: [] });
    assert.ok(result.systemMessages.length >= 1);
    assert.ok(result.systemMessages[0].content.includes('Platform Policy'));
  });

  it('includes greeting flags', async () => {
    const chat = buildChat();
    const result = await buildContext({ chat, agent: null, recentMessages: [] });
    assert.equal(typeof result.greetingFlags.isFirstAssistantMessageInChat, 'boolean');
    assert.equal(typeof result.greetingFlags.assistantMessageCount, 'number');
  });

  it('includes agent instruction when provided', async () => {
    const chat = buildChat();
    const agent = buildAgent({ behavior: 'You are a tea seller.' });
    const result = await buildContext({ chat, agent, recentMessages: [] });
    const hasAgentInstruction = result.systemMessages.some(
      (m) => m.content.includes('Agent Instruction') || m.content.includes('tea seller'),
    );
    assert.equal(hasAgentInstruction, true);
  });

  it('includes human takeover flag when active', async () => {
    const chat = buildChat({ takenOverByUserId: 'user-active' });
    const result = await buildContext({ chat, agent: null, recentMessages: [] });
    const hasTakeover = result.systemMessages.some(
      (m) => m.content.includes('Human Takeover'),
    );
    assert.equal(hasTakeover, true);
  });

  it('maps messages to conversation format', async () => {
    const chat = buildChat();
    const customerMsg = buildMessage({
      chatId: chat.id,
      senderType: 'customer',
      direction: 'inbound',
      content: 'Halo',
    });
    const result = await buildContext({ chat, agent: null, recentMessages: [customerMsg] });
    const hasUserMessage = result.conversationMessages.some(
      (m) => m.role === 'user' && m.content === 'Halo',
    );
    assert.equal(hasUserMessage, true);
  });

  it('first assistant message in chat includes introduction instruction', async () => {
    const chat = buildChat();
    const agent = buildAgent({ name: 'Si Teh', displayName: 'Si Teh' });
    const result = await buildContext({ chat, agent, recentMessages: [] });
    const greetingPolicy = result.systemMessages.find(
      (m) => m.content.includes('Greeting Policy'),
    );
    assert.ok(greetingPolicy, 'greeting policy should exist');
    assert.ok(greetingPolicy.content.includes('Perkenalkan'), 'should tell AI to introduce');
  });

  it('subsequent messages do not ask for introduction', async () => {
    const chat = buildChat();
    const prevAssistant = buildMessage({
      chatId: chat.id,
      senderType: 'assistant',
      direction: 'outbound',
      content: 'Halo! Ada yang bisa saya bantu?',
    });
    const result = await buildContext({ chat, agent: null, recentMessages: [prevAssistant] });
    const greetingPolicy = result.systemMessages.find(
      (m) => m.content.includes('Greeting Policy'),
    );
    assert.ok(greetingPolicy);
    assert.ok(greetingPolicy.content.includes('Lanjutkan'), 'should tell AI to continue');
    assert.ok(greetingPolicy.content.includes('tanpa memperkenalkan'), 'should tell AI to continue without intro');
  });
});
