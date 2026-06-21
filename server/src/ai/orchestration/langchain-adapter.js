/**
 * LangChain/LangGraph Boundary Adapter Contract
 *
 * If LangChain is introduced in the future, it MUST go through this adapter.
 * Core interfaces remain framework-neutral:
 *   - Context builder → plain message arrays
 *   - Memory/Knowledge → Supabase repositories
 *   - Tool Gateway → plain function calls
 *   - Model router → provider-neutral config
 */

export function createLangChainAdapter({ modelConfig, toolDefs } = {}) {
  return {
    name: 'langchain_adapter',
    version: '0.1',
    status: 'unconfigured',
    async prepareMessages({ systemMessages, conversationMessages }) {
      return [...(systemMessages || []), ...(conversationMessages || [])];
    },
    async executeTools({ toolCalls }) {
      return (toolCalls || []).map((tc) => ({
        id: tc.id,
        result: {},
        error: null,
      }));
    },
    isConfigured() {
      return false;
    },
  };
}
