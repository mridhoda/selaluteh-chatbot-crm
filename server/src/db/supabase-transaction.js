/**
 * supabase-transaction.js
 *
 * Transaction conventions for Supabase-backed repositories.
 *
 * WHY: The Supabase JS client does not support multi-statement transactions natively.
 * For atomic multi-table mutations (e.g., checkout → create order + order_items + mark cart),
 * we use a direct Postgres connection via the `pg` package with SUPABASE_DATABASE_URL.
 *
 * SECURITY: SUPABASE_DATABASE_URL is backend-only.
 * It must never be exposed to frontend, Git, logs, test fixtures, or docs with real values.
 *
 * USAGE:
 *   import { withTransaction } from '../db/supabase-transaction.js';
 *   const result = await withTransaction(async (client) => {
 *     await client.query('INSERT INTO orders ...', [...]);
 *     await client.query('INSERT INTO order_items ...', [...]);
 *     return { orderId: '...' };
 *   });
 *
 * ALTERNATIVE (for simple atomic ops): use Supabase RPC (stored procedure).
 * Prefer RPC when the atomic logic is simple enough to encode in SQL.
 * Prefer withTransaction when the atomic logic requires app-level computation.
 */

import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

let pool = null;

/**
 * Lazily initialize the pg connection pool using SUPABASE_DATABASE_URL.
 * Only called when a transaction is actually needed.
 *
 * @returns {import('pg').Pool}
 */
function getPool() {
  if (pool) return pool;

  // Dynamic import to avoid hard dependency if pg is not installed
  // The pg package is required for transactions — install: npm install pg
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = (await import('pg')).default ?? require('pg'); // handled below in async wrapper
    pool = new Pool({
      connectionString: env.supabaseDatabaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    return pool;
  } catch (err) {
    throw new AppError(
      'TRANSACTION_UNAVAILABLE',
      'Postgres pool unavailable. Ensure pg is installed and SUPABASE_DATABASE_URL is set.',
      500,
      {},
      err,
    );
  }
}

/**
 * Lazily initialize the pg connection pool (async version).
 * Handles dynamic import of pg module.
 *
 * @returns {Promise<import('pg').Pool>}
 */
async function getPoolAsync() {
  if (pool) return pool;

  if (!env.supabaseDatabaseUrl) {
    throw new AppError(
      'TRANSACTION_UNAVAILABLE',
      'SUPABASE_DATABASE_URL is required for transactions.',
      500,
    );
  }

  let Pool;
  try {
    const pg = await import('pg');
    Pool = pg.default?.Pool ?? pg.Pool;
  } catch (err) {
    throw new AppError(
      'TRANSACTION_UNAVAILABLE',
      'pg package is not installed. Run: npm install pg',
      500,
      {},
      err,
    );
  }

  pool = new Pool({
    connectionString: env.supabaseDatabaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

/**
 * Run a function inside a Postgres transaction.
 * On success: COMMIT. On error: ROLLBACK then rethrow.
 *
 * The callback receives a pg PoolClient. Use client.query() for SQL.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 *
 * @example
 * const result = await withTransaction(async (client) => {
 *   const { rows: [order] } = await client.query(
 *     'INSERT INTO orders (workspace_id, ...) VALUES ($1, ...) RETURNING *',
 *     [workspaceId, ...],
 *   );
 *   await client.query(
 *     'INSERT INTO order_items (order_id, ...) VALUES ($1, ...) ',
 *     [order.id, ...],
 *   );
 *   return order;
 * });
 */
export async function withTransaction(fn) {
  const p = await getPoolAsync();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof AppError) throw err;
    throw new AppError('TRANSACTION_ERROR', 'Transaction failed and was rolled back', 500, {}, err);
  } finally {
    client.release();
  }
}

/**
 * Gracefully close the pg pool on shutdown.
 * Call this from the graceful shutdown handler.
 */
export async function closePgPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
