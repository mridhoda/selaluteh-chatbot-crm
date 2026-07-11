import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../src/', import.meta.url);

test('public customer account and history routes remain disabled', async () => {
  const source = await readFile(new URL('routes/public-store.js', root), 'utf8');
  assert.doesNotMatch(source, /router\.(post|get)\('\/customer\/(login|register)|router\.get\('\/customer-orders/);
});

test('public payment polling requires the matching order capability token', async () => {
  const source = await readFile(new URL('services/public-storefront.service.js', root), 'utf8');
  assert.match(source, /if \(!publicOrderToken\) throw new AppError\('PAYMENT_NOT_FOUND'/);
  assert.match(source, /order\.publicOrderToken\) !== String\(publicOrderToken\)/);
});

test('public rate limits do not trust client forwarded headers', async () => {
  const source = await readFile(new URL('middleware/rate-limit.js', root), 'utf8');
  assert.match(source, /return String\(req\.ip \|\| 'unknown'\)/);
  assert.doesNotMatch(source, /x-forwarded-for/);
});

test('payment settlement preserves terminal order states', async () => {
  const source = await readFile(new URL('services/payment-webhook.service.js', root), 'utf8');
  assert.match(source, /function isTerminalOrder\(order\)/);
  assert.match(source, /if \(isTerminalOrder\(order\)\) return order/);
});
