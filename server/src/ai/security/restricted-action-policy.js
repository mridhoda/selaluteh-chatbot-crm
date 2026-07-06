export const RESTRICTED_ACTIONS = new Set([
  'mark_payment_paid',
  'mark_order_paid',
  'set_payment_status',
  'update_payment_status',
  'refund_payment',
  'cancel_paid_order',
  'override_price',
  'set_unit_price',
  'set_effective_price',
  'switch_workspace',
  'impersonate_admin',
]);

export function evaluateRestrictedActionPolicy({ action, toolName } = {}) {
  const candidate = action || toolName;
  if (RESTRICTED_ACTIONS.has(candidate)) {
    return {
      allowed: false,
      code: 'AI_RESTRICTED_ACTION_DENIED',
      reason: 'restricted_action',
      publicMessage: 'Aksi ini hanya bisa dilakukan oleh sistem atau admin yang berwenang.',
    };
  }

  return {
    allowed: true,
    code: 'AI_ACTION_ALLOWED',
    reason: 'allowed',
  };
}
