import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../..');

const AI_BOUNDARY_FILES = [
  'src/services/ai.service.js',
  'src/ai/orchestration/orchestrator.js',
];

const MUTATION_REPOSITORY_PATTERNS = [
  /\bcartsRepository\.(?:create|upsertByContact|addItem|update|updateItem|removeItem|setStatus|clear|delete)\b/,
  /\bchatsSupabaseRepository\.(?:setCurrentOutlet|update|acquireTakeover|releaseTakeover)\b/,
  /\bcheckoutsRepository\.(?:create|update|updateStatus|delete)\b/,
  /\bordersRepository\.(?:create|update|updateOne|atomicStatusUpdate|addTimelineEntry|delete)\b/,
  /\bpaymentsRepository\.(?:create|update|updatePayment|atomicStatusUpdate|transitionStatus|addEvent|delete)\b/,
  /\bproductsRepository\.(?:create|update|archive|delete)\b/,
  /\boutletsSupabaseRepository\.(?:create|update|delete|setStatus)\b/,
  /await import\(['"]\.\.\/\.\.\/db\/repositories\/index\.js['"]\)/,
  /await import\(['"]\.\.\/db\/repositories\/index\.js['"]\)/,
];

describe('AISG architecture boundary', () => {
  it('keeps AI orchestration and tool execution from mutating repositories directly', () => {
    const violations = [];

    for (const relativePath of AI_BOUNDARY_FILES) {
      const fullPath = resolve(PROJECT_ROOT, relativePath);
      const source = readFileSync(fullPath, 'utf8');
      for (const pattern of MUTATION_REPOSITORY_PATTERNS) {
        if (pattern.test(source)) {
          violations.push(`${relativePath} matches ${pattern}`);
        }
      }
    }

    assert.deepEqual(violations, []);
  });
});
