import { getSupabaseServiceClient } from '../src/db/supabase.js';

const supabase = getSupabaseServiceClient();

const { data: chunks, error } = await supabase
  .from('knowledge_chunks')
  .select('id, content')
  .is('embedding', null)
  .limit(20);

if (error) { console.log('Error:', error.message); process.exit(1); }
console.log('Chunks to embed:', chunks.length);

for (const chunk of chunks) {
  const res = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: chunk.content }),
  });
  const data = await res.json();
  if (data.embedding) {
    const { error: updateErr } = await supabase
      .from('knowledge_chunks')
      .update({ embedding: data.embedding, embedding_model: 'nomic-embed-text' })
      .eq('id', chunk.id);
    if (updateErr) console.log('Update error:', updateErr.message.slice(0, 60));
    else console.log('  ✅ Embedded:', chunk.id.slice(0, 8), 'dim:', data.embedding.length);
  } else {
    console.log('  ❌ No embedding for', chunk.id.slice(0, 8));
  }
}
console.log('\nDone!');
