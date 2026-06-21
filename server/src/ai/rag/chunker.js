import crypto from 'node:crypto';

const TARGET_TOKENS = 500;
const MIN_TOKENS = 300;
const MAX_TOKENS = 700;
const OVERLAP_TOKENS = 75;

function estimateTokens(text) {
  return Math.ceil(text.length * 0.25);
}

export function chunkDocument({ sourceId, sourceVersion, title, content, workspaceId, outletId, agentId }) {
  if (!content || content.trim().length === 0) return [];

  const paragraphs = content.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let currentSection = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (/^#{1,4}\s/.test(trimmed)) {
      if (currentChunk && estimateTokens(currentChunk) >= MIN_TOKENS) {
        chunks.push(buildChunk({ sourceId, sourceVersion, title, currentSection, content: currentChunk, chunkIndex, workspaceId, outletId, agentId }));
        chunkIndex++;
        currentChunk = '';
      }
      currentSection = trimmed.replace(/^#+\s*/, '');
      currentChunk += trimmed + '\n\n';
      continue;
    }

    const withPara = currentChunk ? currentChunk + trimmed + '\n\n' : trimmed + '\n\n';
    if (estimateTokens(withPara) > MAX_TOKENS && currentChunk) {
      chunks.push(buildChunk({ sourceId, sourceVersion, title, currentSection, content: currentChunk, chunkIndex, workspaceId, outletId, agentId }));
      chunkIndex++;
      const words = currentChunk.split(/\s+/);
      const overlapText = words.slice(-Math.ceil(words.length * (OVERLAP_TOKENS / estimateTokens(currentChunk)))).join(' ');
      currentChunk = overlapText ? overlapText + '\n\n' + trimmed + '\n\n' : trimmed + '\n\n';
    } else {
      currentChunk = withPara;
    }
  }

  if (currentChunk && estimateTokens(currentChunk) > 0) {
    chunks.push(buildChunk({ sourceId, sourceVersion, title, currentSection, content: currentChunk, chunkIndex, workspaceId, outletId, agentId }));
  }

  return chunks;
}

function buildChunk({ sourceId, sourceVersion, title, currentSection, content, chunkIndex, workspaceId, outletId, agentId }) {
  const fullContent = currentSection && !content.startsWith('#')
    ? `## ${currentSection}\n\n${content}`
    : content;

  return {
    source_id: sourceId,
    source_version: sourceVersion,
    chunk_index: chunkIndex,
    section_heading: currentSection || title || '',
    content: fullContent.trim(),
    token_count: estimateTokens(fullContent),
    workspace_id: workspaceId,
    outlet_id: outletId || null,
    agent_id: agentId || null,
    content_hash: crypto.createHash('sha256').update(fullContent).digest('hex'),
    embedding: null,
    embedding_model: null,
  };
}
