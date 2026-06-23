import { chatsRepository, contactsRepository, cartsRepository, productsRepository, ordersRepository, checkoutsRepository } from '../db/repositories/index.js';
import { createInlineKeyboard } from '../integrations/telegram/telegram-keyboards.js';
import { executeAIAction } from './ai-actions.service.js';
import { findActiveWorkspaceOutlet, listActiveWorkspaceOutlets } from './outlet.service.js';
import { listTelegramProductsForOutlet } from './product.service.js';
import { addItem, removeItem, clearCart, getCartSummary } from './cart.service.js';
import { createCheckout, confirmCheckout } from './checkout.service.js';
import { createOrderFromCheckout } from './order.service.js';
import { buildPaymentInstruction, createPaymentForOrder, createXenditPaymentSessionForOrder } from './payment.service.js';
import { env } from '../config/env.js';

export const COMMERCE_VERSION = 1;
const MAX_PRODUCTS_PER_PAGE = 8;

export function parseTelegramAction(data = '') {
  if (!data.startsWith('act:')) return null;
  const parts = data.split(':');
  const result = { scope: parts[1] || undefined, action: parts[2] || undefined, id: undefined, version: undefined, raw: data };
  const last = parts[parts.length - 1];

  if (last && /^v\d+$/.test(last)) {
    result.version = parseInt(last.slice(1), 10);
    const middle = parts.slice(3, parts.length - 1);
    if (middle.length > 0) result.id = middle[0];
  } else if (parts[3]) {
    result.id = parts[3];
  }

  return result;
}

export function buildCallbackKey(scope, action, id, version) {
  const v = version ?? COMMERCE_VERSION;
  const idPart = id != null ? `:${id}` : '';
  return `act:${scope}:${action}${idPart}:v${v}`;
}

function shouldExpireChatState(chat) {
  const now = new Date();
  const stateAt = chat.stateUpdatedAt || chat.updatedAt;
  if (!stateAt) return false;
  const diff = (now.getTime() - new Date(stateAt).getTime()) / 1000;
  return diff > 3600;
}

export async function buildOutletSelectionMessage({ workspaceId }) {
  const outlets = await listActiveWorkspaceOutlets(workspaceId);
  if (!outlets.length) {
    return {
      text: 'Belum ada outlet aktif yang tersedia. Mohon hubungi admin.',
      keyboard: null,
    };
  }

  const ver = COMMERCE_VERSION;
  return {
    text: 'Halo kak 👋 Pilih outlet dulu ya:',
    keyboard: createInlineKeyboard(
      outlets.map((outlet) => ([{
        text: outlet.name,
        callback_data: `act:outlet:select:${outlet.id}:v${ver}`,
      }])),
    ),
  };
}

export function buildCommerceMenuMessage({ outlet, version }) {
  const ver = version ?? COMMERCE_VERSION;
  return {
    text: `Kamu memilih ${outlet.name} ✅\n\nSilakan pilih menu:`,
    keyboard: createInlineKeyboard([
      [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
      [{ text: 'Keranjang', callback_data: `${buildCallbackKey('cart', 'view', null, ver)}` }],
      [{ text: 'Status Pesanan', callback_data: `${buildCallbackKey('order', 'status', null, ver)}` }],
      [{ text: 'Ubah Outlet', callback_data: `${buildCallbackKey('outlet', 'change', null, ver)}` }],
    ]),
  };
}

export async function selectOutletForChat({ workspaceId, chat, contact, agent, outletId, chatMessageId = null }) {
  const outlet = await findActiveWorkspaceOutlet({ workspaceId, outletId });
  const result = await executeAIAction({
    workspaceId,
    chatId: chat.id,
    chatMessageId,
    agentId: agent?.id || null,
    actionType: 'select_outlet',
    input: { outletId },
    executor: async () => {
      await chatsRepository.setCurrentOutlet(chat.id, outlet.id);
      await contactsRepository.setLastOutlet(contact.id, outlet.id);
      return { outletId: outlet.id, outletName: outlet.name };
    },
  });

  if (!result.valid) {
    const err = new Error(result.validationErrors.join(', ') || 'Outlet selection rejected');
    err.status = 400;
    throw err;
  }

  return { outlet, message: buildCommerceMenuMessage({ outlet }) };
}

export async function buildProductDetailMessage({ workspaceId, outletId, product, contactId, chatId, page = 0 }) {
  const price = product.outletAvailability?.priceOverride ?? product.basePrice;
  const lines = [`${product.name}\n`, `Harga: Rp ${Number(price || 0).toLocaleString('id-ID')}`];
  if (product.shortDescription) lines.push('', product.shortDescription);

  const ver = COMMERCE_VERSION;
  return {
    text: lines.join('\n'),
    keyboard: createInlineKeyboard([
      [{ text: `Tambah ke Keranjang (+1)`, callback_data: `${buildCallbackKey('add', '1', product.id, ver)}` }],
      [{ text: `Tambah 3`, callback_data: `${buildCallbackKey('add', '3', product.id, ver)}` }],
      [{ text: 'Lihat Keranjang', callback_data: `${buildCallbackKey('cart', 'view', null, ver)}` }],
      [{ text: 'Kembali ke Produk', callback_data: `${buildCallbackKey('prod', 'list', String(page), ver)}` }],
    ]),
  };
}

export async function buildCartViewMessage({ workspaceId, contactId, outletId, chatId }) {
  const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId, outletId });
  if (!cart || !cart.items.length) {
    const ver = COMMERCE_VERSION;
    return {
      text: 'Keranjang belanja kamu kosong.',
      keyboard: createInlineKeyboard([
        [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
      ]),
    };
  }

  const summary = getCartSummary(cart);
  const lines = ['🛒 Keranjang Belanja:\n'];
  for (const item of summary.items) {
    lines.push(`${item.name} x${item.quantity} = Rp ${item.subtotal.toLocaleString('id-ID')}`);
  }
  lines.push('', `Total: Rp ${summary.total.toLocaleString('id-ID')}`);

  const ver = COMMERCE_VERSION;
  const itemButtons = summary.items.map((item) => ([
    { text: `Hapus ${item.name}`, callback_data: `${buildCallbackKey('remove', item.productId.toString(), null, ver)}` },
  ]));

  return {
    text: lines.join('\n'),
    keyboard: createInlineKeyboard([
      ...itemButtons,
      [{ text: 'Bersihkan Keranjang', callback_data: `${buildCallbackKey('cart', 'clear', null, ver)}` }],
      [{ text: 'Checkout', callback_data: `${buildCallbackKey('checkout', 'start', null, ver)}` }],
      [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
    ]),
  };
}

export async function buildProductListMessage({ workspaceId, outletId, page = 0 }) {
  if (!outletId) return buildOutletSelectionMessage({ workspaceId });

  const result = await listTelegramProductsForOutlet({ workspaceId, outletId, page, limit: MAX_PRODUCTS_PER_PAGE });
  const { products, pagination } = result;
  if (!products.length) {
    const ver = COMMERCE_VERSION;
    return {
      text: 'Belum ada produk yang tersedia di outlet ini.',
      keyboard: createInlineKeyboard([[{ text: 'Ubah Outlet', callback_data: `${buildCallbackKey('outlet', 'change', null, ver)}` }]]),
    };
  }

  const ver = COMMERCE_VERSION;
  const lines = products.map((product, index) => {
    const price = product.outletAvailability?.priceOverride ?? product.basePrice;
    return `${pagination.page * MAX_PRODUCTS_PER_PAGE + index + 1}. ${product.name} - Rp ${Number(price || 0).toLocaleString('id-ID')}`;
  });

  const navButtons = [];
  if (pagination.hasPrev) {
    navButtons.push({ text: '⬅️ Sebelumnya', callback_data: `${buildCallbackKey('prod', 'list', String(page - 1), ver)}` });
  }
  if (pagination.hasNext) {
    navButtons.push({ text: 'Selanjutnya ➡️', callback_data: `${buildCallbackKey('prod', 'list', String(page + 1), ver)}` });
  }

  const productButtons = products.map((product) => ([{
    text: product.name,
    callback_data: `${buildCallbackKey('prod', 'detail', String(product.id), ver)}`,
  }]));

  const keyboardRows = [...productButtons];
  if (navButtons.length) {
    keyboardRows.push(navButtons);
  }
  keyboardRows.push([{ text: 'Ubah Outlet', callback_data: `${buildCallbackKey('outlet', 'change', null, ver)}` }]);

  return {
    text: `Produk tersedia (${pagination.page + 1}/${pagination.totalPages}):\n\n${lines.join('\n')}`,
    keyboard: createInlineKeyboard(keyboardRows),
  };
}

export async function buildOrderStatusMessage({ workspaceId, contactId, chatId }) {
  const ver = COMMERCE_VERSION;
  const orders = await ordersRepository.findList({
    workspaceId, contactId, chatId,
  });

  if (!orders || !orders.length) {
    return {
      text: 'Kamu belum memiliki pesanan.\n\nYuk, mulai belanja!',
      keyboard: createInlineKeyboard([
        [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
      ]),
    };
  }

  const lastOrders = orders.slice(0, 5);
  const lines = ['📋 Status Pesanan Terakhir:\n'];
  for (const order of lastOrders) {
    const statusLabels = {
      new: '📝 Baru', accepted: '✅ Diterima', preparing: '👨‍🍳 Disiapkan',
      ready: '🎉 Siap Diambil', completed: '✔️ Selesai', cancelled: '❌ Dibatalkan',
    };
    const payLabels = {
      unpaid: 'Belum Bayar', pending: 'Menunggu Konfirmasi', paid: 'Sudah Bayar',
      failed: 'Gagal', expired: 'Kadaluarsa', refunded: 'Dikembalikan',
    };
    const statusLabel = statusLabels[order.status] || order.status;
    const payLabel = payLabels[order.paymentStatus] || order.paymentStatus;
    const total = (order.totals?.total || 0).toLocaleString('id-ID');
    lines.push(`${order.orderNumber || '#' + String(order.id).slice(-8)}`);
    lines.push(`   Status: ${statusLabel} | ${payLabel}`);
    lines.push(`   Total: Rp ${total}`);
    if (order.items?.length) {
      lines.push(`   Items: ${order.items.map(i => i.name).join(', ')}`);
    }
    lines.push('');
  }

  return {
    text: lines.join('\n'),
    keyboard: createInlineKeyboard([
      [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
      [{ text: 'Kembali ke Menu', callback_data: `${buildCallbackKey('outlet', 'menu', null, ver)}` }],
    ]),
  };
}

export async function handleTelegramCommerceAction({ action, workspaceId, chat, contact, agent, chatMessageId = null }) {
  if (!action) return null;

  const currentVer = action.version ?? COMMERCE_VERSION;
  if (currentVer < COMMERCE_VERSION) {
    return {
      text: 'Menu sudah tidak berlaku. Silakan pilih menu terbaru.',
      keyboard: null,
    };
  }

  if (shouldExpireChatState(chat)) {
    chat.currentOutletId = null;
  }

  if (action.scope === 'outlet' && action.action === 'change') {
    return buildOutletSelectionMessage({ workspaceId });
  }

  if (action.scope === 'outlet' && action.action === 'menu') {
    if (!chat.currentOutletId) return buildOutletSelectionMessage({ workspaceId });
    const outlet = await findActiveWorkspaceOutlet({ workspaceId, outletId: chat.currentOutletId });
    if (!outlet) {
      chat.currentOutletId = null;
      return { text: 'Outlet tidak ditemukan. Silakan pilih ulang.', keyboard: null };
    }
    return buildCommerceMenuMessage({ outlet });
  }

  if (action.scope === 'outlet' && action.action === 'select' && action.id) {
    const outlet = await findActiveWorkspaceOutlet({ workspaceId, outletId: action.id });
    if (!outlet) {
      return { text: 'Outlet tidak lagi tersedia. Silakan pilih yang lain.', keyboard: null };
    }
    const { message } = await selectOutletForChat({
      workspaceId, chat, contact, agent, outletId: action.id, chatMessageId,
    });
    return message;
  }

  if (action.scope === 'outlet' && action.action) {
    const { message } = await selectOutletForChat({
      workspaceId, chat, contact, agent, outletId: action.action, chatMessageId,
    });
    return message;
  }

  if (action.scope === 'prod' && action.action === 'list') {
    const page = parseInt(action.id) || 0;
    return buildProductListMessage({ workspaceId, outletId: chat.currentOutletId, page });
  }

  if (action.scope === 'prod' && action.action === 'detail' && action.id) {
    const page = 0;
    const result = await listTelegramProductsForOutlet({
      workspaceId, outletId: chat.currentOutletId, page, limit: 1000,
    });
    const product = result.products.find((p) => String(p.id) === action.id);
    if (!product) return { text: 'Produk tidak tersedia lagi.', keyboard: null };
    return buildProductDetailMessage({
      workspaceId, outletId: chat.currentOutletId, product, contactId: contact.id, chatId: chat.id, page,
    });
  }

  if (action.scope === 'prod' && action.id) {
    const result = await listTelegramProductsForOutlet({
      workspaceId, outletId: chat.currentOutletId, page: 0, limit: 1000,
    });
    const product = result.products.find((p) => String(p.id) === action.id);
    if (!product) return { text: 'Produk tidak ditemukan.', keyboard: null };
    return buildProductDetailMessage({
      workspaceId, outletId: chat.currentOutletId, product, contactId: contact.id, chatId: chat.id, page: 0,
    });
  }

  if (action.scope === 'add') {
    const productId = action.id || action.action;
    if (!chat.currentOutletId) return buildOutletSelectionMessage({ workspaceId });
    const quantity = action.action === '3' ? 3 : 1;
    try {
      const availableResult = await listTelegramProductsForOutlet({
        workspaceId, outletId: chat.currentOutletId, page: 0, limit: 1000,
      });
      const productExists = availableResult.products.find((p) => String(p.id) === productId);
      if (!productExists) {
        return { text: 'Produk tidak tersedia di outlet ini.', keyboard: null };
      }

      await addItem({
        workspaceId, outletId: chat.currentOutletId, contactId: contact.id, chatId: chat.id, platformType: 'telegram',
        productId, quantity,
      });
      const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId: contact.id, outletId: chat.currentOutletId });
      const summary = getCartSummary(cart);
      const ver = COMMERCE_VERSION;
      return {
        text: `✅ Ditambahkan! Keranjang: ${summary.itemCount} item, Total: Rp ${summary.total.toLocaleString('id-ID')}`,
        keyboard: createInlineKeyboard([
          [{ text: 'Lihat Keranjang', callback_data: `${buildCallbackKey('cart', 'view', null, ver)}` }],
          [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
        ]),
      };
    } catch (err) {
      return { text: `Gagal menambahkan: ${err.message}`, keyboard: null };
    }
  }

  if (action.scope === 'cart' && action.action === 'view') {
    return buildCartViewMessage({ workspaceId, contactId: contact.id, outletId: chat.currentOutletId, chatId: chat.id });
  }

  if (action.scope === 'cart' && action.action === 'clear') {
    const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId: contact.id, outletId: chat.currentOutletId });
    if (cart) {
      await clearCart({ workspaceId, cartId: cart.id });
    }
    const ver = COMMERCE_VERSION;
    return {
      text: 'Keranjang sudah dibersihkan.',
      keyboard: createInlineKeyboard([[{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }]]),
    };
  }

  if (action.scope === 'remove') {
    const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId: contact.id, outletId: chat.currentOutletId });
    if (cart) {
      await removeItem({ workspaceId, cartId: cart.id, productId: action.id });
    }
    return buildCartViewMessage({ workspaceId, contactId: contact.id, outletId: chat.currentOutletId, chatId: chat.id });
  }

  if (action.scope === 'checkout' && action.action === 'start') {
    if (!chat.currentOutletId) return buildOutletSelectionMessage({ workspaceId });
    const idempotencyKey = `tg_checkout_${chat.id}_${Date.now()}`;
    try {
      const checkout = await createCheckout({
        workspaceId, outletId: chat.currentOutletId, contactId: contact.id, chatId: chat.id,
        idempotencyKey,
      });
      const lines = ['🛍️ Ringkasan Pesanan:\n'];
      for (const item of checkout.items) {
        lines.push(`${item.name} x${item.quantity} = Rp ${item.subtotal.toLocaleString('id-ID')}`);
      }
      lines.push('', `Total: Rp ${checkout.total.toLocaleString('id-ID')}`, '');
      const ver = COMMERCE_VERSION;
      return {
        text: lines.join('\n'),
        keyboard: createInlineKeyboard([
          [{ text: '✅ Konfirmasi Pesanan', callback_data: `${buildCallbackKey('checkout', 'confirm', String(checkout.id), ver)}` }],
          [{ text: 'Kembali ke Keranjang', callback_data: `${buildCallbackKey('cart', 'view', null, ver)}` }],
        ]),
      };
    } catch (err) {
      return { text: `Gagal memproses checkout: ${err.message}`, keyboard: null };
    }
  }

  if (action.scope === 'checkout' && action.action === 'confirm') {
    const checkoutId = action.id;
    try {
      const confirmed = await confirmCheckout({ workspaceId, checkoutId });
      // Pass null for user: this is a Telegram (bot) context, not an HTTP user session.
      // assertOutletAccess is only needed for human admin actions, not bot-triggered orders.
      const order = await createOrderFromCheckout({ workspaceId, checkout: confirmed, user: null });

      let payment;
      let paymentInstruction;
      if (env.paymentProvider === 'xendit') {
        payment = await createXenditPaymentSessionForOrder({
          workspaceId,
          orderId: order.id,
          customer: {
            name: contact?.name || '',
            phone: contact?.phone || contact?.platformAccountId || '',
          },
        });
        paymentInstruction = `🔗 *Link Pembayaran:* ${payment.paymentUrl || payment.paymentLink}\n\nSilakan klik link di atas untuk menyelesaikan pembayaran. Link berlaku ${payment.expiresAt ? 'hingga ' + new Date(payment.expiresAt).toLocaleString('id-ID') : '30 menit'}.`;
      } else {
        payment = await createPaymentForOrder({
          workspaceId,
          orderId: order.id,
          customer: {
            name: contact?.name || '',
            phone: contact?.phone || contact?.platformAccountId || '',
          },
        });
        paymentInstruction = buildPaymentInstruction(payment);
      }
      await checkoutsRepository.updateStatus({ workspaceId, checkoutId, status: 'converted' });
      const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId: contact.id, outletId: chat.currentOutletId });
      if (cart) {
        await cartsRepository.setStatus({ workspaceId, cartId: cart.id, status: 'converted' });
      }
      const ver = COMMERCE_VERSION;
      return {
        text: `✅ Pesanan berhasil dibuat!\n\nNo. Pesanan: ${order.orderNumber}\nTotal: Rp ${order.totals.total.toLocaleString('id-ID')}\n\n${paymentInstruction}\n\nKami akan segera proses pesananmu.`,
        keyboard: createInlineKeyboard([
          [{ text: 'Lihat Produk', callback_data: `${buildCallbackKey('prod', 'list', null, ver)}` }],
          [{ text: 'Status Pesanan', callback_data: `${buildCallbackKey('order', 'status', null, ver)}` }],
        ]),
      };
    } catch (err) {
      return { text: `Gagal konfirmasi: ${err.message}`, keyboard: null };
    }
  }

  if (action.scope === 'order' && action.action === 'status') {
    return buildOrderStatusMessage({ workspaceId, contactId: contact.id, chatId: chat.id });
  }

  if ((action.scope === 'cart' || action.scope === 'checkout' || action.scope === 'add') && !chat.currentOutletId) {
    return buildOutletSelectionMessage({ workspaceId });
  }

  return null;
}
