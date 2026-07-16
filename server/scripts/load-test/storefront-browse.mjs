import { performance } from 'node:perf_hooks';

const USERS = parseInteger('LOAD_TEST_USERS', 50, 1, 100);
const ROUNDS = parseInteger('LOAD_TEST_ROUNDS', 1, 1, 20);
const TIMEOUT_MS = parseInteger('LOAD_TEST_TIMEOUT_MS', 10_000, 1_000, 60_000);
const baseUrl = requireUrl('LOAD_TEST_BASE_URL');
const storefrontSlug = requireString('LOAD_TEST_STOREFRONT_SLUG');
const stats = new Map();

function requireString(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parseInteger(name, fallback, min, max) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer between ${min} and ${max}`);
  return value;
}

function requireUrl(name) {
  const url = new URL(requireString(name));
  const localAllowed = process.env.LOAD_TEST_ALLOW_LOCAL === 'true';
  const privateHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1' || /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);
  if ((!localAllowed && (url.protocol !== 'https:' || privateHost)) || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must be an HTTPS public URL. Set LOAD_TEST_ALLOW_LOCAL=true for local HTTP testing.`);
  }
  return url;
}

function endpoint(pathname, params = {}) {
  const url = new URL(pathname, baseUrl);
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
  return url;
}

function metric(name) {
  if (!stats.has(name)) stats.set(name, { attempts: 0, durations: [], bytes: 0, errors: new Map(), cache: new Map() });
  return stats.get(name);
}

async function get(name, url) {
  const startedAt = performance.now();
  const entry = metric(name);
  entry.attempts += 1;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: 'application/json,image/avif,image/webp,image/*,*/*;q=0.8' } });
    const body = new Uint8Array(await response.arrayBuffer());
    const duration = performance.now() - startedAt;
    entry.durations.push(duration);
    entry.bytes += Number(response.headers.get('content-length')) || body.byteLength;
    const cacheStatus = response.headers.get('cf-cache-status') || 'absent';
    entry.cache.set(cacheStatus, (entry.cache.get(cacheStatus) || 0) + 1);
    if (!response.ok) entry.errors.set(`HTTP ${response.status}`, (entry.errors.get(`HTTP ${response.status}`) || 0) + 1);
    return { response, body, ok: response.ok };
  } catch (error) {
    entry.errors.set(error.name === 'TimeoutError' ? 'timeout' : 'network error', (entry.errors.get(error.name === 'TimeoutError' ? 'timeout' : 'network error') || 0) + 1);
    return { ok: false };
  }
}

function parseJson(body) {
  try { return JSON.parse(new TextDecoder().decode(body)); } catch { return null; }
}

function productsFrom(data) {
  return Array.isArray(data?.products) ? data.products : Array.isArray(data?.menu?.products) ? data.menu.products : [];
}

function publicImageUrl(product) {
  const value = String(product?.image_url || product?.imageUrl || '');
  return value.startsWith('/public-files/') ? value : null;
}

async function simulateUser() {
  const bootstrap = await get('bootstrap', endpoint(`/api/v1/public/storefronts/${encodeURIComponent(storefrontSlug)}/bootstrap`));
  const bootstrapData = bootstrap.ok ? parseJson(bootstrap.body) : null;
  const outletId = bootstrapData?.outlets?.[0]?.id || bootstrapData?.storefront?.outlet?.id;
  if (!outletId) return;

  const minuman = await get('menu:minuman', endpoint(`/api/v1/public/storefronts/${encodeURIComponent(storefrontSlug)}/menu`, { outlet_id: outletId, category: 'cat_minuman', page: '0', limit: '24' }));
  const makanan = await get('menu:makanan', endpoint(`/api/v1/public/storefronts/${encodeURIComponent(storefrontSlug)}/menu`, { outlet_id: outletId, category: 'cat_makanan', page: '0', limit: '24' }));
  const minumanData = minuman.ok ? parseJson(minuman.body) : null;
  const makananData = makanan.ok ? parseJson(makanan.body) : null;
  const imageUrls = [
    publicImageUrl(productsFrom(minumanData).find((product) => publicImageUrl(product))),
    publicImageUrl(productsFrom(makananData).find((product) => publicImageUrl(product))),
  ].filter(Boolean);
  await Promise.all(imageUrls.map((imageUrl) => get('image', new URL(imageUrl, baseUrl))));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
}

function printSummary() {
  let failures = 0;
  console.log(`\nStorefront browse test: ${USERS} concurrent users x ${ROUNDS} round(s), timeout ${TIMEOUT_MS}ms`);
  console.log('endpoint\trequests\tok\tp50\tp95\tp99\tavg\tbytes\tcache\terrors');
  for (const [name, entry] of stats) {
    const requestCount = entry.attempts;
    const errorCount = [...entry.errors.values()].reduce((sum, count) => sum + count, 0);
    const average = entry.durations.reduce((sum, value) => sum + value, 0) / (entry.durations.length || 1);
    const p95 = percentile(entry.durations, 0.95);
    const thresholdFailed = entry.durations.length > 0 && p95 > 2_000;
    failures += errorCount + Number(thresholdFailed);
    const cache = [...entry.cache].map(([key, count]) => `${key}:${count}`).join(',') || '-';
    const errors = [...entry.errors].map(([key, count]) => `${key}:${count}`).join(',') || '-';
    console.log(`${name}\t${requestCount}\t${requestCount - errorCount}\t${percentile(entry.durations, 0.5).toFixed(0)}ms\t${p95.toFixed(0)}ms\t${percentile(entry.durations, 0.99).toFixed(0)}ms\t${average.toFixed(0)}ms\t${entry.bytes}\t${cache}\t${thresholdFailed ? `${errors},p95>2000ms` : errors}`);
  }
  if (failures) process.exitCode = 1;
}

for (let round = 0; round < ROUNDS; round += 1) await Promise.all(Array.from({ length: USERS }, simulateUser));
printSummary();
