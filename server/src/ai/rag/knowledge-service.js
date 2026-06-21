import { knowledgeSourcesRepository } from '../../db/repositories/index.js';

const VALID_LIFECYCLE_TRANSITIONS = {
  draft: ['processing', 'archived'],
  processing: ['ready_for_review', 'failed'],
  ready_for_review: ['published', 'rejected', 'draft'],
  published: ['archived', 'draft'],
  rejected: ['draft', 'archived'],
  archived: ['draft'],
  failed: ['draft'],
};

export function canTransition(from, to) {
  const allowed = VALID_LIFECYCLE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function createKnowledgeService({ repository = knowledgeSourcesRepository } = {}) {
  async function createDraft({ workspaceId, title, sourceType, content, outletId, scope }) {
    return repository.createDraft({ workspaceId, title, sourceType, content, outletId, scope });
  }

  async function updateDraft({ workspaceId, sourceId, updates }) {
    const source = await repository.findById({ workspaceId, sourceId });
    if (!source) return { success: false, error: 'not_found' };
    if (source.status === 'published') {
      return repository.createDraft({
        workspaceId,
        title: updates.title || source.title,
        sourceType: updates.sourceType || source.sourceType,
        content: updates.content || source.content,
        outletId: updates.outletId || source.outletId,
        scope: updates.scope || source.scope,
      });
    }
    return repository.updateDraft({ workspaceId, sourceId, updates });
  }

  async function startIngestion({ workspaceId, sourceId }) {
    const source = await repository.findById({ workspaceId, sourceId });
    if (!source) return { success: false, error: 'not_found' };
    if (!canTransition(source.status, 'processing')) {
      return { success: false, error: `cannot transition from ${source.status} to processing` };
    }
    return repository.updateDraft({ workspaceId, sourceId, updates: { status: 'processing' } });
  }

  async function markReady({ workspaceId, sourceId }) {
    const source = await repository.findById({ workspaceId, sourceId });
    if (!source) return { success: false, error: 'not_found' };
    if (!canTransition(source.status, 'ready_for_review')) {
      return { success: false, error: `cannot transition from ${source.status} to ready_for_review` };
    }
    return repository.updateDraft({ workspaceId, sourceId, updates: { status: 'ready_for_review' } });
  }

  async function publish({ workspaceId, sourceId, publishedBy }) {
    const source = await repository.findById({ workspaceId, sourceId });
    if (!source) return { success: false, error: 'not_found' };
    if (!canTransition(source.status, 'published')) {
      return { success: false, error: `cannot transition from ${source.status} to published` };
    }
    if (source.sourceType === 'ai_draft') {
      return { success: false, error: 'ai_draft cannot auto-publish' };
    }
    return repository.publishVersion({ workspaceId, sourceId, publishedBy });
  }

  async function reject({ workspaceId, sourceId }) {
    const source = await repository.findById({ workspaceId, sourceId });
    if (!source) return { success: false, error: 'not_found' };
    if (!canTransition(source.status, 'rejected')) {
      return { success: false, error: `cannot transition from ${source.status} to rejected` };
    }
    return repository.updateDraft({ workspaceId, sourceId, updates: { status: 'rejected' } });
  }

  async function archive({ workspaceId, sourceId }) {
    const source = await repository.findById({ workspaceId, sourceId });
    if (!source) return { success: false, error: 'not_found' };
    if (!canTransition(source.status, 'archived')) {
      return { success: false, error: `cannot transition from ${source.status} to archived` };
    }
    return repository.archive({ workspaceId, sourceId });
  }

  async function list({ workspaceId, status, outletId }) {
    return repository.list({ workspaceId, status, outletId });
  }

  async function findById({ workspaceId, sourceId }) {
    return repository.findById({ workspaceId, sourceId });
  }

  return {
    createDraft, updateDraft, startIngestion, markReady,
    publish, reject, archive, list, findById,
    canTransition,
  };
}
