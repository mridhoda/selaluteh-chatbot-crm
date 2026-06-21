export function executeOutletFlow({ action, args, context }) {
  switch (action) {
    case 'suggest':
      return {
        suggested: context.lastOutletId ? { id: context.lastOutletId } : null,
        outlets: context.outlets || [],
        requiresConfirmation: true,
      };
    case 'select':
      const outlet = (context.outlets || []).find((o) => o.id === args.outletId);
      if (!outlet) return { success: false, error: 'outlet_not_found' };
      return { success: true, outlet };
    default:
      return { success: false, error: `unknown_action: ${action}` };
  }
}
