/**
 * auto-escalate-complaints/escalation-scheduler.repository.js
 * Spec: auto-escalate-complaints — Task Section 12
 *
 * Scheduled job persistence for delayed escalation triggers.
 * All jobs are workspace-scoped.
 * Idempotency key prevents duplicate scheduling.
 */

import { getSupabaseServiceClient } from '../../db/supabase.js';
import { mapRow, mapRows } from '../../db/supabase-mapper.js';
import { extractData, extractSingle } from '../../db/supabase-errors.js';
import { requireWorkspaceId } from '../../db/supabase-query.js';

const TABLE = 'complaint_escalation_scheduled_jobs';

export const escalationSchedulerRepository = {
  /**
   * Enqueue a delayed escalation job idempotently.
   * Returns existing job if idempotency_key already exists.
   */
  async enqueue({ workspaceId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();

    const insert = {
      workspace_id: workspaceId,
      complaint_id: data.complaintId,
      policy_id: data.policyId,
      policy_version: data.policyVersion,
      trigger_type: data.triggerType,
      due_at: data.dueAt,
      status: 'PENDING',
      expected_complaint_version: data.expectedComplaintVersion ?? null,
      idempotency_key: data.idempotencyKey,
      attempt_count: 0,
    };

    const result = await client
      .from(TABLE)
      .upsert(insert, { onConflict: 'workspace_id,idempotency_key', ignoreDuplicates: true })
      .select()
      .single();

    const row = extractSingle(result, 'escalationScheduler.enqueue');
    return mapRow(row);
  },

  /**
   * Claim next due pending job for processing.
   * Returns null if no job is ready.
   * Uses a simple "claim by updating status" pattern.
   */
  async claimNextDue({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const now = new Date().toISOString();

    // Find first due pending job
    const { data: job } = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'PENDING')
      .lte('due_at', now)
      .order('due_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!job) return null;

    // Claim it
    const { data: claimed } = await client
      .from(TABLE)
      .update({ status: 'RUNNING', attempt_count: (job.attempt_count ?? 0) + 1, updated_at: now })
      .eq('id', job.id)
      .eq('status', 'PENDING') // concurrency guard
      .select()
      .maybeSingle();

    return claimed ? mapRow(claimed) : null;
  },

  async markCompleted({ workspaceId, jobId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client
      .from(TABLE)
      .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', jobId);
  },

  async markSkipped({ workspaceId, jobId, reason }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client
      .from(TABLE)
      .update({ status: 'SKIPPED', last_error_code: reason ?? null, updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', jobId);
  },

  async markFailed({ workspaceId, jobId, errorCode }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    await client
      .from(TABLE)
      .update({ status: 'FAILED', last_error_code: errorCode ?? null, updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', jobId);
  },

  /**
   * Reset RUNNING jobs back to PENDING (for crash recovery).
   */
  async resetStuckRunning({ workspaceId, olderThanMinutes = 30 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const cutoff = new Date(Date.now() - olderThanMinutes * 60000).toISOString();
    await client
      .from(TABLE)
      .update({ status: 'PENDING', updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('status', 'RUNNING')
      .lte('updated_at', cutoff);
  },
};
