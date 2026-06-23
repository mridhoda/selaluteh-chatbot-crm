import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardSummary, getChannelPerformance } from '../../../src/services/analytics.service.js';

describe('analytics.service', () => {
  describe('getDashboardSummary', () => {
    it('requires workspaceId', async () => {
      await assert.rejects(() => getDashboardSummary({}), (err) => {
        assert.ok(err.message || err.code);
        return true;
      });
    });
  });

  describe('getChannelPerformance', () => {
    it('requires workspaceId', async () => {
      await assert.rejects(() => getChannelPerformance({}), (err) => {
        assert.ok(err.message || err.code);
        return true;
      });
    });
  });
});
