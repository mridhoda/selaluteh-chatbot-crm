/**
 * auto-escalate-complaints/escalation-scheduler.worker.js
 * Spec: auto-escalate-complaints — Task Section 12
 *
 * Background worker that processes delayed escalation jobs.
 * Runs in-process (MVP). Jobs can be lost if server crashes.
 *
 * Worker rules (design.md § 13):
 *   load job → verify due → verify expected complaint/policy version
 *   → re-evaluate effective context → execute idempotently → mark completed/skipped/failed
 *
 * Idempotency: All escalation creation calls are idempotent via idempotency_key.
 * Stale jobs: skipped when complaint/policy version has changed.
 */

import { escalationSchedulerRepository } from '../services/auto-escalate-complaints/escalation-scheduler.repository.js';
import { evaluateComplaintForEscalation } from '../services/auto-escalate-complaints/escalation-evaluator.service.js';
import { SCHEDULED_JOB_TYPE } from '../services/auto-escalate-complaints/constants.js';
import { getSupabaseServiceClient } from '../db/supabase.js';

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute
let timer;

/**
 * Start the scheduler worker.
 * Only processes jobs for workspaces that have jobs due.
 */
export function startEscalationScheduler() {
  console.log('[escalation-scheduler] Starting...');
  timer = setInterval(runCycle, POLL_INTERVAL_MS);
  // Run immediately on start
  runCycle().catch(err => console.error('[escalation-scheduler] Startup cycle error:', err.message));
}

export function stopEscalationScheduler() {
  if (timer) clearInterval(timer);
}

async function runCycle() {
  try {
    const workspaceIds = await getWorkspacesWithPendingJobs();
    for (const workspaceId of workspaceIds) {
      await processWorkspaceJobs(workspaceId);
    }
  } catch (err) {
    console.error('[escalation-scheduler] Cycle error:', err.message);
  }
}

async function processWorkspaceJobs(workspaceId) {
  // Process up to 10 jobs per workspace per cycle (bounded execution)
  for (let i = 0; i < 10; i++) {
    const job = await escalationSchedulerRepository.claimNextDue({ workspaceId });
    if (!job) break;

    try {
      const result = await processJob(workspaceId, job);
      if (result.skipped) {
        await escalationSchedulerRepository.markSkipped({ workspaceId, jobId: job.id, reason: result.reason });
      } else {
        await escalationSchedulerRepository.markCompleted({ workspaceId, jobId: job.id });
      }
    } catch (err) {
      console.error(`[escalation-scheduler] Job ${job.id} failed:`, err.message);
      await escalationSchedulerRepository.markFailed({
        workspaceId,
        jobId: job.id,
        errorCode: err.code ?? 'UNKNOWN_ERROR',
      });
    }
  }
}

async function processJob(workspaceId, job) {
  const triggerType = job.triggerType ?? job.trigger_type;
  const complaintId = job.complaintId ?? job.complaint_id;
  const expectedComplaintVersion = job.expectedComplaintVersion ?? job.expected_complaint_version;

  // Verify job is for a trigger type we handle
  const scheduledTypes = Object.values(SCHEDULED_JOB_TYPE);
  if (!scheduledTypes.includes(triggerType)) {
    return { skipped: true, reason: 'UNKNOWN_TRIGGER_TYPE' };
  }

  // Evaluate the complaint for escalation (idempotent)
  const { result } = await evaluateComplaintForEscalation({
    workspaceId,
    complaintId,
    expectedVersion: expectedComplaintVersion,
    triggerHint: triggerType,
  });

  console.log(`[escalation-scheduler] Job ${job.id} (${triggerType}): ${result}`);
  return { skipped: false };
}

async function getWorkspacesWithPendingJobs() {
  const client = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { data } = await client
    .from('complaint_escalation_scheduled_jobs')
    .select('workspace_id')
    .eq('status', 'PENDING')
    .lte('due_at', now);

  if (!data) return [];
  return [...new Set(data.map(r => r.workspace_id))];
}
