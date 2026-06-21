/**
 * Test Nominatim (OpenStreetMap) API — gratis, tanpa API key.
 * Usage: node scripts/test-nominatim.mjs
 */
const BASE = 'https://nominatim.openstreetmap.org';

async function test(query, label) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=3&countrycodes=id&addressdetails=1`;
  console.log(`\n📌 ${label}: "${query}"`);
  const res = await fetch(url, { headers: { 'User-Agent': 'SelaluTehTest/1.0' } });
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    console.log('   ❌ No results');
    return;
  }
  data.slice(0, 2).forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.display_name?.split(',')[0]} → (${item.lat}, ${item.lon}) [${item.type || '?'}]`);
  });
  console.log(`   ✅ ${data.length} result(s)`);
}

async function main() {
  console.log('=== Test Nominatim API (OpenStreetMap) ===');
  await test('Jalan Biawan, Samarinda', 'Street + City');
  await test('Air Putih, Samarinda', 'Area + City');
  await test('Big Mall, Samarinda', 'Landmark + City');
  await test('Samarinda', 'City only');
  console.log('\n✅ Done. Nominatim is fully free, no API key needed.');
}

main().catch(err => console.error('Error:', err.message));
