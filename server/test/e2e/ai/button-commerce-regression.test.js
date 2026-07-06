import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildCallbackKey,
  buildCommerceMenuMessage,
  buildOutletRecommendationActionButtons,
  buildOutletRecommendationKeyboard,
  buildSingleOutletConfirmationKeyboard,
  getLatestRecommendedOutletId,
  getLatestRecommendedOutlets,
  getRecommendedOutletIdFromTextSelection,
  isOutletConfirmationText,
  buildProductDetailMessage,
  parseTelegramAction,
} from '../../../src/services/telegram-commerce.service.js';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../..');

describe('AISG button-commerce regression baseline', () => {
  it('preserves Telegram callback parser and commerce menu buttons', () => {
    assert.deepEqual(parseTelegramAction('act:checkout:confirm:checkout-1:v1'), {
      scope: 'checkout',
      action: 'confirm',
      id: 'checkout-1',
      version: 1,
      raw: 'act:checkout:confirm:checkout-1:v1',
    });

    assert.equal(buildCallbackKey('add', '3', 'product-1', 1), 'act:add:3:product-1:v1');

    const menu = buildCommerceMenuMessage({ outlet: { name: 'Outlet A' }, version: 1 });
    assert.match(menu.text, /Outlet A/);
    assert.deepEqual(menu.keyboard.inline_keyboard.map((row) => row[0].callback_data), [
      'act:prod:list:v1',
      'act:cart:view:v1',
      'act:order:status:v1',
      'act:outlet:change:v1',
    ]);
  });

  it('preserves Telegram product detail add-to-cart buttons', async () => {
    const detail = await buildProductDetailMessage({
      workspaceId: 'ws-1',
      outletId: 'outlet-1',
      contactId: 'contact-1',
      chatId: 'chat-1',
      product: {
        id: 'product-1',
        name: 'Teh Susu',
        basePrice: 12000,
        shortDescription: 'Manis dan segar',
      },
    });

    assert.match(detail.text, /Teh Susu/);
    assert.match(detail.text, /12\.000/);
    assert.deepEqual(detail.keyboard.inline_keyboard.map((row) => row[0].callback_data), [
      'act:add:1:product-1:v1',
      'act:add:3:product-1:v1',
      'act:cart:view:v1',
      'act:prod:list:0:v1',
    ]);
  });

  it('builds dynamic outlet recommendation buttons using commerce select callbacks', () => {
    const keyboard = buildOutletRecommendationKeyboard([
      { outletId: 'timbau', name: 'Selalu Teh - 58 Timbau' },
      { outletId: 'danau-murung', name: 'Selalu Teh - 1 Danau Murung' },
      { outletId: 'sudirman', name: 'Selalu Teh - 2 Sudirman' },
    ], 1);

    assert.deepEqual(keyboard.inline_keyboard.map((row) => row[0].text), [
      'Selalu Teh - 58 Timbau',
      'Selalu Teh - 1 Danau Murung',
      'Selalu Teh - 2 Sudirman',
    ]);
    assert.deepEqual(keyboard.inline_keyboard.map((row) => row[0].callback_data), [
      'act:outlet:select:timbau:v1',
      'act:outlet:select:danau-murung:v1',
      'act:outlet:select:sudirman:v1',
    ]);
    assert.deepEqual(buildOutletRecommendationActionButtons([
      { outletId: 'timbau', name: 'Selalu Teh - 58 Timbau' },
      { outletId: 'danau-murung', name: 'Selalu Teh - 1 Danau Murung' },
    ], 1).map((button) => button.id), [
      'act:outlet:select:timbau:v1',
      'act:outlet:select:danau-murung:v1',
    ]);
  });

  it('recognizes outlet confirmation text and builds single outlet confirmation button', () => {
    assert.equal(isOutletConfirmationText('Oke setuju'), true);
    assert.equal(isOutletConfirmationText('iya ambil outlet itu'), true);
    assert.equal(isOutletConfirmationText('menu apa saja?'), false);

    const chat = {
      metadata: {
        latestOutletRecommendation: {
          outletId: 'timbau',
          recommendedOutlets: [{ outletId: 'timbau', name: 'Selalu Teh - 58 Timbau' }],
        },
      },
    };
    assert.equal(getLatestRecommendedOutletId(chat), 'timbau');
    assert.deepEqual(buildSingleOutletConfirmationKeyboard('timbau', 1).inline_keyboard[0][0], {
      text: 'Ambil dari outlet ini',
      callback_data: 'act:outlet:select:timbau:v1',
    });
    assert.deepEqual(getLatestRecommendedOutlets(chat).map((outlet) => outlet.outletId), ['timbau']);
  });

  it('maps numbered outlet text replies to the selected recommendation', () => {
    const chat = {
      metadata: {
        latestOutletRecommendation: {
          outletId: 'danau-murung',
          recommendedOutlets: [
            { outletId: 'danau-murung', name: 'Selalu Teh - 1 Danau Murung' },
            { outletId: 'timbau', name: 'Selalu Teh - 58 Timbau' },
            { outletId: 'sudirman', name: 'Selalu Teh - 2 Sudirman' },
          ],
        },
      },
    };

    assert.equal(getRecommendedOutletIdFromTextSelection('nomor 1', chat), 'danau-murung');
    assert.equal(getRecommendedOutletIdFromTextSelection('pilih 2', chat), 'timbau');
    assert.equal(getRecommendedOutletIdFromTextSelection('yang ketiga', chat), 'sudirman');
    assert.equal(getRecommendedOutletIdFromTextSelection('nomor 9', chat), null);
  });

  it('preserves WhatsApp interactive commerce action contract', () => {
    const source = readFileSync(resolve(PROJECT_ROOT, 'src/routes/webhooks/meta.js'), 'utf8');

    assert.match(source, /export async function handleWhatsAppCommerceAction/);
    assert.match(source, /wa_cart_view/);
    assert.match(source, /wa_checkout_confirm_/);
    assert.match(source, /confirmCheckout\(\{ workspaceId, checkoutId \}\)/);
    assert.match(source, /createOrderFromCheckout\(\{ workspaceId, checkout: confirmed, user: null \}\)/);
  });
});
