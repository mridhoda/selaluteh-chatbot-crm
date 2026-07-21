import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const migrationUrl = new URL('../../../src/db/migrations/047_product_modifiers.sql', import.meta.url);

describe('product modifiers migration', () => {
  it('persists groups, options, and product links with service-role RLS', async () => {
    const sql = await readFile(migrationUrl, 'utf8');
    for (const fragment of [
      'create table if not exists modifier_groups',
      'create table if not exists modifier_options',
      'create table if not exists product_modifier_groups',
      'unique (workspace_id, code)',
      'modifier_groups enable row level security',
      'modifier_options enable row level security',
      'to service_role using (true) with check (true)',
    ]) assert.match(sql, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  });
});
