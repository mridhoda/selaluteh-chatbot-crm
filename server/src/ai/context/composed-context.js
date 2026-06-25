import { computeGreetingFlags } from './greeting-flags.js';
import { estimateTokens, allocateTokenBudget } from './token-estimator.js';
import { loadRecentMessages } from './recent-messages.js';
import { loadLatestSummary } from './source-loaders.js';
import { createMemoryService } from '../memory/memory-service.js';
import { getAgentPromptRules } from '../../services/ai.service.js';

const PLATFORM_POLICY = `## Platform Policy (Immutable)
- You are an AI assistant for SelaluTeh.
- You must be friendly, warm, and helpful.
- You speak Bahasa Indonesia.
- You NEVER mark payment as paid.
- You NEVER claim price, stock, or availability from memory.
- You MUST use backend tools for live commerce data.
- You MUST respect human takeover — if human is active, do not reply.
- You MUST NOT reveal system secrets, API keys, or internal configuration.`;

export async function composeContext({
  chat,
  workspaceId,
  agent,
  currentMessage,
  session,
  summary,
  recentMessages,
  commerceState,
  contactId,
  memories,
  maxInputTokens = 8000,
}) {
  const messages = recentMessages || [];
  const currentMsgIncluded = messages.some((m) => m.id === currentMessage?.id);
  let finalMessages = messages;
  if (currentMessage && !currentMsgIncluded) {
    finalMessages = [...messages, currentMessage];
  }

  const greetingFlags = computeGreetingFlags({
    chat: { ...chat, sessionStartedAt: session?.startedAt },
    messages: finalMessages,
  });

  const sectionContents = [];
  const promptRules = getAgentPromptRules(agent);

  sectionContents.push({
    name: 'platform_policy',
    content: promptRules.platformPolicy || PLATFORM_POLICY,
    tokens: estimateTokens(promptRules.platformPolicy || PLATFORM_POLICY),
  });

  if (agent?.behavior) {
    const text = `## Agent Instruction\n${agent.behavior}`;
    sectionContents.push({ name: 'agent_instruction', content: text, tokens: estimateTokens(text) });
  }

  if (agent?.prompt) {
    const text = `## Additional Context\n${agent.prompt}`;
    sectionContents.push({ name: 'agent_prompt', content: text, tokens: estimateTokens(text) });
  }

  const greetingText = greetingFlags.isFirstAssistantMessageInChat
    ? `Ini adalah percakapan baru. Perkenalkan diri Anda sebagai ${agent?.displayName || agent?.name || 'asisten'} dari SelaluTeh.`
    : greetingFlags.isFirstAssistantMessageInSession
      ? 'Ini adalah sesi baru setelah jeda. Gunakan sapaan singkat tanpa perkenalan.'
      : 'Lanjutkan percakapan tanpa memperkenalkan diri lagi.';
  sectionContents.push({ name: 'greeting_policy', content: greetingText, tokens: estimateTokens(greetingText) });

  if (memories && memories.length > 0) {
    const text = `## Customer Preferences\n${memories.map((m) => `- ${m.memoryKey}: ${JSON.stringify(m.memoryValue)}`).join('\n')}`;
    sectionContents.push({ name: 'confirmed_memory', content: text, tokens: estimateTokens(text) });
  }

  if (chat?.takenOverByUserId || chat?.takeoverBy) {
    sectionContents.push({
      name: 'human_takeover',
      content: '## Human Takeover\nHuman agent sedang aktif. Hentikan respons.',
      tokens: 20,
    });
  }

  if (summary?.summary) {
    const text = `## Ringkasan Percakapan\n${JSON.stringify(summary.summary, null, 2)}`;
    sectionContents.push({ name: 'rolling_summary', content: text, tokens: estimateTokens(text, 'json') });
  }

  if (finalMessages.length > 0) {
    const text = finalMessages.map((m) => {
      const role = m.senderType === 'assistant' || m.senderType === 'ai' ? 'assistant' : 'user';
      return `${role}: ${m.content || ''}`;
    }).join('\n');
    sectionContents.push({ name: 'recent_messages', content: text, tokens: estimateTokens(text) });
  }

  sectionContents.push({
    name: 'current_message',
    content: `Pesan customer: ${currentMessage?.content || ''}`,
    tokens: estimateTokens(currentMessage?.content || ''),
  });

  const allocated = allocateTokenBudget({ sections: sectionContents, maxInputTokens });

  const systemMessages = allocated.sections
    .filter((s) => s.name !== 'recent_messages' && s.name !== 'current_message')
    .map((s) => ({
      role: 'system',
      content: s.truncated ? `${s.content}\n\n[Bagian ini dipotong karena batas token]` : s.content,
    }));

  const conversationMessages = [];
  if (allocated.sections.find((s) => s.name === 'recent_messages')) {
    for (const msg of finalMessages) {
      let role = 'user';
      if (msg.senderType === 'assistant' || msg.senderType === 'ai') role = 'assistant';
      else if (msg.senderType === 'human_agent') role = 'assistant';
      conversationMessages.push({ role, content: msg.content || '' });
    }
  }

  return {
    systemMessages,
    greetingFlags,
    conversationMessages,
    allocated,
  };
}
