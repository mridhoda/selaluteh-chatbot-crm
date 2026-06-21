export function executeOrderFlow({ action, args, order }) {
  switch (action) {
    case 'confirm':
      return {
        requiresConfirmation: true,
        summary: {
          items: order?.items || [],
          total: order?.total || 0,
          outletId: order?.outletId,
        },
      };
    case 'create':
      return { action: 'create_order', requiresConfirmation: false };
    default:
      return { success: false, error: `unknown_action: ${action}` };
  }
}
