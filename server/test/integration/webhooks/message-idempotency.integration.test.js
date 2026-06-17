import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { messagesRepository } from '../../../src/db/repositories/index.js';
import Message from '../../../src/models/Message.js';

describe('messages repository', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });

  it('createIfNotExists creates new message', async () => {
    const workspaceId = new mongoose.Types.ObjectId();
    const chatId = new mongoose.Types.ObjectId();
    const msg = await messagesRepository.createIfNotExists(workspaceId, 'pid-123', {
      chatId, workspaceId, from: 'user', text: 'Hello',
    });
    assert.ok(msg._id);
    assert.strictEqual(msg.text, 'Hello');
  });

  it('createIfNotExists returns existing message on duplicate', async () => {
    const workspaceId = new mongoose.Types.ObjectId();
    const chatId = new mongoose.Types.ObjectId();
    const first = await messagesRepository.createIfNotExists(workspaceId, 'pid-456', {
      chatId, workspaceId, from: 'user', text: 'First',
    });
    const second = await messagesRepository.createIfNotExists(workspaceId, 'pid-456', {
      chatId, workspaceId, from: 'user', text: 'Duplicate',
    });
    assert.strictEqual(String(first._id), String(second._id));
    assert.strictEqual(second.text, 'First');
  });
});
