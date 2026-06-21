import { aiRunsRepository, aiToolCallsRepository } from '../../db/repositories/index.js';

export async function startTrace({ workspaceId, chatId, sessionId, agentId, agentVersion, inboundMessageId, startReason }) {
  return aiRunsRepository.createRun({
    workspaceId, chatId, sessionId, agentId, agentVersion, inboundMessageId, startReason,
  });
}

export async function completeTrace({ runId, assistantMessageId, latencyMs, inputTokens, outputTokens, endReason, contextMetadata }) {
  return aiRunsRepository.completeRun({
    runId, assistantMessageId, latencyMs, inputTokens, outputTokens, endReason, contextMetadata,
  });
}

export async function failTrace({ runId, errorCode, latencyMs }) {
  return aiRunsRepository.failRun({ runId, errorCode, latencyMs });
}

export async function traceToolCall({ runId, workspaceId, toolName, input }) {
  return aiToolCallsRepository.createToolCall({ runId, workspaceId, toolName, input });
}

export async function completeToolTrace({ toolCallId, result, latencyMs }) {
  return aiToolCallsRepository.completeToolCall({ id: toolCallId, result, latencyMs });
}
