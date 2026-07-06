import { assertNoAuthorityFields } from '../security/tenant-guard.js';
import { evaluateRestrictedActionPolicy } from '../security/restricted-action-policy.js';
import { createAIToolRegistry } from './tool-registry.js';
import { normalizeToolResult, safeError } from './result-redactor.js';

const DEFAULT_LIMITS = Object.freeze({
  maxToolCalls: 10,
  maxPayloadBytes: 8192,
  defaultTimeoutMs: 5000,
});

function createGatewayError(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  return error;
}

function getAllowedTools(agent = {}) {
  const allowlist = agent?.toolPolicy?.allowlist;
  return Array.isArray(allowlist) ? allowlist : [];
}

function payloadBytes(args = {}) {
  return Buffer.byteLength(JSON.stringify(args || {}), 'utf8');
}

function validateType({ key, value, schema }) {
  if (value == null) return;
  if (schema.type === 'string' && typeof value !== 'string') {
    throw createGatewayError('AI_TOOL_SCHEMA_TYPE_MISMATCH', `Expected ${key} to be string`);
  }
  if (schema.type === 'number' && typeof value !== 'number') {
    throw createGatewayError('AI_TOOL_SCHEMA_TYPE_MISMATCH', `Expected ${key} to be number`);
  }
  if (schema.type === 'integer' && (!Number.isInteger(value))) {
    throw createGatewayError('AI_TOOL_SCHEMA_TYPE_MISMATCH', `Expected ${key} to be integer`);
  }
  if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
    throw createGatewayError('AI_TOOL_SCHEMA_TYPE_MISMATCH', `Expected ${key} to be object`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    throw createGatewayError('AI_TOOL_SCHEMA_ENUM_MISMATCH', `Invalid enum value for ${key}`);
  }
  if (typeof schema.minimum === 'number' && Number(value) < schema.minimum) {
    throw createGatewayError('AI_TOOL_SCHEMA_MINIMUM', `Value for ${key} is below minimum`);
  }
}

export function validateToolPayloadSchema({ tool, args = {} } = {}) {
  assertNoAuthorityFields(args);

  const schema = tool?.inputSchema || { type: 'object', properties: {}, required: [] };
  const properties = schema.properties || {};
  const required = schema.required || [];

  if (schema.type === 'object' && (typeof args !== 'object' || args === null || Array.isArray(args))) {
    throw createGatewayError('AI_TOOL_SCHEMA_TYPE_MISMATCH', 'Tool payload must be an object');
  }

  for (const field of required) {
    if (!(field in args)) {
      throw createGatewayError('AI_TOOL_SCHEMA_REQUIRED_FIELD', `Missing required field: ${field}`);
    }
  }

  for (const [key, value] of Object.entries(args)) {
    const propertySchema = properties[key];
    if (!propertySchema) {
      throw createGatewayError('AI_TOOL_SCHEMA_UNKNOWN_FIELD', `Unknown field: ${key}`);
    }
    validateType({ key, value, schema: propertySchema });
  }

  return { valid: true };
}

export function createToolGateway({ tools = [], registry = null, limits = {}, dependencyBreakers = {} } = {}) {
  const effectiveRegistry = registry || createAIToolRegistry({ tools });
  const effectiveLimits = { ...DEFAULT_LIMITS, ...limits };
  let toolCallCount = 0;

  const toolMap = new Map();
  for (const t of effectiveRegistry.listDefinitions()) {
    toolMap.set(t.name, t);
  }

  function getToolDefinitions() {
    return effectiveRegistry.listDefinitions();
  }

  function validateToolCall({ toolName, args, workspaceId, agent }) {
    const tool = toolMap.get(toolName);
    if (!tool) {
      return { valid: false, code: 'AI_TOOL_UNKNOWN', error: `Unknown tool: ${toolName}` };
    }

    const policyDecision = evaluateRestrictedActionPolicy({ action: toolName, toolName });
    if (!policyDecision.allowed) {
      return { valid: false, code: policyDecision.code, error: policyDecision.publicMessage };
    }

    const allowedTools = getAllowedTools(agent);
    if (!allowedTools.includes(toolName)) {
      return { valid: false, code: 'AI_TOOL_DENIED_BY_DEFAULT', error: `Tool ${toolName} is not explicitly allowed for this agent` };
    }

    if (tool.mutation && agent?.toolPolicy?.readonly) {
      return { valid: false, code: 'AI_TOOL_READONLY_AGENT', error: 'Agent is in read-only mode' };
    }

    if (payloadBytes(args) > effectiveLimits.maxPayloadBytes) {
      return { valid: false, code: 'AI_TOOL_PAYLOAD_TOO_LARGE', error: 'Tool payload is too large' };
    }

    const breaker = dependencyBreakers[toolName] || dependencyBreakers[tool.permission];
    if (breaker && typeof breaker.allowRequest === 'function' && !breaker.allowRequest()) {
      return { valid: false, code: 'AI_TOOL_DEPENDENCY_UNAVAILABLE', error: 'Tool dependency is temporarily unavailable' };
    }

    try {
      validateToolPayloadSchema({ tool, args });
    } catch (error) {
      return { valid: false, code: error.code || 'AI_TOOL_SCHEMA_INVALID', error: error.message };
    }

    return { valid: true, tool };
  }

  function requiresConfirmation({ toolName }) {
    const tool = toolMap.get(toolName);
    if (!tool) return 'none';
    return tool.confirmation || 'none';
  }

  async function executeToolCall({ toolName, args = {}, agent = {}, executor }) {
    if (toolCallCount >= effectiveLimits.maxToolCalls) {
      return safeError('AI_TOOL_LIMIT_EXCEEDED', 'Batas pemanggilan tool tercapai. Silakan coba lagi.', { retryable: true });
    }

    const validation = validateToolCall({ toolName, args, agent });
    if (!validation.valid) {
      return safeError(validation.code, validation.error);
    }

    toolCallCount++;
    const tool = validation.tool;
    const timeoutMs = Math.min(Number(tool.timeoutMs || effectiveLimits.defaultTimeoutMs), Number(effectiveLimits.defaultTimeoutMs || tool.timeoutMs || 5000));

    try {
      const execution = Promise.resolve(executor({ tool, args }));
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(createGatewayError('AI_TOOL_TIMEOUT', 'Tool execution timed out')), timeoutMs);
      });
      return normalizeToolResult(await Promise.race([execution, timeout]));
    } catch (error) {
      return normalizeToolResult(error, {
        fallbackMessage: error.code === 'AI_TOOL_TIMEOUT'
          ? 'Permintaan membutuhkan waktu terlalu lama. Silakan coba lagi.'
          : 'Data belum bisa dimuat.',
        retryable: true,
      });
    }
  }

  return {
    getToolDefinitions,
    validateToolCall,
    requiresConfirmation,
    executeToolCall,
    validateToolPayloadSchema,
    toolMap,
    registry: effectiveRegistry,
  };
}
