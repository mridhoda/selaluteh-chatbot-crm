export function createFakeEmbeddingProvider() {
  let callCount = 0;

  return {
    embed: async (text) => {
      callCount++;
      return {
        embedding: new Array(384).fill(0).map(() => Math.random() * 0.01),
        model: 'test-embed',
        tokenCount: text.length,
      };
    },
    embedBatch: async (texts) => {
      return Promise.all(texts.map((t) => createFakeEmbeddingProvider().embed(t)));
    },
    getCallCount: () => callCount,
  };
}
