import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import AIAction from '../../../src/models/AIAction.js';
import Chat from '../../../src/models/Chat.js';
import Contact from '../../../src/models/Contact.js';
import Outlet from '../../../src/models/Outlet.js';
import Product from '../../../src/models/Product.js';
import ProductOutletAvailability from '../../../src/models/ProductOutletAvailability.js';
import {
  buildOutletSelectionMessage,
  buildProductListMessage,
  handleTelegramCommerceAction,
  parseTelegramAction,
  selectOutletForChat,
} from '../../../src/services/telegram-commerce.service.js';
import { listTelegramProductsForOutlet } from '../../../src/services/product.service.js';
import { clearTestDb, connectTestDb, disconnectTestDb, objectId } from '../../helpers/mongoMemory.js';

describe('Telegram outlet commerce flow', () => {
  before(connectTestDb);
  afterEach(clearTestDb);
  after(disconnectTestDb);

  it('parses compact Telegram action callback data', () => {
    assert.deepEqual(parseTelegramAction('act:outlet:abc123'), {
      scope: 'outlet',
      action: 'abc123',
      id: undefined,
      version: undefined,
      raw: 'act:outlet:abc123',
    });
    assert.equal(parseTelegramAction('hello'), null);
  });

  it('builds outlet selection message with only active outlets', async () => {
    const workspaceId = objectId();
    await Outlet.create({ workspaceId, name: 'Bontang', code: 'BTG', status: 'active' });
    await Outlet.create({ workspaceId, name: 'Archived', code: 'ARC', status: 'archived' });

    const message = await buildOutletSelectionMessage({ workspaceId });

    assert.match(message.text, /Pilih outlet/);
    assert.equal(message.keyboard.inline_keyboard.length, 1);
    assert.equal(message.keyboard.inline_keyboard[0][0].text, 'Bontang');
  });

  it('selects outlet and stores chat/contact outlet context with audit action', async () => {
    const workspaceId = objectId();
    const { chat, contact, agent } = await createChatFixture({ workspaceId });
    const outlet = await Outlet.create({ workspaceId, name: 'Samarinda', code: 'SMD', status: 'active' });

    const result = await selectOutletForChat({
      workspaceId,
      chat,
      contact,
      agent,
      outletId: outlet._id,
    });

    const updatedChat = await Chat.findById(chat._id);
    const updatedContact = await Contact.findById(contact._id);
    const action = await AIAction.findOne({ workspaceId, actionType: 'select_outlet' });

    assert.equal(result.outlet.name, 'Samarinda');
    assert.equal(String(updatedChat.currentOutletId), String(outlet._id));
    assert.equal(String(updatedContact.lastOutletId), String(outlet._id));
    assert.equal(action.status, 'executed');
  });

  it('blocks product listing without outlet context by returning outlet selection message', async () => {
    const workspaceId = objectId();
    const { chat, contact, agent } = await createChatFixture({ workspaceId });
    await Outlet.create({ workspaceId, name: 'Tenggarong', code: 'TGR', status: 'active' });

    const response = await handleTelegramCommerceAction({
      action: parseTelegramAction('act:prod:list'),
      workspaceId,
      chat,
      contact,
      agent,
    });

    assert.match(response.text, /Pilih outlet/);
  });

  it('lists only products available at selected outlet', async () => {
    const workspaceId = objectId();
    const outletA = await Outlet.create({ workspaceId, name: 'Outlet A', code: 'A', status: 'active' });
    const outletB = await Outlet.create({ workspaceId, name: 'Outlet B', code: 'B', status: 'active' });
    const available = await Product.create({ workspaceId, name: 'Salty Caramel', slug: 'salty-caramel', basePrice: 15000, isActive: true });
    const unavailable = await Product.create({ workspaceId, name: 'Matcha', slug: 'matcha', basePrice: 16000, isActive: true });

    await ProductOutletAvailability.create({
      workspaceId,
      productId: available._id,
      outletId: outletA._id,
      isAvailable: true,
      status: 'active',
    });
    await ProductOutletAvailability.create({
      workspaceId,
      productId: unavailable._id,
      outletId: outletB._id,
      isAvailable: true,
      status: 'active',
    });

    const result = await listTelegramProductsForOutlet({ workspaceId, outletId: outletA._id });
    const products = result.products;
    const message = await buildProductListMessage({ workspaceId, outletId: outletA._id });

    assert.deepEqual(products.map((product) => product.name), ['Salty Caramel']);
    assert.match(message.text, /Salty Caramel/);
    assert.doesNotMatch(message.text, /Matcha/);
  });

  it('rejects customer-facing product list without outlet id', async () => {
    await assert.rejects(
      () => listTelegramProductsForOutlet({ workspaceId: objectId() }),
      /outlet_id is required/,
    );
  });
});

async function createChatFixture({ workspaceId }) {
  const userId = objectId();
  const agent = { _id: objectId(), workspaceId };
  const contact = await Contact.create({
    userId,
    workspaceId,
    name: 'Customer',
    platformType: 'telegram',
    platformAccountId: '12345',
  });
  const chat = await Chat.create({
    userId,
    workspaceId,
    agentId: agent._id,
    contactId: contact._id,
    platformId: objectId(),
    platformType: 'telegram',
  });

  return { chat, contact, agent };
}
