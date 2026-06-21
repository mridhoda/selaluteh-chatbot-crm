import { createAgentRouter } from './agent-router.js';
import { createModelRouter } from './model-router.js';
import { createToolGateway } from '../tools/tool-gateway.js';
import { createTurnState } from './turn-state-machine.js';
import { classifyIntent } from './semantic-router.js';

const MAX_TOOL_CALLS = 10;
const MAX_ITERATIONS = 5;

export function createOrchestrator({ agentRouter, modelRouter, toolGateway, contextBuilder, memoryService } = {}) {
  const router = agentRouter || createAgentRouter();
  const mRouter = modelRouter || createModelRouter();
  const tGateway = toolGateway || createToolGateway();

  async function runTurn({ workspaceId, platformId, chat, message, contactId }) {
    const agent = await router.resolveAgent({ workspaceId, platformId, chat });
    const modelConfig = await mRouter.routeTask({ taskType: 'chat', agent });
    const intent = classifyIntent(message?.content || '');

    let memories = [];
    if (memoryService && contactId) {
      memories = await memoryService.selectRelevantForContext({ workspaceId, contactId });
    }

    const toolDefs = tGateway.getToolDefinitions();
    const agentTools = toolDefs.filter((t) => {
      if (!agent?.toolPolicy?.allowlist) return true;
      return agent.toolPolicy.allowlist.includes(t.name);
    });

    return {
      agent, modelConfig, memories, toolDefinitions: agentTools, intent,
    };
  }

  async function executeToolLoop({ toolCall, agent, workspaceId }) {
    if (!tGateway.validateToolCall({ toolName: toolCall.name, args: toolCall.arguments, agent }).valid) {
      return { error: `Tool ${toolCall.name} not allowed` };
    }
    return { result: { success: true }, toolName: toolCall.name };
  }

  return { runTurn, executeToolLoop, router, modelRouter: mRouter, toolGateway: tGateway };
}
