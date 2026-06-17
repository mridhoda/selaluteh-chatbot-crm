import AIAction from '../../models/AIAction.js';

export const aiActionsRepository = {
  create(data) {
    return AIAction.create(data);
  },

  markValidated(id) {
    return AIAction.findByIdAndUpdate(
      id,
      { $set: { status: 'validated', validationErrors: [] } },
      { new: true },
    );
  },

  markExecuted(id, output = {}) {
    return AIAction.findByIdAndUpdate(
      id,
      { $set: { status: 'executed', output, executedAt: new Date(), error: '' } },
      { new: true },
    );
  },

  markRejected(id, validationErrors = []) {
    return AIAction.findByIdAndUpdate(
      id,
      { $set: { status: 'rejected', validationErrors } },
      { new: true },
    );
  },

  markFailed(id, error) {
    return AIAction.findByIdAndUpdate(
      id,
      { $set: { status: 'failed', error: error?.message || String(error) } },
      { new: true },
    );
  },
};
