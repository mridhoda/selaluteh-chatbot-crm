import { conversationSummariesRepository } from '../../db/repositories/index.js';

const DEFAULT_SUMMARY_THRESHOLD = 12;
const SUMMARY_SCHEMA = {
  customerGoal: '',
  resolvedFacts: [],
  pendingQuestions: [],
  selectedOutletReference: null,
  cartContext: [],
  supportIssue: null,
  commitmentsMade: [],
  doNotRepeat: [],
  lastState: '',
};

export function validateSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return { valid: false, errors: ['Summary must be an object'] };
  }
  const errors = [];
  for (const key of Object.keys(SUMMARY_SCHEMA)) {
    if (!(key in summary)) {
      errors.push(`Missing field: ${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function shouldSummarize({ messagesSinceLastSummary, config = {} }) {
  const threshold = config.newMessageThreshold ?? DEFAULT_SUMMARY_THRESHOLD;
  return messagesSinceLastSummary >= threshold;
}

export async function buildSummary({
  workspaceId,
  chatId,
  sessionId,
  modelProvider,
  modelName,
  summaryContent,
  messageCount,
}) {
  const validation = validateSummary(summaryContent);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  await conversationSummariesRepository.markSuperseded({ workspaceId, chatId, excludeId: null });
  const summary = await conversationSummariesRepository.createForRange({
    workspaceId,
    chatId,
    sessionId: sessionId || null,
    summary: summaryContent,
    messageRangeStart: null,
    messageRangeEnd: null,
    messageCount: messageCount || 0,
    modelProvider: modelProvider || null,
    modelName: modelName || null,
    tokenCount: null,
  });

  return { success: true, summary };
}
