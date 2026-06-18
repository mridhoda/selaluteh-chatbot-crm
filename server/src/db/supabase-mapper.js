/**
 * supabase-mapper.js
 *
 * Bidirectional mapping helpers between camelCase app objects and
 * snake_case Supabase/Postgres database rows.
 *
 * Rules:
 * - App layer always uses camelCase.
 * - Database layer always uses snake_case.
 * - Null values are preserved as-is.
 * - Nested objects are NOT recursively mapped (use explicit field mapping for those).
 * - UUID fields are strings in both layers.
 * - Timestamp fields are ISO strings or Date objects; no coercion here.
 */

/**
 * Convert a camelCase string to snake_case.
 * Example: "workspaceId" → "workspace_id"
 */
export function camelToSnake(str) {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

/**
 * Convert a snake_case string to camelCase.
 * Example: "workspace_id" → "workspaceId"
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Map a plain camelCase object to a snake_case object for DB insertion.
 * Skips undefined values. Preserves null.
 *
 * @param {Record<string, unknown>} obj - camelCase app object
 * @returns {Record<string, unknown>} snake_case DB row fields
 */
export function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    result[camelToSnake(key)] = value;
  }
  return result;
}

/**
 * Map a snake_case DB row to a camelCase app object.
 * Skips undefined values. Preserves null.
 *
 * @param {Record<string, unknown>} row - snake_case DB row
 * @returns {Record<string, unknown>} camelCase app object
 */
export function toCamelCase(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    result[snakeToCamel(key)] = value;
  }
  return result;
}

/**
 * Alias for toCamelCase — map a single DB row to an app object.
 */
export const mapRow = toCamelCase;

/**
 * Map an array of DB rows to an array of app objects.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @returns {Array<Record<string, unknown>>}
 */
export function mapRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(toCamelCase);
}
