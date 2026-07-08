import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expirePayment, expirePendingPayments } from '../../../src/services/payment-expiry.service.js';

describe('payment expiry service', () => {
  it('expires pending payment when backend time is past expiresAt', async () => {
    const now = new Date('2026-07-07T08:00:00.000Z');
    const payment = {
      id: 'payment-1',
      workspaceId: 'workspace-1',
      outletId: 'outlet-1',
      orderId: 'order-1',
      status: 'pending',
      expiresAt: '2026-07-07T07:59:00.000Z',
      reconciliationStatus: 'pending',
    };
    const calls = [];
    const deps = {
      paymentsRepository: {
        findById: async () => payment,
        transitionStatus: async (input) => {
          calls.push(input);
          return { ...payment, status: 'expired' };
        },
      },
      ordersRepository: {
        updateOne: async ({ updates }) => ({ id: 'order-1', outletId: 'outlet-1', paymentStatus: updates.payment_status }),
      },
      notifyPaymentUpdatedRealtime: () => {},
      notifyOrderUpdatedRealtime: () => {},
    };

    const result = await expirePayment({ workspaceId: 'workspace-1', paymentId: 'payment-1', now }, deps);

    assert.equal(result.expired, true);
    assert.equal(calls[0].newStatus, 'expired');
    assert.deepEqual(calls[0].fromStatuses, ['pending', 'processing']);
  });

  it('does not expire paid payment', async () => {
    const deps = {
      paymentsRepository: {
        findById: async () => ({ id: 'payment-1', workspaceId: 'workspace-1', status: 'paid', expiresAt: '2026-07-07T07:00:00.000Z' }),
        transitionStatus: async () => assert.fail('paid payment must not transition'),
      },
      ordersRepository: { updateOne: async () => assert.fail('paid order must not be expired') },
      notifyPaymentUpdatedRealtime: () => assert.fail('no notification expected'),
      notifyOrderUpdatedRealtime: () => assert.fail('no notification expected'),
    };

    const result = await expirePayment({ workspaceId: 'workspace-1', paymentId: 'payment-1', now: new Date('2026-07-07T08:00:00.000Z') }, deps);

    assert.equal(result.expired, false);
    assert.equal(result.reason, 'not_expirable');
  });

  it('scans due payments from repository when payments are not provided', async () => {
    const duePayment = { id: 'payment-1', workspaceId: 'workspace-1', orderId: 'order-1', status: 'processing', expiresAt: '2026-07-07T07:59:00.000Z' };
    const deps = {
      paymentsRepository: {
        findDueForExpiry: async ({ workspaceId }) => {
          assert.equal(workspaceId, 'workspace-1');
          return [duePayment];
        },
        findById: async () => duePayment,
        transitionStatus: async () => ({ ...duePayment, status: 'expired' }),
      },
      ordersRepository: { updateOne: async () => ({ id: 'order-1' }) },
      notifyPaymentUpdatedRealtime: () => {},
      notifyOrderUpdatedRealtime: () => {},
    };

    const result = await expirePendingPayments({ workspaceId: 'workspace-1', now: new Date('2026-07-07T08:00:00.000Z') }, deps);

    assert.equal(result.expired, 1);
  });
});
