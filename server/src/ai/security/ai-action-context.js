import { resolveAgentMode } from './agent-mode.js';

export function buildAIActionContext({
  workspaceId,
  channelConnectionId = null,
  conversationId = null,
  contactId = null,
  inboundMessageId = null,
  agent = null,
  chat = null,
  cart = null,
  checkout = null,
  channel = null,
} = {}) {
  const context = {
    workspaceId,
    channelConnectionId,
    conversationId,
    contactId,
    inboundMessageId,
    agentId: agent?.id || null,
    agentMode: resolveAgentMode({ agent }),
    channel,
    selectedOutletId: chat?.currentOutletId || chat?.current_outlet_id || null,
    activeCartId: cart?.id || null,
    cartVersion: cart?.version ?? cart?.lockVersion ?? null,
    checkoutId: checkout?.id || null,
  };

  return Object.freeze(context);
}
