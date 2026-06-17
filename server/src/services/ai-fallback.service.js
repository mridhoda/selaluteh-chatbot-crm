import { AppError } from '../utils/errors.js';

const TIMEOUT_MS = 25000;
const FALLBACK_MESSAGE = 'I apologize, but I am having trouble processing your request right now. Please try again or a human agent will be with you shortly.';

export async function callWithFallback({ label, fn, timeoutMs = TIMEOUT_MS }) {
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs)),
    ]);
    return result;
  } catch (err) {
    if (err.message?.includes('timeout') || err.message?.includes('rate limit') || err.message?.includes('429')) {
      console.error(`[AI Fallback] ${label}:`, err.message);
      return { fallback: true, message: FALLBACK_MESSAGE };
    }
    throw new AppError('AI_PROVIDER_ERROR', `${label} failed: ${err.message}`, 502);
  }
}
