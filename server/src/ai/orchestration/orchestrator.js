import { createAgentRouter } from './agent-router.js';
import { createModelRouter } from './model-router.js';
import { createToolGateway } from '../tools/tool-gateway.js';
import { createTurnState } from './turn-state-machine.js';
import { classifyIntent } from './semantic-router.js';
import { cartsRepository, productsRepository, outletsSupabaseRepository, paymentsRepository, ordersRepository } from '../../db/repositories/index.js';
import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

const MAX_TOOL_CALLS = 10;
const MAX_ITERATIONS = 5;

export function createOrchestrator({ agentRouter, modelRouter, toolGateway, contextBuilder, memoryService } = {}) {
  const router = agentRouter || createAgentRouter();
  const mRouter = modelRouter || createModelRouter();
  const tGateway = toolGateway || createToolGateway();

  async function runTurn({ workspaceId, platformId, chat, message, contactId }) {
    const agent = await router.resolveAgent({ workspaceId, platformId, chat });
    const modelConfig = await mRouter.routeTask({ taskType: 'chat', agent });
    const intent = classifyIntent(message?.content || '');

    let memories = [];
    if (memoryService && contactId) {
      memories = await memoryService.selectRelevantForContext({ workspaceId, contactId });
    }

    const toolDefs = tGateway.getToolDefinitions();
    const agentTools = toolDefs.filter((t) => {
      if (!agent?.toolPolicy?.allowlist) return true;
      return agent.toolPolicy.allowlist.includes(t.name);
    });

    return {
      agent, modelConfig, memories, toolDefinitions: agentTools, intent,
    };
  }

  async function executeToolLoop({ toolCall, agent, workspaceId, chat, contact }) {
    if (!tGateway.validateToolCall({ toolName: toolCall.name, args: toolCall.arguments, agent }).valid) {
      return { error: `Tool ${toolCall.name} not allowed` };
    }
    try {
      return await executeCommerceTool({ toolCall, workspaceId, chat, contact });
    } catch (err) {
      return { error: err.message, toolName: toolCall.name };
    }
  }

  return { runTurn, executeToolLoop, router, modelRouter: mRouter, toolGateway: tGateway };
}

async function executeCommerceTool({ toolCall, workspaceId, chat, contact }) {
  const { name, arguments: args } = toolCall;
  switch (name) {
    case 'search_products':
      const products = await productsRepository.search({ workspaceId, query: args.query });
      return { result: products, toolName: name };

    case 'get_outlets':
      const outlets = await outletsSupabaseRepository.list({ workspaceId });
      return { result: outlets.map(o => ({ id: o.id, name: o.name, city: o.city, status: o.operational_status })), toolName: name };

    case 'select_outlet':
      const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId: args.outletId });
      if (!outlet) throw new AppError('NOT_FOUND', 'Outlet not found', 404);
      const contactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
      await cartsRepository.upsertByContact({ workspaceId, contactId, outletId: args.outletId, chatId: chat?.id || null });
      return { result: { outletId: args.outletId, name: outlet.name }, toolName: name };


    case 'add_cart_item':
      const cartContactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
      const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId: cartContactId });
      if (!cart) throw new AppError('CART_NOT_FOUND', 'No active cart. Select outlet first.', 400);
      const productForCart = await productsRepository.findById({ workspaceId, productId: args.productId });
      if (!productForCart) throw new AppError('PRODUCT_NOT_FOUND', 'Product not found. Call search_products again and use productId from the result.', 404);
      const updatedCart = await cartsRepository.addItem({
        workspaceId,
        cartId: cart.id,
        item: {
          productId: args.productId,
          quantity: args.quantity || 1,
          name: productForCart?.name || '',
          productNameSnapshot: productForCart?.name || '',
          unitPrice: productForCart?.basePrice ?? productForCart?.price ?? 0,
          effectivePrice: productForCart?.basePrice ?? productForCart?.price ?? 0,
          variantId: args.variantId || null,
        },
      });
      const cartTotal = updatedCart.items.reduce((sum, i) => sum + (i.subtotal || i.subtotalAmount || 0), 0);
      await cartsRepository.update({ workspaceId, cartId: cart.id, updates: { total: cartTotal } });
      return { result: { cartId: cart.id, item: updatedCart.items.at(-1) }, toolName: name };

    case 'get_active_cart':
      const activeCart = await cartsRepository.findActiveByContact({ workspaceId, contactId: typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId });
      return { result: activeCart || { empty: true }, toolName: name };

    case 'create_order':
      const ordWorkspaceId = workspaceId;
      const ordCartId = args.cartId;
      const orderContactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
      const activeOrdCart = ordCartId
        ? await cartsRepository.findById(ordCartId)
        : await cartsRepository.findActiveByContact({ workspaceId: ordWorkspaceId, contactId: orderContactId });
      if (!activeOrdCart) throw new AppError('CART_NOT_FOUND', 'No active cart', 400);

      const { createCheckout, confirmCheckout } = await import('../../services/checkout.service.js');
      const { createOrderFromCheckout } = await import('../../services/order.service.js');
      const { createXenditPaymentSessionForOrder, createPaymentForOrder } = await import('../../services/payment.service.js');
      const checkoutsRepository = (await import('../../db/repositories/index.js')).checkoutsRepository;

      const checkout = await createCheckout({
        workspaceId: ordWorkspaceId,
        outletId: activeOrdCart.outletId,
        contactId: orderContactId,
        chatId: chat?.id,
        customerSnapshot: { contactName: contact?.name || '' },
        fulfillmentSnapshot: { method: 'pickup', outletName: activeOrdCart.outletName || '' },
      });
      const confirmed = await confirmCheckout({ workspaceId: ordWorkspaceId, checkoutId: checkout.id });
      const order = await createOrderFromCheckout({ workspaceId: ordWorkspaceId, checkout: confirmed });

      let paymentLink = null;
      if (env.paymentProvider === 'xendit') {
        const paymentSession = await createXenditPaymentSessionForOrder({
          workspaceId: ordWorkspaceId,
          orderId: order.id,
          customer: { name: contact?.name || '' },
        });
        paymentLink = paymentSession.paymentUrl || paymentSession.paymentLink;
      } else {
        await createPaymentForOrder({ workspaceId: ordWorkspaceId, orderId: order.id });
      }
      await checkoutsRepository.updateStatus({ workspaceId: ordWorkspaceId, checkoutId: checkout.id, status: 'converted' });

      return {
        result: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.totals?.total || 0,
          paymentLink,
        },
        toolName: name,
      };

    default:
      return { result: { success: true }, toolName: name };
  }
}
