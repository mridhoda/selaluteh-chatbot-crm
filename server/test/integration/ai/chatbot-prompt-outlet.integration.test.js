import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import { generateAIReply } from '../../../src/services/ai.service.js';
import { outletsSupabaseRepository } from '../../../src/db/repositories/index.js';

describe('AI chatbot prompt automation - outlet city context', () => {
  it('answers a user prompt about Samarinda outlets using only Samarinda outlets', async () => {
    const listMock = mock.method(outletsSupabaseRepository, 'list', async () => ([
      {
        id: 'outlet-tgr-1',
        name: 'Selalu Teh Danau Murung',
        city: 'Tenggarong',
        status: 'active',
      },
      {
        id: 'outlet-smd-1',
        name: 'Selalu Teh Dirgahayu',
        city: 'Samarinda',
        status: 'active',
      },
      {
        id: 'outlet-tgr-2',
        name: 'Selalu Teh Mangkurawang',
        city: 'Tenggarong',
        status: 'active',
      },
    ]));

    const reply = await generateAIReply({
      system: 'Kamu adalah Selkop Bot untuk Selalu Teh.',
      prompt: '',
      message: {
        id: 'msg-1',
        text: 'di samarinda ada outlet apa aja',
      },
      knowledge: [],
      agent: {
        id: 'agent-1',
        workspaceId: 'workspace-1',
        name: 'Smoke Test Agent',
      },
      chat: {
        id: 'chat-1',
        workspaceId: 'workspace-1',
        contactId: 'contact-1',
      },
      history: [],
    });

    assert.equal(listMock.mock.callCount(), 1);
    assert.equal(typeof reply, 'string');
    assert.match(reply, /Outlet Selalu Teh di samarinda:/i);
    assert.match(reply, /Selalu Teh Dirgahayu \(Samarinda\)/);
    assert.doesNotMatch(reply, /Danau Murung/);
    assert.doesNotMatch(reply, /Mangkurawang/);
  });

  it('does not dump all outlets when user asks outlets without current location or city', async () => {
    const listMock = mock.method(outletsSupabaseRepository, 'list', async () => ([
      {
        id: 'outlet-tgr-1',
        name: 'Selalu Teh Danau Murung',
        city: 'Tenggarong',
        status: 'active',
      },
      {
        id: 'outlet-smd-1',
        name: 'Selalu Teh Dirgahayu',
        city: 'Samarinda',
        status: 'active',
      },
    ]));

    const reply = await generateAIReply({
      system: 'Kamu adalah Selkop Bot untuk Selalu Teh.',
      prompt: '',
      message: {
        id: 'msg-2',
        text: 'outletnya ada apa aja?',
      },
      knowledge: [],
      agent: {
        id: 'agent-1',
        workspaceId: 'workspace-1',
        name: 'Smoke Test Agent',
      },
      chat: {
        id: 'chat-1',
        workspaceId: 'workspace-1',
        contactId: 'contact-1',
      },
      history: [],
    });

    assert.equal(listMock.mock.callCount(), 1);
    assert.equal(typeof reply, 'string');
    assert.match(reply, /lokasi kamu saat ini/i);
    assert.match(reply, /link Google Maps/i);
    assert.match(reply, /listkan seluruh outlet yang ada di sekitarmu/i);
    assert.doesNotMatch(reply, /Selalu Teh Dirgahayu/);
    assert.doesNotMatch(reply, /Danau Murung/);
  });
});