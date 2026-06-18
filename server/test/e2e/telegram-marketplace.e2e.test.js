import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseTelegramAction, buildCommerceMenuMessage } from '../../src/services/telegram-commerce.service.js';
import { cartsRepository, checkoutsRepository, ordersRepository, paymentsRepository } from '../../src/db/repositories/index.js';


describe('E2E smoke: Telegram marketplace purchase flow contract', () => {
  it('keeps callback parser and menu contract stable', () => {
    const action = parseTelegramAction('act:checkout:confirm:checkout-1:v1');
    assert.deepEqual(action, {
      scope: 'checkout',
      action: 'confirm',
      id: 'checkout-1',
      version: 1,
      raw: 'act:checkout:confirm:checkout-1:v1',
    });

    const menu = buildCommerceMenuMessage({ outlet: { name: 'Outlet A' }, version: 1 });
    assert.match(menu.text, /Outlet A/);
  });

  it('has Supabase repositories required by the purchase flow wired in registry', () => {
    assert.equal(typeof cartsRepository.findActiveByContact, 'function');
    assert.equal(typeof cartsRepository.addItem, 'function');
    assert.equal(typeof checkoutsRepository.create, 'function');
    assert.equal(typeof ordersRepository.create, 'function');
    assert.equal(typeof paymentsRepository.create, 'function');
  });
});
