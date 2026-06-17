import PaymentEvent from '../../models/PaymentEvent.js';

export const paymentEventsRepository = {
  findByProviderEventId(provider, providerEventId) {
    return PaymentEvent.findOne({ provider, providerEventId });
  },

  create(data) {
    return PaymentEvent.create(data);
  },

  updateProcessingStatus({ eventId, status, verificationResult }) {
    const setFields = { processingStatus: status };
    if (verificationResult) setFields.verificationResult = verificationResult;
    return PaymentEvent.findByIdAndUpdate(eventId, { $set: setFields }, { new: true });
  },

  updateReferences({ eventId, paymentId, orderId }) {
    const setFields = {};
    if (paymentId) setFields.paymentId = paymentId;
    if (orderId) setFields.orderId = orderId;
    return PaymentEvent.findByIdAndUpdate(eventId, { $set: setFields }, { new: true });
  },

  findByPayment({ workspaceId, paymentId }) {
    return PaymentEvent.find({ workspaceId, paymentId }).sort({ receivedAt: -1 });
  },

  findByOrder({ workspaceId, orderId }) {
    return PaymentEvent.find({ workspaceId, orderId }).sort({ receivedAt: -1 });
  },
};
