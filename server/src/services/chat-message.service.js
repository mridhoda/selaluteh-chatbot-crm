import { chatsRepository, messagesRepository } from '../db/repositories/index.js';

export async function recordInboundMessage({
  chat,
  workspaceId,
  text = '',
  attachment = null,
  platformMessageId = null,
  replyTo = null,
}) {
  const message = await messagesRepository.create({
    chatId: chat.id,
    workspaceId,
    from: 'user',
    text,
    attachment,
    platformMessageId,
    replyTo,
    createdAt: new Date(),
  });

  await chatsRepository.markInboundActivity(chat.id);

  return message;
}

export async function recordOutboundMessage({
  chatId,
  workspaceId,
  from = 'ai',
  text,
  attachment = null,
  messageType = null,
  platformMessageId = null,
}) {
  const resolvedMessageType = messageType || (attachment
    ? (/\.(png|jpe?g|gif|webp)$/i.test(attachment.filename || attachment.url || '') ? 'image' : 'file')
    : 'text');

  return messagesRepository.create({
    chatId,
    workspaceId,
    from,
    text,
    attachment,
    messageType: resolvedMessageType,
    platformMessageId,
    createdAt: new Date(),
  });
}
