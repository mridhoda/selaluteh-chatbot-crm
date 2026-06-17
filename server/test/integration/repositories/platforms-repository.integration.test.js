import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { platformsRepository } from '../../../src/db/repositories/index.js';
import Platform from '../../../src/models/Platform.js';

describe('platforms repository', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  it('create stores encrypted credentials and returns sanitized', async () => {
    const platform = await platformsRepository.create({
      workspaceId, userId,
      payload: { type: 'telegram', label: 'Test Bot', token: 'secret-token', appSecret: 'app-secret' },
    });
    assert.ok(platform);
    assert.strictEqual(platform.token, 'configured');
    assert.strictEqual(platform.appSecret, 'configured');
    assert.strictEqual(platform.status, 'pending_setup');
    assert.strictEqual(platform.health, 'not_configured');
  });

  it('list returns sanitized platforms without credentials', async () => {
    await platformsRepository.create({ workspaceId, userId, payload: { type: 'telegram', label: 'Bot A', token: 'tok-a' } });
    await platformsRepository.create({ workspaceId, userId, payload: { type: 'whatsapp', label: 'WA B', token: 'tok-b' } });
    const list = await platformsRepository.list({ workspaceId });
    assert.strictEqual(list.length, 2);
    for (const p of list) {
      assert.strictEqual(p.token, 'configured');
      assert.strictEqual(p.appSecret, '');
    }
  });

  it('findById returns sanitized platform', async () => {
    const created = await platformsRepository.create({ workspaceId, userId, payload: { type: 'telegram', label: 'Detail', token: 't' } });
    const found = await platformsRepository.findById({ workspaceId, platformId: created._id });
    assert.ok(found);
    assert.strictEqual(found.token, 'configured');
  });

  it('findById returns null for wrong workspace', async () => {
    const created = await platformsRepository.create({ workspaceId, userId, payload: { type: 'telegram', label: 'Wrong WS', token: 't' } });
    const other = new mongoose.Types.ObjectId();
    const found = await platformsRepository.findById({ workspaceId: other, platformId: created._id });
    assert.strictEqual(found, null);
  });

  it('update encrypts credential fields', async () => {
    const created = await platformsRepository.create({ workspaceId, userId, payload: { type: 'telegram', label: 'Before', token: 'old-token' } });
    const raw = await Platform.findById(created._id);
    assert.notStrictEqual(raw.token, 'old-token');
    assert.ok(raw.token.includes(':'));

    const updated = await platformsRepository.update({ workspaceId, platformId: created._id, updates: { label: 'After', token: 'new-token' } });
    assert.strictEqual(updated.label, 'After');
    assert.strictEqual(updated.token, 'configured');
  });

  it('remove deletes platform', async () => {
    const created = await platformsRepository.create({ workspaceId, userId, payload: { type: 'telegram', label: 'To Delete' } });
    const deleted = await platformsRepository.remove({ workspaceId, platformId: created._id });
    assert.strictEqual(deleted, true);
    const found = await platformsRepository.findById({ workspaceId, platformId: created._id });
    assert.strictEqual(found, null);
  });

  it('updateHealth updates health fields', async () => {
    const created = await platformsRepository.create({ workspaceId, userId, payload: { type: 'telegram', label: 'Health' } });
    const updated = await platformsRepository.updateHealth({ workspaceId, platformId: created._id, health: 'healthy', lastEventAt: new Date() });
    assert.strictEqual(updated.health, 'healthy');
    assert.ok(updated.lastEventAt);
  });
});
