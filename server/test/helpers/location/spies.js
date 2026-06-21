import { mock } from 'node:test';

export function createCacheSpy() {
  const store = new Map();
  let getCount = 0;
  let setCount = 0;
  let deleteCount = 0;
  const getCalls = [];
  const setCalls = [];
  const deleteCalls = [];

  return {
    get: async (key) => {
      getCount++;
      getCalls.push({ key });
      return store.get(JSON.stringify(key)) || null;
    },
    set: async (key, value, ttlMs) => {
      setCount++;
      setCalls.push({ key, ttlMs });
      store.set(JSON.stringify(key), value);
    },
    delete: async (key) => {
      deleteCount++;
      deleteCalls.push({ key });
      store.delete(JSON.stringify(key));
    },
    clear: async () => {
      store.clear();
    },
    getStore: () => new Map(store),
    getGetCount: () => getCount,
    getSetCount: () => setCount,
    getDeleteCount: () => deleteCount,
    getGetCalls: () => [...getCalls],
    getSetCalls: () => [...setCalls],
    getDeleteCalls: () => [...deleteCalls],
    reset: () => {
      store.clear();
      getCount = 0;
      setCount = 0;
      deleteCount = 0;
      getCalls.length = 0;
      setCalls.length = 0;
      deleteCalls.length = 0;
    },
  };
}

export function createRateLimitSpy() {
  let checkCount = 0;
  const checkCalls = [];

  return {
    check: async (key, maxRequests, windowMs) => {
      checkCount++;
      checkCalls.push({ key, maxRequests, windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetAt: Date.now() + windowMs };
    },
    consume: async (key, maxRequests, windowMs) => {
      checkCount++;
      checkCalls.push({ key, maxRequests, windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetAt: Date.now() + windowMs };
    },
    getCheckCount: () => checkCount,
    getCheckCalls: () => [...checkCalls],
    reset: () => { checkCount = 0; checkCalls.length = 0; },
  };
}

export function createConfirmationSpy() {
  const calls = [];
  return {
    requestConfirmation: async (flowId, outletId, contactId) => {
      calls.push({ method: 'requestConfirmation', flowId, outletId, contactId });
      return { success: true, confirmationId: `conf-${flowId}` };
    },
    confirm: async (confirmationId, contactId) => {
      calls.push({ method: 'confirm', confirmationId, contactId });
      return { success: true, mutationCalled: false };
    },
    getCalls: () => [...calls],
    reset: () => { calls.length = 0; },
  };
}

export function createScopeSecurityGateSpy() {
  const calls = [];
  return {
    check: async (intent, workspaceId, message) => {
      calls.push({ method: 'check', intent, workspaceId, message });
      return { allowed: true, decision: 'ALLOW_BUSINESS', intent: intent || 'OUTLET' };
    },
    getCalls: () => [...calls],
    reset: () => { calls.length = 0; },
  };
}

export function createMarketplaceSpy() {
  const calls = [];
  return {
    selectOutlet: async (workspaceId, contactId, outletId, idempotencyKey) => {
      calls.push({ method: 'selectOutlet', workspaceId, contactId, outletId, idempotencyKey });
      return { success: true, outletId };
    },
    getOutlet: async (outletId) => {
      calls.push({ method: 'getOutlet', outletId });
      return {
        id: outletId,
        name: 'SelaluTeh Samarinda',
        status: 'active',
        pickupEnabled: true,
        deletedAt: null,
      };
    },
    getOpeningStatus: async (outletId, time) => {
      calls.push({ method: 'getOpeningStatus', outletId, time });
      return 'open';
    },
    getCalls: () => [...calls],
    reset: () => { calls.length = 0; },
  };
}

export function createHumanTakeoverFixture(overrides = {}) {
  return {
    isTakenOver: false,
    takenOverByUserId: null,
    takeoverAt: null,
    ...overrides,
  };
}
