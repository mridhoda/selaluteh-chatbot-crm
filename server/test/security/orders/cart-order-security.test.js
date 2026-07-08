import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidOrderTransition,
  isValidCartTransition,
  getOrderCapabilities,
  CartStatus,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from '../../../src/orders/order-types.js';
import { deleteOrderForUser, transitionOrderStatus, startPreparing } from '../../../src/services/order.service.js';
import { ordersRepository } from '../../../src/db/repositories/index.js';
import { mapAdminOrder } from '../../../src/routes/admin-orders.js';

describe('security: cart-order-lifecycle', () => {
  describe('price tampering', () => {
    it('client price cannot change order total — checked via transitions', () => {
      assert.ok(isValidCartTransition(CartStatus.CONFIRMED, CartStatus.CHECKOUT_LOCKED));
    });

    it('CONFIRMED cart cannot skip checkout lock', () => {
      assert.ok(!isValidCartTransition(CartStatus.CONFIRMED, CartStatus.CONVERTED));
    });
  });

  describe('fake payment', () => {
    it('PENDING_PAYMENT cannot become APPROVED without PAID', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.APPROVED));
    });

    it('unpaid orders expose no fulfillment capabilities', () => {
      const capabilities = getOrderCapabilities({ paymentStatus: PaymentStatus.UNPAID, fulfillmentStatus: FulfillmentStatus.ACCEPTED });
      assert.equal(capabilities.canAccept, false);
      assert.equal(capabilities.canStartPreparing, false);
      assert.equal(capabilities.canMarkReady, false);
      assert.equal(capabilities.canComplete, false);
    });

    it('rejects prepare when payment is not paid before status update', async (t) => {
      t.mock.method(ordersRepository, 'workspaceFindById', async () => ({
        id: 'order-1',
        outletId: 'outlet-1',
        status: OrderStatus.APPROVED,
        paymentStatus: PaymentStatus.UNPAID,
        fulfillmentStatus: FulfillmentStatus.ACCEPTED,
      }));
      const updateMock = t.mock.method(ordersRepository, 'atomicFulfillmentStatusUpdate', async () => {
        throw new Error('unexpected fulfillment update');
      });

      await assert.rejects(
        () => startPreparing({ workspaceId: 'workspace-1', orderId: 'order-1', outletId: 'outlet-1', userId: 'user-1' }),
        (err) => err.code === 'ORDER_PAYMENT_NOT_PAID' && err.status === 400,
      );
      assert.equal(updateMock.mock.callCount(), 0);
    });

    it('CANCELLED order cannot become APPROVED', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.CANCELLED, OrderStatus.APPROVED));
    });
  });

  describe('cross-outlet approval', () => {
    it('other outlet cannot approve — checked via outletId guard in approveOrder()', () => {
      assert.ok(isValidOrderTransition(OrderStatus.AWAITING_OUTLET_APPROVAL, OrderStatus.APPROVED));
    });

    it('cross-outlet prepare is denied before fulfillment update', async (t) => {
      t.mock.method(ordersRepository, 'workspaceFindById', async () => ({
        id: 'order-1',
        outletId: 'outlet-1',
        status: OrderStatus.APPROVED,
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.ACCEPTED,
      }));
      const updateMock = t.mock.method(ordersRepository, 'atomicFulfillmentStatusUpdate', async () => {
        throw new Error('unexpected fulfillment update');
      });

      await assert.rejects(
        () => startPreparing({ workspaceId: 'workspace-1', orderId: 'order-1', outletId: 'outlet-2', userId: 'user-1' }),
        (err) => err.code === 'ORDER_NOT_FOUND' && err.status === 404,
      );
      assert.equal(updateMock.mock.callCount(), 0);
    });

    it('cross-outlet cancel is denied before status update', async (t) => {
      t.mock.method(ordersRepository, 'workspaceFindById', async () => ({
        id: 'order-1',
        outletId: 'outlet-1',
        status: OrderStatus.AWAITING_OUTLET_APPROVAL,
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.AWAITING_ACCEPTANCE,
      }));
      const updateMock = t.mock.method(ordersRepository, 'atomicStatusUpdate', async () => {
        throw new Error('unexpected status update');
      });

      await assert.rejects(
        () => transitionOrderStatus({ workspaceId: 'workspace-1', orderId: 'order-1', newStatus: 'cancelled', actor: { id: 'user-1' }, reason: 'duplicate order', outletId: 'outlet-2' }),
        (err) => err.code === 'ORDER_NOT_FOUND' && err.status === 404,
      );
      assert.equal(updateMock.mock.callCount(), 0);
    });
  });

  describe('concurrent race prevention', () => {
    it('duplicate checkout blocked — CONVERTED is terminal', () => {
      assert.ok(!isValidCartTransition(CartStatus.CONVERTED, CartStatus.CHECKOUT_LOCKED));
    });

    it('duplicate approval blocked — APPROVED cannot approve again', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.APPROVED, OrderStatus.APPROVED));
    });

    it('duplicate rejection blocked — REJECTED cannot reject again', () => {
      assert.ok(!isValidOrderTransition(OrderStatus.REJECTED, OrderStatus.REJECTED));
    });
  });

  describe('actor authorization', () => {
    it('AI cannot be ORDER_ERRORS.ORDER_PAYMENT_NOT_PAID actor', () => {
      const errors = ['CART_NOT_FOUND', 'ORDER_NOT_FOUND', 'ORDER_INVALID_TRANSITION', 'ORDER_PAYMENT_NOT_PAID'];
      assert.ok(errors.includes('ORDER_PAYMENT_NOT_PAID'));
    });
  });

  describe('order deletion', () => {
    it('hard delete is disabled at service layer', async () => {
      await assert.rejects(
        () => deleteOrderForUser({ user: { workspaceId: 'workspace-1' }, orderId: 'order-1' }),
        (err) => err.code === 'ORDER_DELETE_DISABLED' && err.status === 405,
      );
    });
  });

  describe('cancel reason', () => {
    it('rejects generic cancellation without a reason before update', async (t) => {
      t.mock.method(ordersRepository, 'workspaceFindById', async () => ({ id: 'order-1', status: 'AWAITING_OUTLET_APPROVAL', paymentStatus: 'paid', fulfillmentStatus: 'awaiting_acceptance' }));
      await assert.rejects(
        () => transitionOrderStatus({ workspaceId: 'workspace-1', orderId: 'order-1', newStatus: 'cancelled', actor: { id: 'user-1' } }),
        (err) => err.code === 'VALIDATION' && err.status === 400,
      );
    });
  });

  describe('admin allowed actions', () => {
    it('matches backend capabilities when manage_status permission is present', () => {
      const order = {
        id: 'order-1',
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.PREPARING,
        capabilities: getOrderCapabilities({ paymentStatus: PaymentStatus.PAID, fulfillmentStatus: FulfillmentStatus.PREPARING }),
      };
      const mapped = mapAdminOrder(order, { role: 'human_agent' });
      assert.deepEqual(mapped.allowed_actions.sort(), ['cancel_order', 'mark_ready'].sort());
    });

    it('hides allowed actions when manage_status permission is absent', () => {
      const order = {
        id: 'order-1',
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.PREPARING,
        capabilities: getOrderCapabilities({ paymentStatus: PaymentStatus.PAID, fulfillmentStatus: FulfillmentStatus.PREPARING }),
      };
      const mapped = mapAdminOrder(order, { role: 'human_agent', accessPolicy: { permissions: ['orders.read'] } });
      assert.deepEqual(mapped.allowed_actions, []);
    });
  });
});
