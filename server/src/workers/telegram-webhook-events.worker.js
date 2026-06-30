import { telegramWebhookEventsRepository } from '../db/repositories/index.js';
import { telegramUpdateProcessor } from '../services/telegram/telegram-update-processor.service.js';

function computeRetryDelayMs(attemptCount, retryBaseMs) {
  const attempt = Math.max(1, Number(attemptCount || 1));
  return retryBaseMs * (2 ** Math.min(attempt - 1, 6));
}

function safeErrorMessage(error) {
  return String(error?.message || error || '').replace(/bot[0-9]+:[A-Za-z0-9_-]+/g, 'bot[REDACTED]').slice(0, 500);
}

export function createTelegramWebhookEventsWorker({
  eventRepository = telegramWebhookEventsRepository,
  processor = telegramUpdateProcessor,
  maxAttempts = Number(process.env.TELEGRAM_WEBHOOK_MAX_ATTEMPTS || 8),
  retryBaseMs = Number(process.env.TELEGRAM_WEBHOOK_RETRY_BASE_MS || 1000),
} = {}) {
  let intervalHandle = null;

  async function processOnce() {
    const event = await eventRepository.claimNext();
    if (!event) return false;

    try {
      await processor.process(event);
      await eventRepository.markProcessed(event.id);
      return true;
    } catch (error) {
      const attemptCount = event.attemptCount ?? 0;
      const retryable = error?.retryable === true || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET';
      if (retryable && attemptCount < maxAttempts) {
        await eventRepository.scheduleRetry({
          eventId: event.id,
          availableAt: new Date(Date.now() + computeRetryDelayMs(attemptCount + 1, retryBaseMs)).toISOString(),
          errorCode: error?.code || 'TELEGRAM_EVENT_PROCESSING_FAILED',
          safeErrorMessage: safeErrorMessage(error),
        });
      } else {
        await eventRepository.moveToDeadLetter({
          eventId: event.id,
          errorCode: error?.code || 'TELEGRAM_EVENT_DEAD_LETTERED',
          safeErrorMessage: safeErrorMessage(error),
        });
      }
      return true;
    }
  }

  function start({ intervalMs = 1000 } = {}) {
    if (intervalHandle) return;
    intervalHandle = setInterval(() => {
      processOnce().catch((error) => {
        console.error('[telegram-webhook-events] worker error:', error?.message || error);
      });
    }, intervalMs);
    intervalHandle.unref?.();
    console.log('[telegram-webhook-events] Worker started (interval: ' + intervalMs + 'ms)');
  }

  function stop() {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  return { processOnce, start, stop };
}

export const telegramWebhookEventsWorker = createTelegramWebhookEventsWorker();

export const start = (opts) => telegramWebhookEventsWorker.start(opts);
export const stop = () => telegramWebhookEventsWorker.stop();
