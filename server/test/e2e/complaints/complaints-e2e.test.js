import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import complaintRoutes from '../../../src/routes/complaints.js';
import { executeComplaintFlow } from '../../../src/ai/commerce/complaint-flow.js';
import { complaintsSupabaseRepository } from '../../../src/db/repositories/index.js';

function getRouteContracts(router) {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }));
}

describe('E2E smoke: complaints management flow contract', () => {
  it('supports AI complaint reporting and human escalation actions', () => {
    const report = executeComplaintFlow({
      action: 'report',
      args: { issue: 'Pesanan datang rusak', priority: 'high' },
    });

    assert.equal(report.action, 'report_complaint');
    assert.equal(report.requiresConfirmation, true);
    assert.equal(report.severity, 'high');
    assert.match(report.preview, /Pesanan datang rusak/);

    const escalation = executeComplaintFlow({ action: 'escalate', args: {} });
    assert.deepEqual(escalation, {
      action: 'handover_to_human',
      requiresConfirmation: false,
      reason: 'complaint_escalation',
    });
  });

  it('exposes authenticated complaint API endpoints needed by the dashboard', () => {
    const contracts = getRouteContracts(complaintRoutes);

    assert.deepEqual(contracts, [
      { path: '/', methods: ['get'] },
      { path: '/:id', methods: ['get'] },
      { path: '/', methods: ['post'] },
      { path: '/:id', methods: ['delete'] },
      { path: '/:id', methods: ['put'] },
      { path: '/:id', methods: ['patch'] },
    ]);
  });

  it('has repository operations required for list-create-resolve-delete lifecycle', () => {
    assert.equal(typeof complaintsSupabaseRepository.list, 'function');
    assert.equal(typeof complaintsSupabaseRepository.findById, 'function');
    assert.equal(typeof complaintsSupabaseRepository.create, 'function');
    assert.equal(typeof complaintsSupabaseRepository.update, 'function');
    assert.equal(typeof complaintsSupabaseRepository.deleteById, 'function');
    assert.equal(typeof complaintsSupabaseRepository.addEvent, 'function');
    assert.equal(typeof complaintsSupabaseRepository.getEvents, 'function');
  });
});
