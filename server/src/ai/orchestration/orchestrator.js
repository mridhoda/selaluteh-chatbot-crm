import { createAgentRouter } from './agent-router.js';
import { createModelRouter } from './model-router.js';
import { createToolGateway } from '../tools/tool-gateway.js';
import { classifyIntent } from './semantic-router.js';
import { productsRepository, outletsSupabaseRepository } from '../../db/repositories/index.js';

const MUTATION_TOOL_DENIAL = Object.freeze({
  error: 'AI_ACTION_CONFIRMATION_REQUIRED',
  message: 'AI mutation tools are disabled until the AISG confirmation gateway is enforced.',
});

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

  async function executeToolLoop({ toolCall, agent, workspaceId, chat, contact }) {
    if (!tGateway.validateToolCall({ toolName: toolCall.name, args: toolCall.arguments, agent }).valid) {
      return { error: `Tool ${toolCall.name} not allowed` };
    }
    try {
      return await executeCommerceTool({ toolCall, workspaceId, chat, contact });
    } catch (err) {
      return { error: err.message, toolName: toolCall.name };
    }
  }

  return { runTurn, executeToolLoop, router, modelRouter: mRouter, toolGateway: tGateway };
}

async function executeCommerceTool({ toolCall, workspaceId, chat, contact }) {
  const { name, arguments: args } = toolCall;
  switch (name) {
    case 'search_products':
      const products = await productsRepository.search({ workspaceId, query: args.query });
      return { result: products, toolName: name };

    case 'get_outlets':
      const outlets = await outletsSupabaseRepository.list({ workspaceId });
      return { result: outlets.map(o => ({ id: o.id, name: o.name, city: o.city, status: o.operational_status })), toolName: name };

    case 'select_outlet':
      return { result: MUTATION_TOOL_DENIAL, toolName: name };


    case 'add_cart_item':
      return { result: MUTATION_TOOL_DENIAL, toolName: name };

    case 'get_active_cart':
      return { result: { error: 'AI_TOOL_NOT_AVAILABLE', message: 'Cart reads must go through the AISG gateway.' }, toolName: name };

    case 'create_order':
      return { result: MUTATION_TOOL_DENIAL, toolName: name };

    default:
      return { result: { success: true }, toolName: name };
  }
}
