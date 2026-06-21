import { contactMemoriesRepository } from '../../db/repositories/index.js';

const ALLOWED_CATEGORIES = new Set([
  'identity',
  'language',
  'outlet_preference',
  'product_preference',
  'communication_preference',
  'customer_tag',
]);

const FORBIDDEN_KEYS = ['address', 'otp', 'password', 'card_data', 'payment_token', 'api_key'];

const MAX_MEMORIES_IN_CONTEXT = 10;

const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];

export function validateMemoryCandidate(candidate) {
  const errors = [];

  if (!candidate || typeof candidate !== 'object') {
    return { valid: false, errors: ['Candidate must be an object'] };
  }
  if (!candidate.key || typeof candidate.key !== 'string') {
    errors.push('key is required and must be a string');
  }
  if (!candidate.value || typeof candidate.value !== 'object') {
    errors.push('value is required and must be an object');
  }
  if (!candidate.category || !ALLOWED_CATEGORIES.has(candidate.category)) {
    errors.push(`category must be one of: ${[...ALLOWED_CATEGORIES].join(', ')}`);
  }
  if (candidate.confidence && !CONFIDENCE_LEVELS.includes(candidate.confidence)) {
    errors.push(`confidence must be one of: ${CONFIDENCE_LEVELS.join(', ')}`);
  }
  if (candidate.value) {
    for (const forbidden of FORBIDDEN_KEYS) {
      if (candidate.key?.toLowerCase().includes(forbidden) || candidate.key?.toLowerCase() === forbidden) {
        errors.push(`forbidden key: ${candidate.key}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createMemoryService({ repository = contactMemoriesRepository } = {}) {
  async function propose({ workspaceId, contactId, candidate }) {
    const validation = validateMemoryCandidate(candidate);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const existing = await repository.findByKey({
      workspaceId,
      contactId,
      memoryKey: candidate.key,
    });

    if (existing) {
      if (existing.status === 'active' || existing.status === 'confirmed') {
        if (candidate.confidence === 'high' && existing.confidence !== 'high') {
          await repository.supersede({ id: existing.id });
        } else {
          return { success: true, memory: existing, status: 'already_exists' };
        }
      } else {
        await repository.supersede({ id: existing.id });
      }
    }

    const memory = await repository.createCandidate({
      workspaceId,
      contactId,
      memoryKey: candidate.key,
      memoryValue: candidate.value,
      category: candidate.category,
      sourceType: candidate.sourceType || 'model_extraction',
      sourceReferenceId: candidate.sourceReferenceId || null,
      confidence: candidate.confidence || 'medium',
    });

    return { success: true, memory, status: 'created' };
  }

  async function confirm({ workspaceId, contactId, memoryKey }) {
    const existing = await repository.findByKey({ workspaceId, contactId, memoryKey });
    if (!existing) {
      return { success: false, error: 'memory_not_found' };
    }
    const memory = await repository.activate({ id: existing.id });
    return { success: true, memory };
  }

  async function correct({ workspaceId, contactId, memoryKey, memoryValue }) {
    const existing = await repository.findByKey({ workspaceId, contactId, memoryKey });
    if (!existing) {
      return { success: false, error: 'memory_not_found' };
    }
    await repository.supersede({ id: existing.id });
    const memory = await repository.createCandidate({
      workspaceId,
      contactId,
      memoryKey,
      memoryValue,
      category: existing.category,
      sourceType: 'manual_correction',
      sourceReferenceId: null,
      confidence: 'high',
    });
    await repository.activate({ id: memory.id });
    return { success: true, memory };
  }

  async function forget({ workspaceId, contactId, memoryKey }) {
    const existing = await repository.findByKey({ workspaceId, contactId, memoryKey });
    if (!existing) {
      return { success: true, memory: null };
    }
    const memory = await repository.forget({ id: existing.id });
    return { success: true, memory };
  }

  async function listActive({ workspaceId, contactId }) {
    const memories = await repository.listActive({ workspaceId, contactId });
    return memories.filter((m) => m.status === 'active' || m.status === 'confirmed');
  }

  async function selectRelevantForContext({ workspaceId, contactId, maxCount = MAX_MEMORIES_IN_CONTEXT }) {
    const memories = await listActive({ workspaceId, contactId });
    return memories.slice(0, maxCount);
  }

  return {
    propose,
    confirm,
    correct,
    forget,
    listActive,
    selectRelevantForContext,
    validateMemoryCandidate,
  };
}
