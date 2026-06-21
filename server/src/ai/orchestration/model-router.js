const KNOWN_PROVIDERS = new Set(['local_openai_compatible', 'openai', 'gemini']);

export function createModelRouter({ provider } = {}) {
  async function routeTask({ taskType, agent }) {
    const modelConfig = agent?.aiSettings || {};
    return {
      provider: modelConfig.provider || provider || 'local_openai_compatible',
      model: modelConfig.model || 'default',
      temperature: modelConfig.temperature ?? 0.7,
      maxTokens: modelConfig.maxTokens ?? 2000,
    };
  }

  async function health() {
    return { healthy: true, provider: provider || 'local_openai_compatible' };
  }

  function validateProvider(providerName) {
    return KNOWN_PROVIDERS.has(providerName);
  }

  return { routeTask, health, validateProvider };
}
