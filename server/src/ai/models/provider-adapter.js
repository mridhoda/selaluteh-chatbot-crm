export function createProviderAdapter({ provider, model, apiKey, baseUrl, timeoutMs = 15000 } = {}) {
  const adapter = {
    name: provider || 'local_openai_compatible',
    model: model || 'default',
    timeoutMs,
    async chat({ messages, tools }) {
      return {
        role: 'assistant',
        content: 'Mock response',
        toolCalls: [],
      };
    },
    async health() {
      return { healthy: true, provider: this.name, latencyMs: 10 };
    },
    async embed({ input }) {
      return { embedding: new Array(384).fill(0.01), model: this.model, tokenCount: input.length };
    },
  };
  return adapter;
}
