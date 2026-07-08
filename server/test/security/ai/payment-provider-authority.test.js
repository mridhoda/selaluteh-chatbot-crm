import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../..');

describe('AISG payment provider authority', () => {
  it('uses workspace payment runtime config rather than global provider fallback in generic payment flows', () => {
    const paymentService = readFileSync(resolve(PROJECT_ROOT, 'src/services/payment.service.js'), 'utf8');
    const paymentRoutes = readFileSync(resolve(PROJECT_ROOT, 'src/routes/payments.js'), 'utf8');

    assert.doesNotMatch(paymentService, /provider \|\| runtimeConfig\.provider \|\| env\.paymentProvider/);
    assert.doesNotMatch(paymentService, /provider \|\| env\.paymentProvider/);
    assert.match(paymentService, /resolvePaymentProvider\(\{ workspaceId, provider, capability: 'statusQuery' \}\)/);
    assert.match(paymentService, /const activeProvider = resolvedProvider\.provider;/);

    assert.match(paymentRoutes, /const provider = runtime\.provider;/);
    assert.match(paymentRoutes, /const configured = runtime\.configured;/);
    assert.doesNotMatch(paymentRoutes, /runtime\.provider === 'manual' \? env\.paymentProvider : runtime\.provider/);
  });
});
