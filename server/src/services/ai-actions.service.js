import { aiActionsRepository } from '../db/repositories/index.js';

export const ALLOWED_AI_ACTIONS = new Set([
  'search_product',
  'select_outlet',
  'show_product_detail',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'start_checkout',
  'ask_clarifying_question',
  'create_complaint_draft',
  'escalate_to_human',
  'summarize_chat',
  'create_legacy_order',
  'create_legacy_complaint',
]);

export const RESTRICTED_AI_ACTIONS = new Set([
  'mark_payment_paid',
  'mark_order_paid',
  'set_order_paid',
  'override_payment_status',
  'approve_manual_payment',
  'refund_payment',
  'change_product_price',
  'change_inventory',
  'create_final_order_without_confirmation',
  'change_order_outlet_after_payment',
  'access_other_workspace_data',
  'send_platform_token',
  'delete_order',
]);

export function validateAIAction({ actionType, workspaceId, input = {} }) {
  const validationErrors = [];

  if (!workspaceId) validationErrors.push('workspace_id is required');
  if (!actionType) validationErrors.push('action_type is required');
  if (RESTRICTED_AI_ACTIONS.has(actionType)) validationErrors.push(`AI action is restricted: ${actionType}`);
  if (actionType && !ALLOWED_AI_ACTIONS.has(actionType)) validationErrors.push(`AI action is not allowed: ${actionType}`);

  if (actionType === 'add_to_cart' || actionType === 'start_checkout') {
    if (!input.outletId && !input.outlet_id) validationErrors.push('outlet_id is required for commerce AI action');
  }

  return {
    valid: validationErrors.length === 0,
    validationErrors,
  };
}

export async function proposeAIAction({
  workspaceId,
  chatId = null,
  chatMessageId = null,
  agentId = null,
  actionType,
  input = {},
}) {
  const validation = validateAIAction({ actionType, workspaceId, input });
  if (!workspaceId) {
    const err = new Error('workspace_id is required for AI action');
    err.status = 400;
    throw err;
  }

  const action = await aiActionsRepository.create({
    workspaceId,
    chatId,
    chatMessageId,
    agentId,
    actionType,
    status: validation.valid ? 'proposed' : 'rejected',
    input,
    validationErrors: validation.validationErrors,
  });

  return { action, ...validation };
}

export async function executeAIAction({
  workspaceId,
  chatId = null,
  chatMessageId = null,
  agentId = null,
  actionType,
  input = {},
  executor,
}) {
  const proposal = await proposeAIAction({ workspaceId, chatId, chatMessageId, agentId, actionType, input });
  if (!proposal.valid) return proposal;

  const action = await aiActionsRepository.markValidated(proposal.action.id);

  try {
    const output = await executor();
    const executedAction = await aiActionsRepository.markExecuted(action.id, serializeOutput(output));
    return { valid: true, action: executedAction, output };
  } catch (err) {
    const failedAction = await aiActionsRepository.markFailed(action.id, err);
    return { valid: false, action: failedAction, validationErrors: [err.message], error: err };
  }
}

function serializeOutput(output) {
  if (!output) return {};
  if (typeof output.toObject === 'function') return output.toObject();
  if (typeof output === 'object') return output;
  return { value: output };
}
