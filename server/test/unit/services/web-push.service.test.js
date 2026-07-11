import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('paid orders use the dedicated paid push sender', async () => {
  const source = await readFile(new URL('../../../src/services/order.service.js', import.meta.url), 'utf8');
  assert.match(source, /import \{ sendOrderCreatedPush, sendOrderPaidPush \} from '\.\/web-push\.service\.js';/);
  assert.match(source, /sendOrderPaidPush\(\{ workspaceId, outletId, order \}\)/);
});

test('paid push payload identifies the order.paid event', async () => {
  const source = await readFile(new URL('../../../src/services/web-push.service.js', import.meta.url), 'utf8');
  assert.match(source, /export async function sendOrderPaidPush\(\{ workspaceId, outletId, order \}\) \{\s*return sendOrderPush\(\{ workspaceId, outletId, order, type: 'order\.paid', title: 'Pesanan sudah dibayar' \}\);/);
});
