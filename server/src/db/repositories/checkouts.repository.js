import Checkout from '../../models/Checkout.js';

export const checkoutsRepository = {
  findById({ workspaceId, checkoutId }) {
    return Checkout.findOne({ _id: checkoutId, workspaceId });
  },

  findByIdempotencyKey({ workspaceId, key }) {
    return Checkout.findOne({ workspaceId, idempotencyKey: key });
  },

  findActiveByCart({ workspaceId, cartId }) {
    return Checkout.findOne({ workspaceId, cartId, status: { $in: ['pending', 'confirmed'] } }).sort({ createdAt: -1 });
  },

  create(data) {
    return Checkout.create(data);
  },

  updateStatus({ workspaceId, checkoutId, status }) {
    return Checkout.findOneAndUpdate(
      { _id: checkoutId, workspaceId },
      { $set: { status } },
      { new: true },
    );
  },

  findExpired(before = new Date()) {
    return Checkout.find({ status: { $in: ['pending', 'confirmed'] }, expiresAt: { $lte: before } });
  },

  expireMany(checkoutIds) {
    return Checkout.updateMany(
      { _id: { $in: checkoutIds } },
      { $set: { status: 'expired' } },
    );
  },
};
