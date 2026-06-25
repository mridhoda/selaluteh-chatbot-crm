import { computeGreetingFlags } from './greeting-flags.js';
import { loadRecentMessages } from './recent-messages.js';
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

export async function buildContext({
  chat,
  workspaceId,
  agent,
  currentMessage,
  recentMessages,
}) {
  const messages = recentMessages || [];
  const allLoadedMessages = messages;
  const currentMsgIncluded = allLoadedMessages.some(
    (m) => m.id === currentMessage?.id,
  );

  let finalMessages = allLoadedMessages;
  if (currentMessage && !currentMsgIncluded) {
    finalMessages = [...allLoadedMessages, currentMessage];
  }

  const greetingFlags = computeGreetingFlags({
    chat,
    messages: finalMessages,
  });

  const systemMessages = [];
  const promptRules = getAgentPromptRules(agent);

  systemMessages.push({
    role: 'system',
    content: promptRules.platformPolicy || PLATFORM_POLICY,
  });

  if (agent?.behavior) {
    systemMessages.push({
      role: 'system',
      content: `## Agent Instruction\n${agent.behavior}`,
    });
  }

  if (agent?.prompt) {
    systemMessages.push({
      role: 'system',
      content: `## Additional Context\n${agent.prompt}`,
    });
  }

  const greetingInfo = [];
  if (greetingFlags.isFirstAssistantMessageInChat) {
    greetingInfo.push(
      `Ini adalah percakapan baru. Perkenalkan diri Anda sebagai ${agent?.displayName || agent?.name || 'asisten'} dari SelaluTeh.`,
    );
  } else if (greetingFlags.isFirstAssistantMessageInSession) {
    greetingInfo.push(
      'Ini adalah sesi baru setelah jeda. Gunakan sapaan singkat "Selamat datang kembali" tanpa perkenalan lengkap.',
    );
  } else {
    greetingInfo.push(
      'Lanjutkan percakapan tanpa memperkenalkan diri lagi.',
    );
  }

  if (greetingInfo.length > 0) {
    systemMessages.push({
      role: 'system',
      content: `## Greeting Policy\n${greetingInfo.join(' ')}`,
    });
  }

  if (chat?.takenOverByUserId || chat?.takeoverBy) {
    systemMessages.push({
      role: 'system',
      content: '## Human Takeover\nHuman agent sedang aktif. Hentikan respons.',
    });
  }

  const conversationMessages = [];

  for (const msg of finalMessages) {
    let role = 'user';
    if (msg.senderType === 'assistant' || msg.senderType === 'ai') {
      role = 'assistant';
    } else if (msg.senderType === 'human_agent') {
      role = 'assistant';
    }

    conversationMessages.push({
      role,
      content: msg.content || '',
    });
  }

  return {
    systemMessages,
    greetingFlags,
    conversationMessages,
  };
}
