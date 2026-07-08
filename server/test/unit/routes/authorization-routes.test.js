import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import productsRouter from '../../../src/routes/products.js';
import outletsRouter from '../../../src/routes/outlets.js';
import ordersRouter from '../../../src/routes/orders.js';
import adminOrdersRouter from '../../../src/routes/admin-orders.js';
import publicStoreRouter from '../../../src/routes/public-store.js';
import paymentsRouter from '../../../src/routes/payments.js';
import workspaceSettingsRouter from '../../../src/routes/workspace-settings.js';
import platformsRouter from '../../../src/routes/platforms.js';
import inventoryRouter from '../../../src/routes/inventory.js';

function getRouteMiddlewares(router, method, routePath) {
  const layer = router.stack.find((entry) => entry.route && entry.route.path === routePath && entry.route.methods[method]);
  assert.ok(layer, `route ${method.toUpperCase()} ${routePath} exists`);
  return layer.route.stack.map((stack) => stack.handle).filter((fn) => fn.permission);
}

function getRouteLayer(router, method, routePath) {
  const layer = router.stack.find((entry) => entry.route && entry.route.path === routePath && entry.route.methods[method]);
  assert.ok(layer, `route ${method.toUpperCase()} ${routePath} exists`);
  return layer;
}

function getPermissionMiddlewares(router, method, routePath) {
  return getRouteLayer(router, method, routePath).route.stack.map((stack) => stack.handle).filter((fn) => fn.permission);
}

describe('critical route authorization coverage', () => {
  it('protects products critical routes', () => {
    assert.ok(getRouteMiddlewares(productsRouter, 'get', '/').length > 0);
    assert.ok(getRouteMiddlewares(productsRouter, 'post', '/').length > 0);
  });

  it('protects outlets critical routes', () => {
    assert.ok(getRouteMiddlewares(outletsRouter, 'get', '/').length > 0);
    assert.ok(getRouteMiddlewares(outletsRouter, 'get', '/:outletId').length > 0);
  });

  it('protects orders critical routes', () => {
    assert.ok(getRouteMiddlewares(ordersRouter, 'get', '/').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'patch', '/:id/status').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'post', '/:id/accept').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'post', '/:id/start-preparing').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'post', '/:id/mark-ready').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'post', '/:id/complete').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'post', '/:id/cancel').length > 0);
    assert.ok(getRouteMiddlewares(ordersRouter, 'delete', '/:id').length > 0);
  });

  it('protects Phase 2 admin order aliases', () => {
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'get', '/').length > 0);
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'get', '/:orderId').length > 0);
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'post', '/:orderId/accept').length > 0);
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'post', '/:orderId/prepare').length > 0);
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'post', '/:orderId/ready').length > 0);
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'post', '/:orderId/complete').length > 0);
    assert.ok(getPermissionMiddlewares(adminOrdersRouter, 'post', '/:orderId/cancel').length > 0);
  });

  it('keeps Phase 2 public store routes intentionally unauthenticated', () => {
    const routes = [
      ['get', '/stores/:storefrontSlug'],
      ['get', '/qr/:qrToken'],
      ['post', '/carts/validate'],
      ['post', '/checkout'],
      ['get', '/payments/:paymentId/status'],
      ['get', '/orders/:publicOrderToken'],
    ];
    for (const [method, path] of routes) {
      assert.equal(getPermissionMiddlewares(publicStoreRouter, method, path).length, 0, `${method.toUpperCase()} ${path} should not require admin permission middleware`);
    }
  });

  it('protects payments critical routes', () => {
    assert.ok(getRouteMiddlewares(paymentsRouter, 'get', '/').length > 0);
    assert.ok(getRouteMiddlewares(paymentsRouter, 'post', '/reconciliation/:paymentId').length > 0);
  });

  it('protects settings critical routes', () => {
    assert.ok(getRouteMiddlewares(workspaceSettingsRouter, 'get', '/settings/:category').length > 0);
    assert.ok(getRouteMiddlewares(workspaceSettingsRouter, 'put', '/settings/:category').length > 0);
  });

  it('protects platform critical routes', () => {
    assert.ok(getRouteMiddlewares(platformsRouter, 'get', '/').length > 0);
    assert.ok(getRouteMiddlewares(platformsRouter, 'post', '/:id/test').length > 0);
  });

  it('protects inventory critical routes', () => {
    assert.ok(getRouteMiddlewares(inventoryRouter, 'get', '/').length > 0);
    assert.ok(getRouteMiddlewares(inventoryRouter, 'post', '/transfer').length > 0);
  });
});
