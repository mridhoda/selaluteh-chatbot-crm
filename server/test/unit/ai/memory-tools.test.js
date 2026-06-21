import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { memoryToolDefinitions, executeMemoryTool } from '../../../src/ai/tools/memory-tools.js';

describe('memoryToolDefinitions', () => {
  it('exports 5 tools', () => {
    assert.equal(memoryToolDefinitions.length, 5);
  });

  it('list_customer_memories is read-only and idempotent', () => {
    const tool = memoryToolDefinitions.find((t) => t.name === 'list_customer_memories');
    assert.ok(tool);
    assert.equal(tool.mutation, false);
    assert.equal(tool.idempotent, true);
    assert.equal(tool.confirmation, 'none');
  });

  it('save_customer_preference requires category', () => {
    const tool = memoryToolDefinitions.find((t) => t.name === 'save_customer_preference');
    assert.ok(tool);
    assert.ok(tool.inputSchema.required.includes('category'));
    assert.equal(tool.mutation, true);
    assert.equal(tool.confirmation, 'customer');
  });

  it('forget_customer_memory is idempotent', () => {
    const tool = memoryToolDefinitions.find((t) => t.name === 'forget_customer_memory');
    assert.equal(tool.idempotent, true);
  });
});
