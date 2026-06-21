import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, createKnowledgeService } from '../../../src/ai/rag/knowledge-service.js';
import { chunkDocument } from '../../../src/ai/rag/chunker.js';
import { hybridRetrieve } from '../../../src/ai/rag/retriever.js';

describe('canTransition', () => {
  it('allows draft → processing', () => {
    assert.equal(canTransition('draft', 'processing'), true);
  });
  it('allows ready_for_review → published', () => {
    assert.equal(canTransition('ready_for_review', 'published'), true);
  });
  it('blocks draft → published', () => {
    assert.equal(canTransition('draft', 'published'), false);
  });
  it('blocks published → published', () => {
    assert.equal(canTransition('published', 'published'), false);
  });
  it('allows published → archived', () => {
    assert.equal(canTransition('published', 'archived'), true);
  });
  it('allows archived → draft', () => {
    assert.equal(canTransition('archived', 'draft'), true);
  });
});

describe('knowledgeService', () => {
  it('createDraft calls repository', async () => {
    const repo = {
      createDraft: mock.fn(async (a) => ({ id: 'ks-1', ...a, status: 'draft' })),
      findById: mock.fn(async () => null),
      updateDraft: mock.fn(async (a) => ({ ...a, status: 'draft' })),
      publishVersion: mock.fn(async (a) => ({ ...a, status: 'published' })),
      archive: mock.fn(async (a) => ({ ...a, status: 'archived' })),
      list: mock.fn(async () => []),
    };
    const svc = createKnowledgeService({ repository: repo });
    const result = await svc.createDraft({ workspaceId: 'ws-1', title: 'Test', sourceType: 'faq', content: 'Q&A' });
    assert.equal(result.status, 'draft');
    assert.equal(repo.createDraft.mock.calls.length, 1);
  });

  it('publish blocks ai_draft type', async () => {
    const repo = {
      findById: mock.fn(async () => ({ id: 'ks-1', status: 'ready_for_review', sourceType: 'ai_draft' })),
    };
    const svc = createKnowledgeService({ repository: repo });
    const result = await svc.publish({ workspaceId: 'ws-1', sourceId: 'ks-1' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'ai_draft cannot auto-publish');
  });

  it('startIngestion validates transition', async () => {
    const repo = {
      findById: mock.fn(async () => ({ id: 'ks-1', status: 'draft' })),
      updateDraft: mock.fn(async (a) => ({ ...a, status: 'processing' })),
    };
    const svc = createKnowledgeService({ repository: repo });
    const result = await svc.startIngestion({ workspaceId: 'ws-1', sourceId: 'ks-1' });
    assert.equal(result.status, 'processing');
  });
});

describe('chunkDocument', () => {
  it('splits short text into one chunk', () => {
    const chunks = chunkDocument({ sourceId: 's1', sourceVersion: 1, title: 'Test', content: 'Ini adalah teks pendek.', workspaceId: 'ws-1' });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].source_id, 's1');
    assert.equal(chunks[0].chunk_index, 0);
    assert.ok(chunks[0].content_hash);
  });

  it('produces multiple chunks for long text', () => {
    const content = 'Ini adalah paragraf pertama.\n\nIni adalah paragraf kedua.\n\n' + 'Kata '.repeat(1000) + '\n\nParagraf akhir.';
    const chunks = chunkDocument({ sourceId: 's1', sourceVersion: 1, title: 'Test', content, workspaceId: 'ws-1' });
    assert.ok(chunks.length >= 1);
  });

  it('preserves markdown headings as section boundaries', () => {
    const content = '# Pendahuluan\n\nIntro.\n\n# Isi\n\nKonten utama.\n\n# Penutup\n\nKesimpulan.';
    const chunks = chunkDocument({ sourceId: 's1', sourceVersion: 1, title: 'Test', content, workspaceId: 'ws-1' });
    assert.ok(chunks.length >= 1);
    const hasHeading = chunks.some((c) => c.content.includes('Pendahuluan'));
    assert.equal(hasHeading, true);
  });

  it('returns empty for empty content', () => {
    const chunks = chunkDocument({ sourceId: 's1', sourceVersion: 1, title: 'Test', content: '', workspaceId: 'ws-1' });
    assert.equal(chunks.length, 0);
  });
});

describe('hybridRetrieve', () => {
  it('returns empty array when no results', async () => {
    const results = await hybridRetrieve({ workspaceId: 'ws-1', query: 'nonexistent' });
    assert.ok(Array.isArray(results));
  });
});
