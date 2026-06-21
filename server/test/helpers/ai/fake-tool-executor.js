export function createFakeToolExecutor(handlers = {}) {
  const executedCalls = [];

  const defaultHandlers = {
    search_products: async (args) => ({
      success: true,
      data: [
        { id: 'prod-1', name: 'Teh Manis', price: 5000, available: true },
        { id: 'prod-2', name: 'Teh Tawar', price: 3000, available: true },
      ],
    }),
    get_product_details: async (args) => ({
      success: true,
      data: { id: args.productId, name: 'Teh Manis', price: 5000, description: 'Teh manis segar' },
    }),
    get_outlets: async () => ({
      success: true,
      data: [
        { id: 'outlet-1', name: 'Outlet Samarinda', status: 'open' },
        { id: 'outlet-2', name: 'Outlet Balikpapan', status: 'open' },
      ],
    }),
    get_active_cart: async () => ({
      success: true,
      data: { items: [], total: 0, outletId: null },
    }),
    get_order_status: async (args) => ({
      success: true,
      data: { id: args.orderId, status: 'pending', total: 15000 },
    }),
    get_payment_status: async (args) => ({
      success: true,
      data: { id: args.paymentId, status: 'pending', amount: 15000 },
    }),
    select_outlet: async (args) => ({
      success: true,
      data: { outlet: { id: args.outletId, name: 'Selected Outlet' } },
    }),
    add_cart_item: async (args) => ({
      success: true,
      data: { item: { productId: args.productId, quantity: args.quantity || 1 }, cartTotal: 5000 },
    }),
    create_order: async (args) => ({
      success: true,
      data: { id: `order-${Date.now()}`, status: 'pending', total: args.total },
    }),
    create_payment_link: async (args) => ({
      success: true,
      data: { id: `pay-${Date.now()}`, paymentLinkUrl: 'https://checkout.xendit.co/test', status: 'pending' },
    }),
    handover_to_human: async () => ({
      success: true,
      data: { message: 'Dialihkan ke admin' },
    }),
  };

  const mergedHandlers = { ...defaultHandlers, ...handlers };

  return {
    execute: async (toolName, args) => {
      const handler = mergedHandlers[toolName];
      if (!handler) {
        executedCalls.push({ toolName, args, error: `Unknown tool: ${toolName}` });
        return { success: false, error: `Unknown tool: ${toolName}` };
      }
      try {
        const result = await handler(args);
        executedCalls.push({ toolName, args, result });
        return result;
      } catch (err) {
        executedCalls.push({ toolName, args, error: err.message });
        return { success: false, error: err.message };
      }
    },

    getExecutedCalls: () => [...executedCalls],
    reset: () => { executedCalls.length = 0; },
  };
}
