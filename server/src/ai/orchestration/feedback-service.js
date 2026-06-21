import { aiFeedbackRepository } from '../../db/repositories/index.js';

const VALID_REASON_CODES = [
  'correct', 'incorrect_tool', 'hallucination', 'rude',
  'too_long', 'repeated_intro', 'wrong_language', 'other',
];

export function validateFeedback({ rating, reasonCode }) {
  if (rating !== null && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return { valid: false, error: 'rating must be 1-5 or null' };
  }
  if (reasonCode && !VALID_REASON_CODES.includes(reasonCode)) {
    return { valid: false, error: `reasonCode must be one of: ${VALID_REASON_CODES.join(', ')}` };
  }
  return { valid: true, error: null };
}

export async function submitFeedback({ workspaceId, runId, rating, reasonCode, comment, reviewedBy }) {
  const validation = validateFeedback({ rating, reasonCode });
  if (!validation.valid) return { success: false, error: validation.error };

  const feedback = await aiFeedbackRepository.create({
    workspaceId, runId, rating, reasonCode, comment, reviewedBy,
  });
  return { success: true, feedback };
}
