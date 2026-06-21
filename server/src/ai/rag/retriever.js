import { knowledgeChunksRepository } from '../../db/repositories/index.js';

const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.7;

export async function hybridRetrieve({ workspaceId, query, topK = DEFAULT_TOP_K, outletId, agentId }) {
  const results = [];

  try {
    const textResults = await knowledgeChunksRepository.fullTextSearch({
      workspaceId, query, matchCount: topK * 2, outletId, agentId,
    });
    if (Array.isArray(textResults)) results.push(...textResults);
  } catch {}

  const seen = new Set();
  const deduped = [];
  for (const r of results) {
    if (!seen.has(r.id)) { seen.add(r.id); deduped.push(r); }
  }

  return deduped.slice(0, topK);
}
