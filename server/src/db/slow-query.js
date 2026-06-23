import { getSupabaseServiceClient } from '../db/supabase.js';

const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '500', 10);

function noop() {}

const queryWrapper = process.env.NODE_ENV === 'production'
  ? function wrapQuery(label, q) {
      const start = Date.now();
      return q.then(result => {
        const elapsed = Date.now() - start;
        if (elapsed > SLOW_QUERY_THRESHOLD_MS) {
          console.warn(`[SlowQuery] ${label} took ${elapsed}ms`);
        }
        return result;
      }).catch(err => { throw err; });
    }
  : (_label, q) => q;

export { SLOW_QUERY_THRESHOLD_MS, queryWrapper };
