import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WS = '60f7c52e-b086-4144-994b-a1260ee00ec9';

// Simple chunker (same logic as server chunker)
function chunkContent({ sourceId, sourceVersion, title, content, workspaceId }) {
  if (!content || !content.trim()) return [];
  const paragraphs = content.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  let currentSection = '';
  let chunkIndex = 0;
  const estimateTokens = (t) => Math.ceil(t.length * 0.25);
  const MAX_TOKENS = 700;
  const MIN_TOKENS = 300;

  for (const para of paragraphs) {
    const t = para.trim();
    if (!t) continue;
    if (/^#{1,4}\s/.test(t)) {
      if (currentChunk && estimateTokens(currentChunk) >= MIN_TOKENS) {
        chunks.push({ section: currentSection, content: currentChunk, index: chunkIndex++ });
        currentChunk = '';
      }
      currentSection = t.replace(/^#+\s*/, '');
      currentChunk += t + '\n\n';
      continue;
    }
    const withPara = currentChunk ? currentChunk + t + '\n\n' : t + '\n\n';
    if (estimateTokens(withPara) > MAX_TOKENS && currentChunk) {
      chunks.push({ section: currentSection, content: currentChunk, index: chunkIndex++ });
      currentChunk = t + '\n\n';
    } else {
      currentChunk = withPara;
    }
  }
  if (currentChunk && estimateTokens(currentChunk) > 0) {
    chunks.push({ section: currentSection, content: currentChunk, index: chunkIndex });
  }
  return chunks.map((c) => ({
    source_id: sourceId,
    source_version: sourceVersion,
    chunk_index: c.index,
    section_heading: c.section || title || '',
    content: c.content.trim(),
    token_count: estimateTokens(c.content),
    workspace_id: workspaceId,
    content_hash: crypto.createHash('sha256').update(c.content).digest('hex'),
    embedding: null,
    embedding_model: null,
  }));
}

async function ingest() {
  console.log('Ingesting knowledge sources...\n');

  const { data: sources, error } = await supabase
    .from('knowledge_sources')
    .select('*')
    .eq('workspace_id', WS)
    .eq('status', 'draft');

  if (error) { console.error('Query error:', error.message); return; }
  console.log('Found ' + sources.length + ' draft sources\n');

  for (const source of sources) {
    // mark as processing
    await supabase.from('knowledge_sources').update({ status: 'processing' }).eq('id', source.id);

    const chunks = chunkContent({
      sourceId: source.id,
      sourceVersion: source.version || 1,
      title: source.title,
      content: source.content || '',
      workspaceId: WS,
    });

    if (chunks.length === 0) {
      await supabase.from('knowledge_sources').update({ status: 'failed' }).eq('id', source.id);
      console.log(`  ❌ ${source.title}: no chunks generated`);
      continue;
    }

    // delete old chunks for this source version
    await supabase.from('knowledge_chunks').delete().eq('source_id', source.id).lte('source_version', source.version || 1);

    // insert chunks
    const { error: insertErr } = await supabase.from('knowledge_chunks').insert(chunks);
    if (insertErr) {
      await supabase.from('knowledge_sources').update({ status: 'failed' }).eq('id', source.id);
      console.log(`  ❌ ${source.title}: ${insertErr.message}`);
      continue;
    }

    // mark as ready_for_review
    await supabase.from('knowledge_sources').update({ status: 'ready_for_review' }).eq('id', source.id);
    console.log(`  ✅ ${source.title} → ${chunks.length} chunks`);
  }

  console.log('\nIngestion complete! Now publish sources to activate them for RAG.');
}

async function publishAll() {
  console.log('\nPublishing all ready_for_review sources...\n');
  const { data: ready } = await supabase
    .from('knowledge_sources')
    .select('*')
    .eq('workspace_id', WS)
    .eq('status', 'ready_for_review');

  for (const s of ready || []) {
    await supabase.from('knowledge_sources').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', s.id);
    console.log(`  ✅ ${s.title} → published`);
  }
  console.log('\nAll sources published! RAG is now active.');
}

ingest().then(publishAll);
