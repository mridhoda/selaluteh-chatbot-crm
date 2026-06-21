export function executePaymentFlow({ action, args, payment }) {
  switch (action) {
    case 'create_link':
      return { action: 'create_payment_link', requiresConfirmation: true };
    case 'status':
      return {
        status: payment?.status || 'unknown',
        readOnly: true,
        note: 'AI can only report payment status. AI cannot mark as paid.',
      };
    default:
      return { success: false, error: `unknown_action: ${action}` };
  }
}
