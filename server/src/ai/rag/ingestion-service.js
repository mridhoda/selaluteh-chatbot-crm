import { createKnowledgeService } from './knowledge-service.js';
import { chunkDocument } from './chunker.js';
import { knowledgeChunksRepository } from '../../db/repositories/index.js';

export async function ingestSource({ workspaceId, sourceId }) {
  const ks = createKnowledgeService();
  const source = await ks.findById({ workspaceId, sourceId });
  if (!source) return { success: false, error: 'source_not_found' };

  await ks.startIngestion({ workspaceId, sourceId });
  try {
    const content = source.content || '';
    const chunks = chunkDocument({
      sourceId: source.id,
      sourceVersion: source.version || 1,
      title: source.title,
      content,
      workspaceId,
      outletId: source.outletId,
      agentId: null,
    });

    if (chunks.length === 0) {
      await ks.reject({ workspaceId, sourceId });
      return { success: false, error: 'no_chunks_generated' };
    }

    await knowledgeChunksRepository.deleteSupersededChunks({
      sourceId: source.id,
      olderThanVersion: source.version || 1,
    });

    await knowledgeChunksRepository.insertChunks(chunks);
    await ks.markReady({ workspaceId, sourceId });

    return { success: true, chunkCount: chunks.length };
  } catch (err) {
    await ks.updateDraft({ workspaceId, sourceId, updates: { status: 'failed' } });
    return { success: false, error: err.message };
  }
}
