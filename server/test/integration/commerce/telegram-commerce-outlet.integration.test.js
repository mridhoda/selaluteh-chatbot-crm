import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseTelegramAction, buildCommerceMenuMessage } from '../../../src/services/telegram-commerce.service.js';


describe('telegram commerce outlet flow', () => {
  it('parses versioned Telegram commerce callbacks', () => {
    assert.deepEqual(parseTelegramAction('act:outlet:select:outlet-1:v1'), {
      scope: 'outlet',
      action: 'select',
      id: 'outlet-1',
      version: 1,
      raw: 'act:outlet:select:outlet-1:v1',
    });
  });

  it('returns null for non-commerce callbacks', () => {
    assert.equal(parseTelegramAction('hello'), null);
  });

  it('builds commerce menu keyboard for selected outlet', () => {
    const message = buildCommerceMenuMessage({ outlet: { name: 'Outlet A' }, version: 1 });

    assert.match(message.text, /Outlet A/);
    assert.ok(message.keyboard.inline_keyboard.flat().some((button) => button.callback_data === 'act:prod:list:v1'));
    assert.ok(message.keyboard.inline_keyboard.flat().some((button) => button.callback_data === 'act:cart:view:v1'));
  });
});
