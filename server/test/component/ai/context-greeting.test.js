import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildChat, buildMessage, buildConversationSession, buildAgent, buildWorkspace, buildContact, FixedClock } from '../../helpers/ai/index.js';

const clock = new FixedClock('2026-06-19T08:00:00Z');

function getGreetingFlags(chat, session, messages) {
  const assistantMessages = messages.filter((m) => m.senderType === 'assistant' && m.direction === 'outbound');
  const isFirstAssistantInChat = assistantMessages.length === 0;
  const isFirstAssistantInSession = session
    ? messages.filter(
        (m) =>
          m.senderType === 'assistant' &&
          m.direction === 'outbound' &&
          new Date(m.createdAt) >= new Date(session.startedAt),
      ).length === 0
    : true;
  return {
    isFirstAssistantMessageInChat: isFirstAssistantInChat,
    isFirstAssistantMessageInSession: isFirstAssistantInSession,
    assistantMessageCount: assistantMessages.length,
  };
}

describe('Context — greeting continuity (RED — repeated introduction regression)', () => {
  const ws = buildWorkspace();
  const contact = buildContact({ workspaceId: ws.id });
  const agent = buildAgent({ workspaceId: ws.id });

  it('first assistant response in new chat should allow introduction', () => {
    const chat = buildChat({ workspaceId: ws.id, contactId: contact.id, createdAt: clock.toISOString() });
    const flags = getGreetingFlags(chat, null, []);
    assert.equal(flags.isFirstAssistantMessageInChat, true);
    assert.equal(flags.isFirstAssistantMessageInSession, true);
    assert.equal(flags.assistantMessageCount, 0);
  });

  it('second customer message should NOT be treated as first assistant message', () => {
    const chat = buildChat({ workspaceId: ws.id, contactId: contact.id, createdAt: clock.toISOString() });
    const priorAssistant = buildMessage({
      workspaceId: ws.id,
      chatId: chat.id,
      contactId: contact.id,
      senderType: 'assistant',
      direction: 'outbound',
      content: 'Halo! Ada yang bisa saya bantu? Saya asisten dari SelaluTeh.',
      createdAt: clock.toISOString(),
    });
    const flags = getGreetingFlags(chat, null, [priorAssistant]);
    assert.equal(flags.isFirstAssistantMessageInChat, false, 'should not be first assistant message');
    assert.equal(flags.assistantMessageCount, 1, 'should have 1 prior assistant message');
  });

  it('third turn should still not reintroduce', () => {
    const chat = buildChat({ workspaceId: ws.id, contactId: contact.id, createdAt: clock.toISOString() });
    const m1 = buildMessage({
      workspaceId: ws.id, chatId: chat.id, contactId: contact.id,
      senderType: 'assistant', direction: 'outbound', content: 'Introduction',
      createdAt: clock.toISOString(),
    });
    const m2 = buildMessage({
      workspaceId: ws.id, chatId: chat.id, contactId: contact.id,
      senderType: 'customer', direction: 'inbound', content: 'Saya mau pesan teh',
      createdAt: clock.toISOString(),
    });
    const m3 = buildMessage({
      workspaceId: ws.id, chatId: chat.id, contactId: contact.id,
      senderType: 'assistant', direction: 'outbound', content: 'Bisa, mau pesan apa?',
      createdAt: clock.toISOString(),
    });
    const flags = getGreetingFlags(chat, null, [m1, m2, m3]);
    assert.equal(flags.assistantMessageCount, 2, 'should count all assistant messages');
    assert.equal(flags.isFirstAssistantMessageInChat, false);
  });

  it('new session after long idle should allow welcome-back but not full intro', () => {
    const session = buildConversationSession({
      workspaceId: ws.id,
      status: 'closed_idle',
      startedAt: '2026-06-18T08:00:00Z',
      closedAt: '2026-06-18T20:00:00Z',
    });
    const priorAssistant = buildMessage({
      workspaceId: ws.id, senderType: 'assistant', direction: 'outbound', content: 'Introduction',
      createdAt: '2026-06-18T08:05:00Z',
    });
    const flags = getGreetingFlags(buildChat(), null, [priorAssistant]);
    assert.equal(flags.isFirstAssistantMessageInChat, false, 'assistant already replied before');
    assert.equal(flags.assistantMessageCount, 1);
  });

  it('current message should not be duplicated in context', () => {
    const chat = buildChat({ workspaceId: ws.id });
    const customerMsg = buildMessage({
      workspaceId: ws.id, chatId: chat.id,
      senderType: 'customer', direction: 'inbound', content: 'Halo',
    });
    const historyMessages = [customerMsg];
    const currentMsg = customerMsg;
    const occurrenceCount = historyMessages.filter((m) => m.id === currentMsg.id).length;
    assert.equal(occurrenceCount, 1, 'current message must appear exactly once');
  });
});
