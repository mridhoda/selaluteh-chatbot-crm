const VALID_TEMPERATURE_RANGE = { min: 0, max: 2 };
const VALID_PROVIDERS = ['local_openai_compatible', 'openai', 'gemini'];
const VALID_AGENT_STATUSES = ['active', 'inactive', 'archived'];

const FORBIDDEN_PROMPT_PATTERNS = [
  /mark.*paid/i,
  /tandai.*bayar/i,
  /mark_payment_paid/i,
  /set_payment_status/i,
  /abaikan.*aturan/i,
  /ignore.*(policy|rule|safety)/i,
  /kamu.*admin/i,
  /you.*admin/i,
  /jangan.*ikut.*instruksi/i,
  /don't.*follow.*instruction/i,
];

export function validateAgentConfig(config) {
  const errors = [];

  if (!config.name || typeof config.name !== 'string') {
    errors.push('name is required');
  }

  if (config.status && !VALID_AGENT_STATUSES.includes(config.status)) {
    errors.push(`status must be one of: ${VALID_AGENT_STATUSES.join(', ')}`);
  }

  if (config.temperature !== undefined && config.temperature !== null) {
    if (typeof config.temperature !== 'number' ||
        config.temperature < VALID_TEMPERATURE_RANGE.min ||
        config.temperature > VALID_TEMPERATURE_RANGE.max) {
      errors.push(`temperature must be ${VALID_TEMPERATURE_RANGE.min}-${VALID_TEMPERATURE_RANGE.max}`);
    }
  }

  if (config.provider && !VALID_PROVIDERS.includes(config.provider)) {
    errors.push(`provider must be one of: ${VALID_PROVIDERS.join(', ')}`);
  }

  if (config.behavior) {
    for (const pattern of FORBIDDEN_PROMPT_PATTERNS) {
      if (pattern.test(config.behavior)) {
        errors.push(`behavior contains forbidden pattern: ${pattern}`);
        break;
      }
    }
  }

  if (config.prompt) {
    for (const pattern of FORBIDDEN_PROMPT_PATTERNS) {
      if (pattern.test(config.prompt)) {
        errors.push(`prompt contains forbidden pattern: ${pattern}`);
        break;
      }
    }
  }

  if (config.tools && !Array.isArray(config.tools)) {
    errors.push('tools must be an array');
  }

  if (config.knowledge && !Array.isArray(config.knowledge)) {
    errors.push('knowledge must be an array');
  }

  return { valid: errors.length === 0, errors };
}
