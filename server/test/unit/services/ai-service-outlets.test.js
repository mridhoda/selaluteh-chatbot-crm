import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractOutletCityFilter,
  formatOutletList,
  generateAIReply,
  isOrderStartIntent,
  shouldAskLocationForOrder,
} from '../../../src/services/ai.service.js';
import { outletsSupabaseRepository } from '../../../src/db/repositories/index.js';

describe('ai.service outlet list formatting', () => {
  const outlets = [
    { name: 'Selalu Teh Danau Murung', city: 'Tenggarong', status: 'active' },
    { name: 'Selalu Teh Dirgahayu', city: 'Samarinda', status: 'active' },
    { name: 'Selalu Teh Mangkurawang', city: 'Tenggarong', status: 'active' },
  ];

  it('extracts city filter from outlet question', () => {
    assert.equal(extractOutletCityFilter('di samarinda ada outlet apa aja'), 'samarinda');
    assert.equal(extractOutletCityFilter('outlet di Samarinda apa saja?'), 'samarinda');
  });

  it('filters outlet list by requested city', () => {
    const reply = formatOutletList(outlets, { cityFilter: 'samarinda' });

    assert.match(reply, /Selalu Teh Dirgahayu \(Samarinda\)/);
    assert.doesNotMatch(reply, /Danau Murung/);
    assert.doesNotMatch(reply, /Mangkurawang/);
  });

  it('asks current customer location before listing outlets without city or area', () => {
    const reply = formatOutletList(outlets);

    assert.match(reply, /info lokasi kamu saat ini/i);
    assert.match(reply, /Jalan Jelawat Samarinda/i);
    assert.match(reply, /link Google Maps/i);
    assert.match(reply, /listkan seluruh outlet yang ada di sekitarmu/i);
    assert.doesNotMatch(reply, /Selalu Teh Dirgahayu/);
    assert.doesNotMatch(reply, /Selalu Teh Danau Murung/);
  });

  it('treats outletnya ada apa aja as outlet list question and asks location first', async () => {
    const listMock = mock.method(outletsSupabaseRepository, 'list', async () => outlets);

    const reply = await generateAIReply({
      system: 'Kamu adalah Selkop Bot untuk Selalu Teh.',
      prompt: '',
      message: { id: 'msg-1', text: 'outletnya ada apa aja?' },
      knowledge: [],
      agent: { id: 'agent-1', workspaceId: 'workspace-1', name: 'Smoke Test Agent' },
      chat: { id: 'chat-1', workspaceId: 'workspace-1', contactId: 'contact-1' },
      history: [],
    });

    assert.equal(listMock.mock.callCount(), 1);
    assert.match(reply, /lokasi kamu saat ini/i);
    assert.doesNotMatch(reply, /Selalu Teh Dirgahayu/);
  });

  it('asks customer current location first when customer wants to order', async () => {
    const listMock = mock.method(outletsSupabaseRepository, 'list', async () => outlets);

    const reply = await generateAIReply({
      system: 'Kamu adalah Selkop Bot untuk Selalu Teh.',
      prompt: '',
      message: { id: 'msg-2', text: 'aku mau pesan teh tarik 2' },
      knowledge: [],
      agent: { id: 'agent-1', workspaceId: 'workspace-1', name: 'Smoke Test Agent' },
      chat: { id: 'chat-1', workspaceId: 'workspace-1', contactId: 'contact-1' },
      history: [],
    });

    assert.equal(listMock.mock.callCount(), 0);
    assert.match(reply, /Boleh info lokasi kamu saat ini dulu/i);
    assert.match(reply, /share location/i);
    assert.match(reply, /outlet terdekat/i);
    assert.doesNotMatch(reply, /Selalu Teh Dirgahayu/);
  });

  it('does not treat order status question as new order start', () => {
    assert.equal(isOrderStartIntent('cek status pesanan saya'), false);
    assert.equal(isOrderStartIntent('mau pesan teh tarik'), true);
    assert.equal(isOrderStartIntent('beli 2 vanilla'), true);
  });

  it('does not ask location again when a current outlet is already selected', () => {
    const userText = 'aku mau pesan teh asli 2, teh tarik vanilla 1';

    assert.equal(shouldAskLocationForOrder(userText, { currentOutletId: 'outlet-biawan' }), false);
    assert.equal(shouldAskLocationForOrder(userText, { current_outlet_id: 'outlet-biawan' }), false);
    assert.equal(shouldAskLocationForOrder(userText, {}), true);
  });
});