export function createFakeProvider(scenario = 'default') {
  const scenarios = {
    default: {
      chat: async () => ({
        role: 'assistant',
        content: 'Halo! Ada yang bisa saya bantu?',
      }),
      structured: async () => ({
        responseType: 'message',
        message: 'Halo! Ada yang bisa saya bantu?',
        toolCalls: [],
        memoryCandidates: [],
        confidence: 0.95,
        needsHuman: false,
        reasonCode: null,
      }),
      embed: async () => ({
        embedding: new Array(384).fill(0.01),
        model: 'test-embed',
      }),
      health: async () => ({ healthy: true, latencyMs: 10 }),
    },
    tool_call: {
      chat: async () => ({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_test',
            type: 'function',
            function: {
              name: 'search_products',
              arguments: JSON.stringify({ query: 'teh' }),
            },
          },
        ],
      }),
      structured: async () => ({
        responseType: 'tool_call',
        message: null,
        toolCalls: [
          { name: 'search_products', arguments: { query: 'teh' } },
        ],
        memoryCandidates: [],
        confidence: 0.95,
        needsHuman: false,
        reasonCode: null,
      }),
      embed: async () => ({
        embedding: new Array(384).fill(0.01),
        model: 'test-embed',
      }),
      health: async () => ({ healthy: true, latencyMs: 10 }),
    },
    handoff: {
      chat: async () => ({
        role: 'assistant',
        content: 'Saya alihkan ke admin.',
      }),
      structured: async () => ({
        responseType: 'handoff',
        message: 'Saya alihkan ke admin.',
        toolCalls: [],
        memoryCandidates: [],
        confidence: 0.95,
        needsHuman: true,
        reasonCode: 'customer_request',
      }),
      embed: async () => ({
        embedding: new Array(384).fill(0.01),
        model: 'test-embed',
      }),
      health: async () => ({ healthy: true, latencyMs: 10 }),
    },
    summary: {
      chat: async () => ({
        role: 'assistant',
        content: JSON.stringify({
          customerGoal: 'Membeli teh',
          resolvedFacts: ['Customer suka teh manis'],
          pendingQuestions: [],
          selectedOutletReference: null,
          cartContext: [],
          supportIssue: null,
          commitmentsMade: [],
          doNotRepeat: [],
          lastState: 'browsing',
        }),
      }),
      structured: async () => ({
        customerGoal: 'Membeli teh',
        resolvedFacts: ['Customer suka teh manis'],
        pendingQuestions: [],
        selectedOutletReference: null,
        cartContext: [],
        supportIssue: null,
        commitmentsMade: [],
        doNotRepeat: [],
        lastState: 'browsing',
      }),
      embed: async () => ({
        embedding: new Array(384).fill(0.01),
        model: 'test-embed',
      }),
      health: async () => ({ healthy: true, latencyMs: 10 }),
    },
    memory_extraction: {
      chat: async () => ({
        role: 'assistant',
        content: JSON.stringify({
          candidates: [
            {
              key: 'preferred_taste',
              value: { value: 'kurang manis' },
              category: 'product_preference',
              sourceType: 'conversation_extraction',
              confidence: 'high',
              requiresConfirmation: false,
              reason: 'Customer explicitly stated "kurang manis"',
            },
          ],
        }),
      }),
      structured: async () => ({
        candidates: [
          {
            key: 'preferred_taste',
            value: { value: 'kurang manis' },
            category: 'product_preference',
            sourceType: 'conversation_extraction',
            confidence: 'high',
            requiresConfirmation: false,
            reason: 'Customer explicitly stated "kurang manis"',
          },
        ],
      }),
      embed: async () => ({
        embedding: new Array(384).fill(0.01),
        model: 'test-embed',
      }),
      health: async () => ({ healthy: true, latencyMs: 10 }),
    },
    error: {
      chat: async () => {
        throw new Error('Simulated provider error');
      },
      structured: async () => {
        throw new Error('Simulated provider error');
      },
      embed: async () => {
        throw new Error('Simulated embedding error');
      },
      health: async () => ({ healthy: false, latencyMs: 0 }),
    },
    timeout: {
      chat: async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return { role: 'assistant', content: 'Too late' };
      },
      structured: async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return {};
      },
      embed: async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return { embedding: [] };
      },
      health: async () => ({ healthy: true, latencyMs: 5000 }),
    },
  };

  const s = scenarios[scenario] || scenarios.default;
  let callCount = 0;
  const calls = [];

  return {
    chat: async (input) => {
      callCount++;
      calls.push({ type: 'chat', input, ts: Date.now() });
      return s.chat(input);
    },
    structured: async (input) => {
      callCount++;
      calls.push({ type: 'structured', input, ts: Date.now() });
      return s.structured(input);
    },
    embed: async (input) => {
      callCount++;
      calls.push({ type: 'embed', input, ts: Date.now() });
      return s.embed(input);
    },
    health: async () => s.health(),
    getCallCount: () => callCount,
    getCalls: () => [...calls],
    reset: () => {
      callCount = 0;
      calls.length = 0;
    },
  };
}

export function createScriptedFakeProvider(script = []) {
  let step = 0;
  const calls = [];

  return {
    chat: async (input) => {
      const s = script[step] || script[script.length - 1] || { role: 'assistant', content: '' };
      calls.push({ type: 'chat', input, step });
      step = Math.min(step + 1, script.length - 1);
      return s.chat ? s.chat(input) : s;
    },
    structured: async (input) => {
      const s = script[step] || script[script.length - 1] || { responseType: 'message', message: '' };
      calls.push({ type: 'structured', input, step });
      step = Math.min(step + 1, script.length - 1);
      return s.structured ? s.structured(input) : s;
    },
    embed: async (input) => ({
      embedding: new Array(384).fill(0.01),
      model: 'test-embed',
    }),
    health: async () => ({ healthy: true, latencyMs: 10 }),
    getStep: () => step,
    getCalls: () => [...calls],
    reset: () => {
      step = 0;
      calls.length = 0;
    },
  };
}
