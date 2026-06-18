/**
 * auth.repository.js — Supabase-backed
 *
 * Handles OTP and password reset persistence using Supabase/Postgres.
 * Part of task 24.7 — auth domain cutover.
 *
 * DB tables: otps, password_resets
 *
 * SECURITY:
 * - OTP codes are never logged.
 * - Password reset tokens are single-use and time-limited.
 * - consumedAt is set on use, not deleted, to allow audit queries.
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle, extractData } from '../supabase-errors.js';

/**
 * @typedef {Object} OtpRecord
 * @property {string} id
 * @property {string} email
 * @property {string} code
 * @property {string} expiresAt
 * @property {string|null} consumedAt
 * @property {string} createdAt
 */

/**
 * @typedef {Object} PasswordResetRecord
 * @property {string} id
 * @property {string} userId
 * @property {string} token
 * @property {string} expiresAt
 * @property {string|null} consumedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const authSupabaseRepository = {
  // -------------------------------------------------------------------------
  // OTP
  // -------------------------------------------------------------------------

  /**
   * Create a new OTP for an email address.
   * Caller is responsible for sending the OTP via email/SMS.
   *
   * @param {{ email: string, code: string, expiresAt: string|Date }} param
   * @returns {Promise<OtpRecord>}
   */
  async createOtp({ email, code, expiresAt }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from('otps')
      .insert({
        email: email.toLowerCase().trim(),
        code,
        expires_at: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
      })
      .select()
      .single();
    const row = extractSingle(result, 'auth.createOtp');
    return mapRow(row);
  },

  /**
   * Find the most recent OTP for an email address.
   * Returns null if not found.
   *
   * @param {string} email
   * @returns {Promise<OtpRecord|null>}
   */
  async findLatestOtp(email) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from('otps')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = extractSingle(result, 'auth.findLatestOtp');
    return row ? mapRow(row) : null;
  },

  /**
   * Mark an OTP as consumed and delete all OTPs for that email.
   * Deletes all OTPs for the email (cleanup).
   *
   * @param {string} email
   * @returns {Promise<void>}
   */
  async consumeAndCleanOtps(email) {
    const client = getSupabaseServiceClient();
    await client.from('otps').delete().eq('email', email.toLowerCase().trim());
  },

  // -------------------------------------------------------------------------
  // Password Reset
  // -------------------------------------------------------------------------

  /**
   * Delete all existing password reset tokens for a user.
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteResetTokensByUser(userId) {
    const client = getSupabaseServiceClient();
    await client.from('password_resets').delete().eq('user_id', userId);
  },

  /**
   * Create a new password reset token for a user.
   *
   * @param {{ userId: string, token: string, expiresAt: string|Date }} param
   * @returns {Promise<PasswordResetRecord>}
   */
  async createResetToken({ userId, token, expiresAt }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from('password_resets')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
      })
      .select()
      .single();
    const row = extractSingle(result, 'auth.createResetToken');
    return mapRow(row);
  },

  /**
   * Find a password reset token.
   * Returns null if not found.
   *
   * @param {string} token
   * @returns {Promise<PasswordResetRecord|null>}
   */
  async findResetToken(token) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .is('consumed_at', null)
      .maybeSingle();
    const row = extractSingle(result, 'auth.findResetToken');
    return row ? mapRow(row) : null;
  },

  /**
   * Mark a reset token as consumed and delete it.
   *
   * @param {string} id - UUID of the password_resets row
   * @returns {Promise<void>}
   */
  async consumeResetToken(id) {
    const client = getSupabaseServiceClient();
    await client.from('password_resets').delete().eq('id', id);
  },
};
