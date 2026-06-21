export function computeGreetingFlags({
  chat,
  messages = [],
}) {
  if (!chat) {
    return {
      isFirstAssistantMessageInChat: true,
      isFirstAssistantMessageInSession: true,
      assistantMessageCount: 0,
    };
  }

  const assistantMessages = messages.filter(
    (m) => (m.senderType === 'assistant' || m.senderType === 'ai') && m.direction === 'outbound',
  );

  const totalAssistantCount = assistantMessages.length;
  const isFirstAssistantMessageInChat = totalAssistantCount === 0;

  const sessionStartedAt = chat.sessionStartedAt
    ? new Date(chat.sessionStartedAt).getTime()
    : null;

  let sessionAssistantCount = 0;
  if (sessionStartedAt !== null) {
    sessionAssistantCount = assistantMessages.filter(
      (m) => new Date(m.createdAt).getTime() >= sessionStartedAt,
    ).length;
  }

  const isFirstAssistantMessageInSession =
    sessionStartedAt !== null ? sessionAssistantCount === 0 : totalAssistantCount === 0;

  return {
    isFirstAssistantMessageInChat,
    isFirstAssistantMessageInSession,
    assistantMessageCount: totalAssistantCount,
  };
}
