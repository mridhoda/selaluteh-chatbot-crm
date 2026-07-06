import { commerceToolDefinitions } from './domain-tools.js';
import { memoryToolDefinitions } from './memory-tools.js';

function cloneAndFreezeTool(tool, version) {
  return Object.freeze({
    ...tool,
    registryVersion: version,
    inputSchema: Object.freeze({
      ...(tool.inputSchema || { type: 'object', properties: {} }),
      properties: Object.freeze({ ...(tool.inputSchema?.properties || {}) }),
      required: Object.freeze([...(tool.inputSchema?.required || [])]),
    }),
  });
}

export function createAIToolRegistry({ version = 'aisg-v1', tools = [...commerceToolDefinitions, ...memoryToolDefinitions] } = {}) {
  const definitions = tools.map((tool) => cloneAndFreezeTool(tool, version));
  const toolMap = new Map(definitions.map((tool) => [tool.name, tool]));

  return Object.freeze({
    version,
    listDefinitions() {
      return [...definitions];
    },
    get(name) {
      return toolMap.get(name) || null;
    },
    has(name) {
      return toolMap.has(name);
    },
  });
}

export const defaultAIToolRegistry = createAIToolRegistry();
