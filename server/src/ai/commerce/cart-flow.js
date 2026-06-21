export function executeCartFlow({ action, args, cart }) {
  switch (action) {
    case 'add':
      return {
        action: 'add_cart_item',
        requiresConfirmation: false,
        preview: `Menambahkan ${args.quantity || 1}x ${args.productId} ke keranjang`,
      };
    case 'show':
      return { items: cart?.items || [], total: cart?.total || 0, outletId: cart?.outletId };
    case 'clear':
      return { action: 'clear_cart', requiresConfirmation: true };
    default:
      return { success: false, error: `unknown_action: ${action}` };
  }
}
