import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import {
  aiActionsRepository,
  cartsRepository,
  chatsRepository,
  contactsRepository,
  outletsSupabaseRepository,
  productsRepository,
} from '../../../src/db/repositories/index.js';
import { selectOutletForChat } from '../../../src/services/telegram-commerce.service.js';

describe('telegram commerce selected outlet flow', () => {
  it('shows text menu immediately after selecting an outlet without product buttons', async () => {
    mock.method(outletsSupabaseRepository, 'findById', async () => ({
      id: 'outlet-1',
      name: 'Selalu Teh Timbau',
      status: 'active',
    }));
    mock.method(aiActionsRepository, 'create', async () => ({ id: 'action-1' }));
    mock.method(aiActionsRepository, 'markValidated', async () => ({ id: 'action-1' }));
    mock.method(aiActionsRepository, 'markExecuted', async () => ({ id: 'action-1', status: 'executed' }));
    mock.method(cartsRepository, 'expireActiveByContactExceptOutlet', async () => null);
    mock.method(chatsRepository, 'setCurrentOutlet', async () => null);
    mock.method(chatsRepository, 'update', async ({ updates }) => ({ metadata: updates.metadata }));
    mock.method(contactsRepository, 'setLastOutlet', async () => null);
    mock.method(productsRepository, 'findProducts', async () => ([
      { id: 'product-1', name: 'Original Tea', basePrice: 8000 },
      { id: 'product-2', name: 'Thai Tea', basePrice: 12000 },
    ]));

    const chat = { id: 'chat-1', metadata: { latestOutletRecommendation: { outletId: 'outlet-1' } } };
    const contact = { id: 'contact-1' };
    const { message } = await selectOutletForChat({
      workspaceId: 'workspace-1',
      chat,
      contact,
      agent: { id: 'agent-1' },
      outletId: 'outlet-1',
    });

    assert.match(message.text, /Kamu memilih Selalu Teh Timbau/);
    assert.match(message.text, /Berikut menu yang tersedia di Selalu Teh Timbau/);
    assert.match(message.text, /\*\*1\. Original Tea\*\* — Rp 8\.000/);
    assert.match(message.text, /\*\*2\. Thai Tea\*\* — Rp 12\.000/);
    assert.equal(message.keyboard, null);
    assert.equal(chat.currentOutletId, 'outlet-1');
    assert.equal(chat.metadata.latestOutletRecommendation, undefined);
    assert.equal(contact.lastOutletId, 'outlet-1');
  });
});
