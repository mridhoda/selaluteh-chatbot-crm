import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeGreetingFlags } from '../../../src/ai/context/greeting-flags.js';
import { buildMessage, buildChat } from '../../helpers/ai/index.js';

describe('computeGreetingFlags', () => {
  it('returns first-message flags when no chat', () => {
    const flags = computeGreetingFlags({ chat: null, messages: [] });
    assert.equal(flags.isFirstAssistantMessageInChat, true);
    assert.equal(flags.isFirstAssistantMessageInSession, true);
    assert.equal(flags.assistantMessageCount, 0);
  });

  it('first assistant response in new chat', () => {
    const chat = buildChat();
    const flags = computeGreetingFlags({ chat, messages: [] });
    assert.equal(flags.isFirstAssistantMessageInChat, true);
    assert.equal(flags.assistantMessageCount, 0);
  });

  it('second turn does not flag as first assistant message', () => {
    const chat = buildChat();
    const priorAssistant = buildMessage({
      chatId: chat.id,
      senderType: 'assistant',
      direction: 'outbound',
      content: 'Halo! Ada yang bisa saya bantu?',
    });
    const flags = computeGreetingFlags({ chat, messages: [priorAssistant] });
    assert.equal(flags.isFirstAssistantMessageInChat, false);
    assert.equal(flags.assistantMessageCount, 1);
  });

  it('third turn keeps accurate count', () => {
    const chat = buildChat();
    const m1 = buildMessage({ chatId: chat.id, senderType: 'assistant', direction: 'outbound' });
    const m2 = buildMessage({ chatId: chat.id, senderType: 'customer', direction: 'inbound' });
    const m3 = buildMessage({ chatId: chat.id, senderType: 'assistant', direction: 'outbound' });
    const flags = computeGreetingFlags({ chat, messages: [m1, m2, m3] });
    assert.equal(flags.isFirstAssistantMessageInChat, false);
    assert.equal(flags.assistantMessageCount, 2);
  });

  it('human agent messages are not counted as assistant', () => {
    const chat = buildChat();
    const msg = buildMessage({ chatId: chat.id, senderType: 'human_agent', direction: 'outbound' });
    const flags = computeGreetingFlags({ chat, messages: [msg] });
    assert.equal(flags.assistantMessageCount, 0);
  });
});
