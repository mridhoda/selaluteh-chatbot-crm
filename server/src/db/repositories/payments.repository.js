import Payment from '../../models/Payment.js';
import { parsePagination } from '../../utils/pagination.js';

export const paymentsRepository = {
  findById({ workspaceId, paymentId }) {
    return Payment.findOne({ _id: paymentId, workspaceId });
  },

  findByOrder({ workspaceId, orderId, attemptNumber }) {
    const query = { workspaceId, orderId };
    if (attemptNumber) query.attemptNumber = attemptNumber;
    return Payment.findOne(query).sort({ attemptNumber: -1 });
  },

  findReusableAttempt({ workspaceId, orderId }) {
    return Payment.findOne({
      workspaceId,
      orderId,
      status: { $in: ['pending', 'paid'] },
    }).sort({ attemptNumber: -1 });
  },

  findByMerchantReference({ workspaceId, ref }) {
    return Payment.findOne({ workspaceId, merchantReference: ref });
  },

  findByProviderTransactionId(providerTransactionId) {
    return Payment.findOne({ providerTransactionId });
  },

  list({ workspaceId, orderId, status, reconciliationStatus, provider, page, limit, sort }) {
    const query = { workspaceId };
    if (orderId) query.orderId = orderId;
    if (status) query.status = status;
    if (reconciliationStatus) {
      query.reconciliationStatus = Array.isArray(reconciliationStatus)
        ? { $in: reconciliationStatus }
        : reconciliationStatus;
    }
    if (provider) query.provider = provider;
    const { skip, sort: sortField } = parsePagination({ page, limit, sort });
    const sortObj = {};
    sortObj[sortField.startsWith('-') ? sortField.slice(1) : sortField] = sortField.startsWith('-') ? -1 : 1;
    return Payment.find(query).sort(sortObj).skip(skip).limit(limit);
  },

  count({ workspaceId, orderId, status, reconciliationStatus, provider }) {
    const query = { workspaceId };
    if (orderId) query.orderId = orderId;
    if (status) query.status = status;
    if (reconciliationStatus) {
      query.reconciliationStatus = Array.isArray(reconciliationStatus)
        ? { $in: reconciliationStatus }
        : reconciliationStatus;
    }
    if (provider) query.provider = provider;
    return Payment.countDocuments(query);
  },

  create(data) {
    return Payment.create(data);
  },

  atomicStatusUpdate({ paymentId, expectedStatus, newStatus }) {
    return Payment.findOneAndUpdate(
      { _id: paymentId, status: expectedStatus },
      { $set: { status: newStatus } },
      { new: true },
    );
  },

  addEvent({ paymentId, event }) {
    return Payment.findOneAndUpdate(
      { _id: paymentId },
      { $push: { events: event } },
      { new: true },
    );
  },

  needsAttentionCount(workspaceId) {
    return Payment.countDocuments({
      workspaceId,
      reconciliationStatus: { $in: ['missing_webhook', 'unmatched', 'amount_mismatch'] },
    });
  },

  updatePayment(paymentId, updates) {
    return Payment.findByIdAndUpdate(paymentId, { $set: updates }, { new: true });
  },
};
