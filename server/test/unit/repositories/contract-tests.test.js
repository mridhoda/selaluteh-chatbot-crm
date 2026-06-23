import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const repos = {
  inventory: () => import('../../../src/db/repositories/inventory.supabase.repository.js'),
  audit: () => import('../../../src/db/repositories/audit-logs.supabase.repository.js'),
  jobs: () => import('../../../src/db/repositories/jobs.supabase.repository.js'),
};

describe('repository contract tests', () => {
  for (const [name, imp] of Object.entries(repos)) {
    describe(name, () => {
      it('exports an object with async methods', async () => {
        const mod = await imp();
        const repo = mod.inventoryRepository || mod.auditLogsRepository || mod.jobsRepository;
        assert.ok(repo, `${name} has exported repository`);
        const keys = Object.keys(repo);
        assert.ok(keys.length > 0, `${name} has methods`);
        for (const key of keys) {
          assert.ok(typeof repo[key] === 'function', `${name}.${key} is a function`);
        }
      });
    });
  }
});
