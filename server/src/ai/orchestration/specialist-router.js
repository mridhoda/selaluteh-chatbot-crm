const SPECIALIST_ROLES = {
  commerce: {
    description: 'Handles product search, cart, and checkout flows',
    toolAllowlist: ['search_products', 'get_product_details', 'get_outlets', 'select_outlet', 'add_cart_item', 'get_active_cart', 'create_order', 'get_order_status'],
    knowledgeScope: ['product_description', 'promotion_rule', 'opening_hours'],
    modelPreference: { minCapability: 'standard' },
  },
  support: {
    description: 'Handles complaints, returns, and handoff to human',
    toolAllowlist: ['report_complaint', 'handover_to_human', 'get_order_status'],
    knowledgeScope: ['complaint_procedure', 'refund_policy', 'faq'],
    modelPreference: { minCapability: 'standard' },
  },
  order_status: {
    description: 'Read-only order and payment status',
    toolAllowlist: ['get_order_status', 'get_payment_status'],
    knowledgeScope: ['faq', 'opening_hours'],
    modelPreference: { minCapability: 'fast' },
  },
  internal_copilot: {
    description: 'Internal admin assistant for workspace management',
    toolAllowlist: [],
    knowledgeScope: [],
    modelPreference: { minCapability: 'standard' },
    requiresAuth: true,
  },
  product_recommendation: {
    description: 'Product recommendations based on preferences',
    toolAllowlist: ['search_products', 'get_product_details', 'list_customer_memories'],
    knowledgeScope: ['product_description', 'promotion_rule'],
    modelPreference: { minCapability: 'standard' },
  },
};

const ROLE_KNOWLEDGE_CATEGORIES = new Map();
for (const [role, config] of Object.entries(SPECIALIST_ROLES)) {
  for (const cat of config.knowledgeScope) {
    if (!ROLE_KNOWLEDGE_CATEGORIES.has(cat)) ROLE_KNOWLEDGE_CATEGORIES.set(cat, []);
    ROLE_KNOWLEDGE_CATEGORIES.get(cat).push(role);
  }
}

export function routeToSpecialist({ intent, detectedRole, fallbackAgent }) {
  const specialist = SPECIALIST_ROLES[intent] || SPECIALIST_ROLES[detectedRole];
  if (!specialist) return { specialist: null, useFallback: true, agent: fallbackAgent };
  return { specialist, useFallback: false, specialistRole: detectedRole || intent };
}

export { SPECIALIST_ROLES, ROLE_KNOWLEDGE_CATEGORIES };
