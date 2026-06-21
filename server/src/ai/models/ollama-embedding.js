const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'nomic-embed-text';

export function createOllamaEmbeddingProvider({ baseUrl, model } = {}) {
  const url = (baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL).replace(/\/+$/, '');
  const embedModel = model || process.env.AI_EMBEDDING_MODEL || DEFAULT_MODEL;
  let healthy = false;
  let lastCheck = 0;

  async function embed({ input }) {
    const res = await fetch(url + '/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: embedModel, prompt: input }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error('Ollama embedding error (' + res.status + '): ' + text.slice(0, 200));
    }
    const data = await res.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Ollama returned invalid embedding response');
    }
    return { embedding: data.embedding, model: embedModel, tokenCount: input.length, dimension: data.embedding.length };
  }

  async function checkHealth() {
    try {
      const res = await fetch(url + '/api/tags', { signal: AbortSignal.timeout(3000) });
      healthy = res.ok;
    } catch { healthy = false; }
    lastCheck = Date.now();
    return healthy;
  }

  return { embed, checkHealth, health: () => ({ healthy, lastCheck }), model: embedModel, dimension: 768 };
}

export async function embedWithOllama(text, opts = {}) {
  const provider = createOllamaEmbeddingProvider(opts);
  return provider.embed({ input: text });
}
