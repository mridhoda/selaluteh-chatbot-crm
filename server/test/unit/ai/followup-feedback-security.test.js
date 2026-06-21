import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canSendProactive, scheduleFollowup, cancelFollowup, processDueFollowups,
} from '../../../src/ai/memory/followup-service.js';
import { validateFeedback, submitFeedback } from '../../../src/ai/orchestration/feedback-service.js';
import { IMMUTABLE_SAFETY_RULES, formatSafetyPolicy, PROMPT_INJECTION_TEST_CORPUS } from '../../../src/ai/security/safety-policy.js';
import { createJob, claimJob, completeJob, failJob } from '../../../src/ai/orchestration/job-envelope.js';

describe('followupService', () => {
  it('allows transactional with consent', () => {
    const r = canSendProactive({ eventType: 'payment_reminder', consent: true, optOut: false });
    assert.equal(r.allowed, true);
  });

  it('allows transactional even without consent', () => {
    const r = canSendProactive({ eventType: 'payment_reminder', consent: false, optOut: false });
    assert.equal(r.allowed, true);
  });

  it('blocks marketing without consent', () => {
    const r = canSendProactive({ eventType: 'feedback_request', consent: false, optOut: false });
    assert.equal(r.allowed, false);
    assert.equal(r.reason, 'no_consent');
  });

  it('blocks when opt-out', () => {
    const r = canSendProactive({ eventType: 'payment_reminder', consent: true, optOut: true });
    assert.equal(r.allowed, false);
    assert.equal(r.reason, 'opt_out');
  });

  it('schedules follow-up', () => {
    const r = scheduleFollowup({ workspaceId: 'ws-1', contactId: 'c-1', eventType: 'payment_reminder', dedupeKey: 'pay-1' });
    assert.equal(r.success, true);
    assert.equal(r.job.status, 'scheduled');
  });

  it('rejects duplicate dedupe key', () => {
    const r = scheduleFollowup({ workspaceId: 'ws-1', contactId: 'c-1', eventType: 'payment_reminder', dedupeKey: 'dup-1' });
    assert.equal(r.success, true);
    const r2 = scheduleFollowup({ workspaceId: 'ws-1', contactId: 'c-1', eventType: 'payment_reminder', dedupeKey: 'dup-1' });
    assert.equal(r2.success, false);
    assert.equal(r2.reason, 'duplicate');
  });

  it('cancels follow-up', () => {
    scheduleFollowup({ workspaceId: 'ws-1', contactId: 'c-1', eventType: 'payment_reminder', dedupeKey: 'cancel-1' });
    const r = cancelFollowup({ dedupeKey: 'cancel-1' });
    assert.equal(r.success, true);
  });
});

describe('feedbackService', () => {
  it('accepts valid feedback', () => {
    const v = validateFeedback({ rating: 4, reasonCode: 'correct' });
    assert.equal(v.valid, true);
  });

  it('rejects invalid rating', () => {
    const v = validateFeedback({ rating: 6 });
    assert.equal(v.valid, false);
  });

  it('rejects invalid reason code', () => {
    const v = validateFeedback({ reasonCode: 'invalid_code' });
    assert.equal(v.valid, false);
  });

  it('allows null rating', () => {
    const v = validateFeedback({ rating: null });
    assert.equal(v.valid, true);
  });
});

describe('safetyPolicy', () => {
  it('has 8 immutable rules', () => {
    assert.equal(IMMUTABLE_SAFETY_RULES.length, 8);
  });

  it('formatSafetyPolicy returns non-empty string', () => {
    const output = formatSafetyPolicy();
    assert.ok(output.includes('CRITICAL'));
    assert.ok(output.includes('payment'));
  });

  it('prompt injection corpus has 10 entries', () => {
    assert.equal(PROMPT_INJECTION_TEST_CORPUS.length, 10);
  });

  it('injection corpus includes mark_paid injection', () => {
    const hasMarkPaid = PROMPT_INJECTION_TEST_CORPUS.some((c) => c.input.includes('mark paid'));
    assert.equal(hasMarkPaid, true);
  });
});

describe('jobEnvelope', () => {
  it('creates job with dedupe key', () => {
    const r = createJob({ workspaceId: 'ws-1', type: 'summary', reference: 'chat-1', dedupeKey: 'sum-chat-1', payload: {} });
    assert.equal(r.success, true);
    assert.equal(r.job.status, 'pending');
  });

  it('rejects duplicate dedupe key', () => {
    const r = createJob({ workspaceId: 'ws-1', type: 'summary', reference: 'chat-2', dedupeKey: 'dup-key', payload: {} });
    assert.equal(r.success, true);
    const r2 = createJob({ workspaceId: 'ws-1', type: 'summary', reference: 'chat-2', dedupeKey: 'dup-key', payload: {} });
    assert.equal(r2.success, false);
    assert.equal(r2.reason, 'duplicate_key');
  });

  it('claims pending job', () => {
    createJob({ workspaceId: 'ws-1', type: 'test', reference: 'r1', dedupeKey: 'claim-1', payload: {} });
    const job = claimJob({ workerId: 'w1' });
    assert.ok(job);
    assert.equal(job.lockedBy, 'w1');
  });

  it('completes job', () => {
    createJob({ workspaceId: 'ws-1', type: 'test', reference: 'r2', dedupeKey: 'complete-1', payload: {} });
    const job = claimJob({ workerId: 'w1' });
    const completed = completeJob({ dedupeKey: job.dedupeKey });
    assert.equal(completed.status, 'completed');
  });

  it('retries on failure then fails after max attempts', () => {
    createJob({ workspaceId: 'ws-1', type: 'test', reference: 'r3', dedupeKey: 'fail-1', payload: {} });
    let job = claimJob({ workerId: 'w1' });
    job = failJob({ dedupeKey: job.dedupeKey, error: 'err1' });
    assert.equal(job.status, 'pending');
    assert.equal(job.attemptCount, 1);
    job = claimJob({ workerId: 'w1' });
    job = failJob({ dedupeKey: job.dedupeKey, error: 'err2' });
    assert.equal(job.attemptCount, 2);
    job = claimJob({ workerId: 'w1' });
    job = failJob({ dedupeKey: job.dedupeKey, error: 'err3' });
    assert.equal(job.status, 'failed');
    assert.equal(job.attemptCount, 3);
  });
});
