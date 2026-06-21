const jobs = new Map();
let counter = 0;

export function createJob({ workspaceId, type, reference, dedupeKey, payload }) {
  if (jobs.has(dedupeKey)) return { success: false, reason: 'duplicate_key' };
  counter++;
  const job = {
    id: `job-${counter}`, workspaceId, type, reference, dedupeKey, payload: payload || {},
    status: 'pending', attemptCount: 0, nextRunAt: new Date().toISOString(),
    lastError: null, lockedAt: null, lockedBy: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  jobs.set(dedupeKey, job);
  return { success: true, job };
}

export function claimJob({ workerId }) {
  for (const [, job] of jobs) {
    if (job.status !== 'pending') continue;
    if (job.lockedAt && Date.now() - new Date(job.lockedAt).getTime() < 30000) continue;
    job.status = 'running';
    job.lockedAt = new Date().toISOString();
    job.lockedBy = workerId;
    return job;
  }
  return null;
}

export function completeJob({ dedupeKey }) {
  const job = jobs.get(dedupeKey);
  if (!job) return null;
  job.status = 'completed';
  job.updatedAt = new Date().toISOString();
  job.lockedAt = null;
  return job;
}

export function failJob({ dedupeKey, error }) {
  const job = jobs.get(dedupeKey);
  if (!job) return null;
  job.attemptCount++;
  job.lastError = error;
  if (job.attemptCount >= 3) {
    job.status = 'failed';
  } else {
    job.status = 'pending';
    job.nextRunAt = new Date(Date.now() + Math.pow(2, job.attemptCount) * 60000).toISOString();
  }
  job.lockedAt = null;
  job.updatedAt = new Date().toISOString();
  return job;
}
