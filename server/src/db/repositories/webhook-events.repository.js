import WebhookEvent from '../../models/WebhookEvent.js';

export const webhookEventsRepository = {
  create(data) {
    return WebhookEvent.create(data);
  },

  findByProviderPlatformEvent({ provider, platformId, externalEventId }) {
    return WebhookEvent.findOne({ provider, platformId, externalEventId });
  },

  incrementAttempt(id) {
    return WebhookEvent.findOneAndUpdate(
      { _id: id },
      {
        $inc: { attemptCount: 1 },
        $set: { receivedAt: new Date() },
      },
      { new: true },
    );
  },

  incrementAttemptByKey({ provider, platformId, externalEventId }) {
    return WebhookEvent.findOneAndUpdate(
      { provider, platformId, externalEventId },
      {
        $inc: { attemptCount: 1 },
        $set: { receivedAt: new Date() },
      },
      { new: true },
    );
  },

  markProcessed(id) {
    return WebhookEvent.updateOne(
      { _id: id },
      { $set: { status: 'processed', processedAt: new Date(), error: '' } },
    );
  },

  markFailed(id, error) {
    return WebhookEvent.updateOne(
      { _id: id },
      {
        $set: {
          status: 'failed',
          processedAt: new Date(),
          error,
        },
      },
    );
  },
};
