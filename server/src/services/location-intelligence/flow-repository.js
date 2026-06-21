import { createPendingLocationContext, isValidPendingContext } from './pending-location-context.js';
import { LocationError, LocationErrorCode } from './errors.js';

export function createFlowRepository(storage) {
  const store = storage || new Map();

  return {
    async create(fields) {
      if (!fields.workspaceId) {
        throw new LocationError(LocationErrorCode.CITY_REQUIRED, 'workspaceId is required', 400);
      }
      const existing = Array.from(store.values()).find(
        f => f.workspaceId === fields.workspaceId &&
             f.contactId === fields.contactId &&
             f.lastMessageId === fields.lastMessageId &&
             fields.lastMessageId &&
             !isExpired(f)
      );
      if (existing) return existing;

      const flow = createPendingLocationContext(fields);
      store.set(flow.flowId, flow);
      return flow;
    },

    async getById(flowId, workspaceId) {
      const flow = store.get(flowId);
      if (!flow) return null;
      if (workspaceId && flow.workspaceId !== workspaceId) return null;
      if (isExpired(flow)) {
        store.delete(flowId);
        return null;
      }
      return flow;
    },

    async update(flowId, updates) {
      const flow = store.get(flowId);
      if (!flow) return null;
      if (isExpired(flow)) { store.delete(flowId); return null; }
      Object.assign(flow, updates, { updatedAt: new Date().toISOString() });
      return flow;
    },

    async delete(flowId) {
      store.delete(flowId);
    },

    async getByContact(workspaceId, contactId) {
      return Array.from(store.values()).filter(
        f => f.workspaceId === workspaceId && f.contactId === contactId && !isExpired(f)
      );
    },
  };
}

function isExpired(flow) {
  return new Date(flow.expiresAt).getTime() < Date.now();
}

export function buildMemoryRepo() {
  return new Map();
}
