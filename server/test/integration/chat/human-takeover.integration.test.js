import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { acquireTakeover, releaseTakeover, isTakeoverActive } from '../../../src/services/human-takeover.service.js';
import Chat from '../../../src/models/Chat.js';

describe('human takeover service', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const userId2 = new mongoose.Types.ObjectId();

  let chat;

  beforeEach(async () => {
    chat = await Chat.create({ workspaceId, userId, contactId: new mongoose.Types.ObjectId(), platformType: 'telegram' });
  });

  it('acquires takeover on free chat', async () => {
    const result = await acquireTakeover({ chatId: chat._id, userId });
    assert.strictEqual(String(result.takeoverBy), String(userId));
    assert.strictEqual(result.isEscalated, true);
  });

  it('rejects concurrent takeover', async () => {
    await acquireTakeover({ chatId: chat._id, userId });
    await assert.rejects(
      () => acquireTakeover({ chatId: chat._id, userId: userId2 }),
      { code: 'TAKEOVER_CONFLICT' },
    );
  });

  it('release releases takeover', async () => {
    await acquireTakeover({ chatId: chat._id, userId });
    const released = await releaseTakeover({ chatId: chat._id, userId });
    assert.strictEqual(released.takeoverBy, null);
    assert.strictEqual(released.isEscalated, false);
  });

  it('isTakeoverActive returns true/false', async () => {
    assert.strictEqual(isTakeoverActive(chat), false);
    const acquired = await acquireTakeover({ chatId: chat._id, userId });
    assert.strictEqual(isTakeoverActive(acquired), true);
  });
});
