import { env } from '../config/env.js';

export function buildAIContext({ workspace, outlet, products = [], cart = null, order = null, takeoverActive = false }) {
  const parts = [];

  if (outlet) {
    parts.push(`Selected outlet: ${outlet.name} (${outlet.city || ''})`);
  }

  if (products.length > 0) {
    const productLines = products.slice(0, 20).map((p) => {
      const price = p.effectivePrice || p.basePrice;
      return `- ${p.name} (ID: ${p._id}): ${price ? `Rp${price.toLocaleString('id-ID')}` : 'Price not set'}`;
    });
    parts.push(`Available products:\n${productLines.join('\n')}`);
    if (products.length > 20) parts.push(`... and ${products.length - 20} more products.`);
  }

  if (cart) {
    parts.push(`Current cart: ${cart.items?.length || 0} item(s), total: Rp${(cart.total || 0).toLocaleString('id-ID')}`);
  }

  if (order) {
    parts.push(`Latest order: #${order.orderNumber || order._id} — status: ${order.status}, payment: ${order.paymentStatus || 'pending'}`);
  }

  if (takeoverActive) {
    parts.push('Note: This chat is under human takeover. You can read and summarize but cannot take commerce actions or send messages.');
  }

  return parts.join('\n\n');
}

export function safeContextRules() {
  return `
You are a helpful customer service and commerce assistant for SelaluTeh.
- You may suggest products, show prices, and help customers add items to their cart.
- You must NOT change prices, mark payments as paid, or alter order status directly.
- You must NOT share API keys, tokens, or internal configuration.
- You must NOT access data from other workspaces or customers.
- If unsure, ask the customer to clarify or offer to connect them with a human agent.
`.trim();
}
