const TOKENS_PER_CHAR = {
  'text': 0.25,
  'code': 0.20,
  'json': 0.35,
};

export function estimateTokens(text, type = 'text') {
  if (!text) return 0;
  const rate = TOKENS_PER_CHAR[type] || TOKENS_PER_CHAR.text;
  return Math.ceil(text.length * rate);
}

const DEFAULT_MAX_INPUT_TOKENS = 8000;
const OUTPUT_RESERVE_TOKENS = 1000;

const MANDATORY_SECTIONS = new Set([
  'platform_policy',
  'human_takeover',
  'commerce_state',
  'current_message',
]);

const SECTION_PRIORITY = [
  'platform_policy',
  'human_takeover',
  'workspace_policy',
  'agent_instruction',
  'agent_prompt',
  'greeting_policy',
  'customer_profile',
  'confirmed_memory',
  'rolling_summary',
  'recent_messages',
  'rag_context',
  'commerce_state',
  'tool_definitions',
  'current_message',
];

export function allocateTokenBudget({ sections, maxInputTokens = DEFAULT_MAX_INPUT_TOKENS }) {
  const budget = maxInputTokens - OUTPUT_RESERVE_TOKENS;
  if (budget <= 0) {
    return { sections: [], remainingBudget: 0, truncated: [] };
  }

  const prioritized = SECTION_PRIORITY
    .map((name) => sections.find((s) => s.name === name))
    .filter(Boolean);

  let available = budget;

  const mandatory = prioritized.filter((s) => MANDATORY_SECTIONS.has(s.name));
  const optional = prioritized.filter((s) => !MANDATORY_SECTIONS.has(s.name));

  const included = [];
  const truncated = [];

  for (const section of mandatory) {
    const tokens = typeof section.tokens === 'number' ? section.tokens : estimateTokens(section.content || '');
    if (tokens <= available) {
      included.push(section);
      available -= tokens;
    } else {
      const half = Math.floor(available / 2);
      included.push({ ...section, content: (section.content || '').slice(0, Math.max(0, Math.ceil(half / TOKENS_PER_CHAR.text))), truncated: true });
      truncated.push(section.name);
      available = 0;
      break;
    }
  }

  for (const section of optional) {
    if (available <= 0) {
      truncated.push(section.name);
      continue;
    }
    const tokens = typeof section.tokens === 'number' ? section.tokens : estimateTokens(section.content || '');
    if (tokens <= available) {
      included.push(section);
      available -= tokens;
    } else {
      truncated.push(section.name);
    }
  }

  return { sections: included, remainingBudget: available, truncated };
}
