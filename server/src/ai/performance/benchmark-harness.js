import { FixedClock } from '../../../test/helpers/ai/clock.js';

export async function benchmarkOperation(label, fn, iterations = 10) {
  const latencies = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const elapsed = performance.now() - start;
    latencies.push(elapsed);
  }
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  return { label, avg, p50, p95, min: latencies[0], max: latencies[latencies.length - 1], samples: latencies.length };
}

export async function runBaseline({ contextBuilder, sessionService, retriever }) {
  const results = [];
  if (contextBuilder) {
    results.push(await benchmarkOperation('context_build', () => contextBuilder({ chat: { id: 'bench-test' }, recentMessages: [] }), 5));
  }
  return results;
}
