import { createMemoryService } from '../memory/memory-service.js';

const memoryService = createMemoryService();

export const memoryToolDefinitions = [
  {
    name: 'list_customer_memories',
    description: 'Menampilkan preferensi customer yang tersimpan.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    permission: 'customer_memory_read',
    confirmation: 'none',
    mutation: false,
    idempotent: true,
    timeoutMs: 5000,
  },
  {
    name: 'save_customer_preference',
    description: 'Menyimpan preferensi customer (rasa, outlet, komunikasi).',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Nama preferensi (e.g., sweetness_preference, favorite_outlet)' },
        value: { type: 'object', description: 'Nilai preferensi' },
        category: { type: 'string', enum: ['product_preference', 'outlet_preference', 'communication_preference', 'language', 'customer_tag'] },
      },
      required: ['key', 'value', 'category'],
    },
    permission: 'customer_memory_write',
    confirmation: 'customer',
    mutation: true,
    idempotent: false,
    timeoutMs: 5000,
  },
  {
    name: 'correct_customer_memory',
    description: 'Mengoreksi preferensi customer yang sudah tersimpan.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: 'object' },
      },
      required: ['key', 'value'],
    },
    permission: 'customer_memory_write',
    confirmation: 'customer',
    mutation: true,
    idempotent: false,
    timeoutMs: 5000,
  },
  {
    name: 'forget_customer_memory',
    description: 'Menghapus preferensi customer dari memori.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
      },
      required: ['key'],
    },
    permission: 'customer_memory_write',
    confirmation: 'customer',
    mutation: true,
    idempotent: true,
    timeoutMs: 5000,
  },
  {
    name: 'clear_product_preferences',
    description: 'Menghapus semua preferensi produk customer.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    permission: 'customer_memory_write',
    confirmation: 'customer',
    mutation: true,
    idempotent: false,
    timeoutMs: 5000,
  },
];

export async function executeMemoryTool({ toolName, args, workspaceId, contactId }) {
  switch (toolName) {
    case 'list_customer_memories': {
      const memories = await memoryService.listActive({ workspaceId, contactId });
      return { success: true, data: memories.map((m) => ({ key: m.memoryKey, value: m.memoryValue, category: m.category })) };
    }
    case 'save_customer_preference': {
      const result = await memoryService.propose({
        workspaceId, contactId,
        candidate: { key: args.key, value: args.value, category: args.category, sourceType: 'customer_request', confidence: 'high' },
      });
      return result;
    }
    case 'correct_customer_memory': {
      const result = await memoryService.correct({ workspaceId, contactId, memoryKey: args.key, memoryValue: args.value });
      return result;
    }
    case 'forget_customer_memory': {
      const result = await memoryService.forget({ workspaceId, contactId, memoryKey: args.key });
      return result;
    }
    case 'clear_product_preferences': {
      const memories = await memoryService.listActive({ workspaceId, contactId });
      for (const m of memories.filter((mem) => mem.category === 'product_preference')) {
        await memoryService.forget({ workspaceId, contactId, memoryKey: m.memoryKey });
      }
      return { success: true, data: { cleared: true } };
    }
    default:
      return { success: false, error: `Unknown memory tool: ${toolName}` };
  }
}
