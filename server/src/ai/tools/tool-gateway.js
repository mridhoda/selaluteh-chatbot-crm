export function createToolGateway({ tools = [] } = {}) {
  const toolMap = new Map();
  for (const t of tools) {
    toolMap.set(t.name, t);
  }

  function getToolDefinitions() {
    return [...tools];
  }

  function validateToolCall({ toolName, args, workspaceId, agent }) {
    const tool = toolMap.get(toolName);
    if (!tool) {
      return { valid: false, error: `Unknown tool: ${toolName}` };
    }

    if (tool.permission && agent?.toolPolicy) {
      const allowedTools = agent.toolPolicy?.allowlist || [];
      if (allowedTools.length > 0 && !allowedTools.includes(toolName)) {
        return { valid: false, error: `Tool ${toolName} not allowed for this agent` };
      }
    }

    if (tool.mutation && agent?.toolPolicy?.readonly) {
      return { valid: false, error: 'Agent is in read-only mode' };
    }

    return { valid: true, tool };
  }

  function requiresConfirmation({ toolName }) {
    const tool = toolMap.get(toolName);
    if (!tool) return 'none';
    return tool.confirmation || 'none';
  }

  return {
    getToolDefinitions,
    validateToolCall,
    requiresConfirmation,
    toolMap,
  };
}
