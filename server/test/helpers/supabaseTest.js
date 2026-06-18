/**
 * supabaseTest.js
 *
 * Test helper for Supabase-backed repository tests.
 *
 * SECURITY: Automated tests must NEVER use the production Supabase project.
 * Set the following env vars for your Supabase local instance or dedicated test project:
 *
 *   SUPABASE_TEST_URL=http://localhost:54321          # Supabase local API URL
 *   SUPABASE_TEST_SERVICE_ROLE_KEY=<test-service-key> # Test project service role key
 *
 * If these are not set, all Supabase repository tests will be skipped gracefully.
 *
 * HOW TO SET UP SUPABASE LOCAL:
 *   1. Install Supabase CLI: npm install -g supabase
 *   2. supabase init (in project root)
 *   3. supabase start
 *   4. Copy the "API URL" and "service_role key" from the output
 *   5. Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY in server/.env
 *   6. Apply migrations: supabase db push (or run SQL files manually in Supabase Studio)
 *
 * HOW TO USE IN A TEST FILE:
 *   import { getTestClient, skipIfNoTestDb, cleanTable } from '../../helpers/supabaseTest.js';
 *
 *   const { skip, client } = skipIfNoTestDb();
 *   if (skip) process.exit(0); // or use describe.skip pattern
 *
 *   describe('my repo tests', () => {
 *     beforeEach(async () => await cleanTable(client, 'users', TEST_WORKSPACE_ID));
 *     ...
 *   });
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const TEST_URL = process.env.SUPABASE_TEST_URL || '';
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || '';

if (process.env.NODE_ENV === 'test' && TEST_URL && TEST_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_URL ||= TEST_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= TEST_SERVICE_ROLE_KEY;
  process.env.SUPABASE_DATABASE_URL ||= 'postgresql://supabase-test-placeholder';
}

/**
 * Whether the Supabase test project is configured.
 * Tests will skip gracefully if this is false.
 */
export const isTestDbConfigured = Boolean(TEST_URL && TEST_SERVICE_ROLE_KEY);

let testClient = null;

/**
 * Get the Supabase test client.
 * Throws if test env vars are not configured.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getTestClient() {
  if (!isTestDbConfigured) {
    throw new Error(
      'Supabase test project is not configured.\n' +
        'Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY in server/.env.\n' +
        'See server/test/helpers/supabaseTest.js for setup instructions.',
    );
  }
  if (!testClient) {
    testClient = createClient(TEST_URL, TEST_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return testClient;
}

/**
 * Check if Supabase test DB is available. If not, return a skip flag.
 * Use this at the top of test files to skip gracefully.
 *
 * @returns {{ skip: boolean, client: import('@supabase/supabase-js').SupabaseClient | null, reason: string }}
 */
export function skipIfNoTestDb() {
  if (!isTestDbConfigured) {
    const reason =
      'SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY are not set. ' +
      'Supabase repository tests are skipped. ' +
      'See server/test/helpers/supabaseTest.js for setup instructions.';
    return { skip: true, client: null, reason };
  }
  return { skip: false, client: getTestClient(), reason: '' };
}

/**
 * Delete all rows in a table matching the given workspace_id.
 * Use in beforeEach to isolate test state.
 *
 * WARNING: Only use against the test project, never production.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} client - test client
 * @param {string} table - table name (snake_case)
 * @param {string} workspaceId - test workspace UUID to clean up
 */
export async function cleanTable(client, table, workspaceId) {
  const { error } = await client.from(table).delete().eq('workspace_id', workspaceId);
  if (error) {
    throw new Error(`cleanTable(${table}, ${workspaceId}) failed: ${error.message}`);
  }
}

/**
 * Delete all rows in a table with no workspace_id filter (for top-level tables like workspaces).
 * Pass a list of IDs to delete only specific rows.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {string} table
 * @param {string[]} ids - UUIDs to delete
 */
export async function cleanRows(client, table, ids) {
  if (!ids || ids.length === 0) return;
  const { error } = await client.from(table).delete().in('id', ids);
  if (error) {
    throw new Error(`cleanRows(${table}) failed: ${error.message}`);
  }
}

/**
 * Generate a random UUID v4 string for use as test IDs.
 * Uses the Node.js crypto module.
 *
 * @returns {string}
 */
export function testUuid() {
  return crypto.randomUUID();
}
