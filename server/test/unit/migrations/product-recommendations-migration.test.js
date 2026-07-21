import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const migrationUrl = new URL('../../../src/db/migrations/045_product_recommendations.sql', import.meta.url);

describe('product recommendations migration', () => {
  it('defines integrity, query indexes, idempotency, and service-role-only RLS', async () => {
    const sql = await readFile(migrationUrl, 'utf8');
    for (const fragment of [
      'create table if not exists product_recommendations',
      'create table if not exists recommendation_events',
      "source_product_id <> target_product_id",
      "recommendation_type in ('upsell', 'cross_sell')",
      "event_type in ('impression', 'clicked', 'accepted', 'dismissed', 'purchased')",
      'product_recommendations_global_unique_idx',
      'recommendation_events_idempotency_unique_idx',
      'product_recommendations enable row level security',
      'recommendation_events enable row level security',
      'to service_role using (true) with check (true)',
    ]) assert.match(sql, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  });
});
