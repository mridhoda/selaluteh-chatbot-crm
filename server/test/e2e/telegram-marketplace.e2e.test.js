import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import Chat from '../../src/models/Chat.js';
import Contact from '../../src/models/Contact.js';
import Outlet from '../../src/models/Outlet.js';
import Payment from '../../src/models/Payment.js';
import PaymentEvent from '../../src/models/PaymentEvent.js';
import Product from '../../src/models/Product.js';
import ProductOutletAvailability from '../../src/models/ProductOutletAvailability.js';
import { clearTestDb, connectTestDb, disconnectTestDb, objectId } from '../helpers/mongoMemory.js';

process.env.PAYMENT_PROVIDER = 'midtrans';
process.env.PUBLIC_BASE_URL = 'https://payments.test.local';

let telegramCommerce;
let orderService;
let paymentWebhookService;

describe('E2E: Telegram marketplace purchase flow', () => {
  before(async () => {
    await connectTestDb();
    telegramCommerce = await import('../../src/services/telegram-commerce.service.js');
    orderService = await import('../../src/services/order.service.js');
    paymentWebhookService = await import('../../src/services/payment-webhook.service.js');
  });

  afterEach(clearTestDb);
  after(disconnectTestDb);

  it('runs admin setup, customer purchase, payment webhook, and fulfillment end-to-end', async () => {
    const workspaceId = objectId();
    const userId = objectId();
    const agent = { _id: objectId(), workspaceId };

    const outletA = await Outlet.create({
      workspaceId,
      name: 'SelaluTeh Tenggarong',
      code: 'TGR',
      status: 'active',
    });
    const outletB = await Outlet.create({
      workspaceId,
      name: 'SelaluTeh Samarinda',
      code: 'SMD',
      status: 'active',
    });

    const saltyCaramel = await Product.create({
      workspaceId,
      name: 'Salty Caramel Tea',
      slug: 'salty-caramel-tea',
      basePrice: 15000,
      isActive: true,
    });
    const matcha = await Product.create({
      workspaceId,
      name: 'Matcha Latte',
      slug: 'matcha-latte',
      basePrice: 18000,
      isActive: true,
    });

    await ProductOutletAvailability.create({
      workspaceId,
      productId: saltyCaramel._id,
      outletId: outletA._id,
      isAvailable: true,
      status: 'active',
    });
    await ProductOutletAvailability.create({
      workspaceId,
      productId: matcha._id,
      outletId: outletB._id,
      isAvailable: true,
      status: 'active',
    });

    const contact = await Contact.create({
      userId,
      workspaceId,
      name: 'Telegram Customer',
      platformType: 'telegram',
      platformAccountId: 'telegram-customer-1',
      handle: '@customer',
    });
    const chat = await Chat.create({
      userId,
      workspaceId,
      agentId: agent._id,
      contactId: contact._id,
      platformId: objectId(),
      platformType: 'telegram',
    });

    const outletSelection = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction(`act:outlet:select:${outletA._id}:v1`),
      workspaceId,
      chat,
      contact,
      agent,
    });
    assert.match(outletSelection.text, /SelaluTeh Tenggarong/);

    const selectedChat = await Chat.findById(chat._id);
    assert.equal(String(selectedChat.currentOutletId), String(outletA._id));

    const productList = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction('act:prod:list:v1'),
      workspaceId,
      chat: selectedChat,
      contact,
      agent,
    });
    assert.match(productList.text, /Salty Caramel Tea/);
    assert.doesNotMatch(productList.text, /Matcha Latte/);

    const productDetailCallback = findCallback(productList, /Salty Caramel Tea/);
    const productDetail = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction(productDetailCallback),
      workspaceId,
      chat: selectedChat,
      contact,
      agent,
    });
    assert.match(productDetail.text, /Harga: Rp 15\.000/);

    const addItemCallback = findCallback(productDetail, /Tambah ke Keranjang/);
    const addItem = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction(addItemCallback),
      workspaceId,
      chat: selectedChat,
      contact,
      agent,
    });
    assert.match(addItem.text, /Ditambahkan/);
    assert.match(addItem.text, /Total: Rp 15\.000/);

    const cartView = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction('act:cart:view:v1'),
      workspaceId,
      chat: selectedChat,
      contact,
      agent,
    });
    assert.match(cartView.text, /Salty Caramel Tea x1/);

    const checkoutStartCallback = findCallback(cartView, /Checkout/);
    const checkoutSummary = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction(checkoutStartCallback),
      workspaceId,
      chat: selectedChat,
      contact,
      agent,
    });
    assert.match(checkoutSummary.text, /Ringkasan Pesanan/);
    assert.match(checkoutSummary.text, /Total: Rp 15\.000/);

    const checkoutConfirmCallback = findCallback(checkoutSummary, /Konfirmasi Pesanan/);
    const orderCreated = await telegramCommerce.handleTelegramCommerceAction({
      action: telegramCommerce.parseTelegramAction(checkoutConfirmCallback),
      workspaceId,
      chat: selectedChat,
      contact,
      agent,
    });
    assert.match(orderCreated.text, /Pesanan berhasil dibuat/);
    assert.match(orderCreated.text, /Link pembayaran/);

    const ordersAfterCheckout = await orderService.workspaceListOrders({
      workspaceId,
      outletId: outletA._id,
      paymentStatus: 'pending',
      page: 1,
      limit: 20,
      sort: '-createdAt',
    });
    assert.equal(ordersAfterCheckout.data.length, 1);

    const order = ordersAfterCheckout.data[0];
    assert.equal(order.status, 'new');
    assert.equal(order.paymentStatus, 'pending');
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].name, 'Salty Caramel Tea');
    assert.equal(order.totals.total, 15000);

    const payment = await Payment.findOne({ workspaceId, orderId: order._id });
    assert.ok(payment);
    assert.equal(payment.provider, 'midtrans');
    assert.equal(payment.status, 'pending');
    assert.match(payment.paymentUrl, /https:\/\/payments\.test\.local\/pay\/PAY-/);

    const webhookResult = await paymentWebhookService.processPaymentWebhook({
      workspaceId,
      provider: 'midtrans',
      rawBody: {
        transaction_id: `tx-${payment._id}`,
        order_id: payment.merchantReference,
        transaction_status: 'settlement',
        gross_amount: '15000',
        currency: 'IDR',
        payment_type: 'bank_transfer',
      },
      headers: {},
    });
    assert.equal(webhookResult.processed, true);

    const paidPayment = await Payment.findById(payment._id);
    assert.equal(paidPayment.status, 'paid');
    assert.equal(paidPayment.reconciliationStatus, 'matched');

    const paymentEvents = await PaymentEvent.find({ workspaceId, paymentId: payment._id });
    assert.equal(paymentEvents.length, 1);
    assert.equal(paymentEvents[0].processingStatus, 'processed');

    const paidOrders = await orderService.workspaceListOrders({
      workspaceId,
      outletId: outletA._id,
      paymentStatus: 'paid',
      page: 1,
      limit: 20,
      sort: '-createdAt',
    });
    assert.equal(paidOrders.data.length, 1);
    assert.equal(paidOrders.data[0].paymentStatus, 'paid');

    let fulfilledOrder = await orderService.transitionOrderStatus({
      workspaceId,
      orderId: order._id,
      newStatus: 'accepted',
      actor: 'Admin',
    });
    fulfilledOrder = await orderService.transitionOrderStatus({
      workspaceId,
      orderId: fulfilledOrder._id,
      newStatus: 'preparing',
      actor: 'Admin',
    });
    fulfilledOrder = await orderService.transitionOrderStatus({
      workspaceId,
      orderId: fulfilledOrder._id,
      newStatus: 'ready',
      actor: 'Admin',
    });
    fulfilledOrder = await orderService.transitionOrderStatus({
      workspaceId,
      orderId: fulfilledOrder._id,
      newStatus: 'completed',
      actor: 'Admin',
    });

    assert.equal(fulfilledOrder.status, 'completed');
    assert.equal(fulfilledOrder.paymentStatus, 'paid');
  });
});

function findCallback(message, labelPattern) {
  for (const row of message.keyboard?.inline_keyboard || []) {
    for (const button of row) {
      if (labelPattern.test(button.text)) return button.callback_data;
    }
  }
  throw new Error(`Callback button not found: ${labelPattern}`);
}
