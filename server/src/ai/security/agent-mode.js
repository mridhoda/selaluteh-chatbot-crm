export const AGENT_MODES = Object.freeze({
  SUPPORT: 'support',
  COMMERCE_READ: 'commerce_read',
  COMMERCE_CART: 'commerce_cart',
  COMPLAINT: 'complaint',
});

const MODE_VALUES = new Set(Object.values(AGENT_MODES));
const CART_TOOLS = new Set(['add_cart_item', 'select_outlet', 'checkout_cart']);
const READ_TOOLS = new Set(['get_outlets', 'search_products']);

export function resolveAgentMode({ agent = {}, requestedMode = null } = {}) {
  if (MODE_VALUES.has(agent?.mode)) return agent.mode;
  if (MODE_VALUES.has(agent?.aiSettings?.mode)) return agent.aiSettings.mode;

  const tools = Array.isArray(agent?.tools) ? agent.tools : [];
  if (tools.some((tool) => CART_TOOLS.has(tool))) return AGENT_MODES.COMMERCE_CART;
  if (tools.some((tool) => READ_TOOLS.has(tool))) return AGENT_MODES.COMMERCE_READ;

  return AGENT_MODES.SUPPORT;
}
