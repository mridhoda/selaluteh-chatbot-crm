import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { validateMemoryCandidate, createMemoryService } from '../../../src/ai/memory/memory-service.js';
import { extractMemoryFromMessage, extractMemoryCandidates } from '../../../src/ai/memory/memory-extraction.js';

describe('validateMemoryCandidate', () => {
  const valid = {
    key: 'sweetness_preference',
    value: { preference: 'less_sweet' },
    category: 'product_preference',
    sourceType: 'conversation_extraction',
    confidence: 'high',
  };

  it('accepts valid candidate', () => {
    const result = validateMemoryCandidate(valid);
    assert.equal(result.valid, true);
  });

  it('rejects non-object', () => {
    assert.equal(validateMemoryCandidate(null).valid, false);
  });

  it('rejects missing key', () => {
    assert.equal(validateMemoryCandidate({ ...valid, key: '' }).valid, false);
  });

  it('rejects unknown category', () => {
    assert.equal(validateMemoryCandidate({ ...valid, category: 'address' }).valid, false);
  });

  it('forbidden key address rejected', () => {
    assert.equal(validateMemoryCandidate({ ...valid, key: 'address' }).valid, false);
  });

  it('forbidden key otp rejected', () => {
    assert.equal(validateMemoryCandidate({ ...valid, key: 'otp_code' }).valid, false);
  });

  it('rejects invalid confidence', () => {
    assert.equal(validateMemoryCandidate({ ...valid, confidence: 'very_high' }).valid, false);
  });
});

describe('memoryService', () => {
  it('propose creates candidate', async () => {
    const repo = {
      findByKey: mock.fn(async () => null),
      createCandidate: mock.fn(async (args) => ({ id: 'mem-1', ...args, status: 'candidate' })),
    };
    const svc = createMemoryService({ repository: repo });
    const result = await svc.propose({
      workspaceId: 'ws-1', contactId: 'c-1',
      candidate: { key: 'taste', value: { v: 'manis' }, category: 'product_preference', confidence: 'high' },
    });
    assert.equal(result.success, true);
    assert.equal(result.status, 'created');
  });

  it('propose rejects invalid candidate', async () => {
    const svc = createMemoryService();
    const result = await svc.propose({
      workspaceId: 'ws-1', contactId: 'c-1',
      candidate: { key: 'address', value: { street: 'Jl. ABC' }, category: 'identity' },
    });
    assert.equal(result.success, false);
    assert.ok(result.errors.length > 0);
  });

  it('forget marks deleted', async () => {
    const repo = {
      findByKey: mock.fn(async () => ({ id: 'mem-1', status: 'active' })),
      forget: mock.fn(async ({ id }) => ({ id, status: 'deleted', deletedAt: new Date().toISOString() })),
    };
    const svc = createMemoryService({ repository: repo });
    const result = await svc.forget({ workspaceId: 'ws-1', contactId: 'c-1', memoryKey: 'taste' });
    assert.equal(result.success, true);
  });

  it('correct creates new version', async () => {
    const repo = {
      findByKey: mock.fn(async () => ({ id: 'mem-1', category: 'product_preference', status: 'active' })),
      supersede: mock.fn(async ({ id }) => ({ id, status: 'superseded' })),
      createCandidate: mock.fn(async (args) => ({ id: 'mem-2', ...args, status: 'candidate' })),
      activate: mock.fn(async ({ id }) => ({ id, status: 'active' })),
    };
    const svc = createMemoryService({ repository: repo });
    const result = await svc.correct({
      workspaceId: 'ws-1', contactId: 'c-1', memoryKey: 'taste',
      memoryValue: { preference: 'extra_sweet' },
    });
    assert.equal(result.success, true);
    assert.equal(repo.supersede.mock.calls.length, 1);
    assert.equal(repo.createCandidate.mock.calls.length, 1);
  });

  it('listActive returns only active/confirmed', async () => {
    const repo = {
      listActive: mock.fn(async () => [
        { id: 'm1', status: 'active' },
        { id: 'm2', status: 'confirmed' },
      ]),
    };
    const svc = createMemoryService({ repository: repo });
    const list = await svc.listActive({ workspaceId: 'ws-1', contactId: 'c-1' });
    assert.equal(list.length, 2);
  });
});

describe('extractMemoryFromMessage', () => {
  it('extracts sweetness preference from explicit statement', () => {
    const msg = { content: 'Saya mau yang kurang manis' };
    const candidates = extractMemoryFromMessage({ message: msg });
    assert.ok(candidates.some((c) => c.key === 'sweetness_preference'));
  });

  it('extracts nothing from unrelated message', () => {
    const msg = { content: 'Berapa harga teh tawar?' };
    const candidates = extractMemoryFromMessage({ message: msg });
    assert.equal(candidates.length, 0);
  });

  it('does not extract address', () => {
    const msg = { content: 'Alamat saya di Jalan Merdeka No 10' };
    const candidates = extractMemoryFromMessage({ message: msg });
    const hasAddress = candidates.some((c) => c.key === 'address' || c.category === 'address');
    assert.equal(hasAddress, false);
  });
});

describe('extractMemoryCandidates', () => {
  it('deduplicates candidates across messages', async () => {
    const messages = [
      { senderType: 'customer', content: 'Saya kurang manis' },
      { senderType: 'customer', content: 'Kurang manis saya' },
    ];
    const candidates = await extractMemoryCandidates({ recentMessages: messages });
    const sweetnessCount = candidates.filter((c) => c.key === 'sweetness_preference').length;
    assert.equal(sweetnessCount, 1);
  });

  it('ignores assistant messages', async () => {
    const messages = [
      { senderType: 'assistant', content: 'Saya kurang manis' },
    ];
    const candidates = await extractMemoryCandidates({ recentMessages: messages });
    assert.equal(candidates.length, 0);
  });
});
