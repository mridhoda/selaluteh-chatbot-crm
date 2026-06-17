import Cart from '../../models/Cart.js';

export const cartsRepository = {
  findActiveByContact({ workspaceId, contactId, outletId }) {
    const query = { workspaceId, contactId, status: 'active' };
    if (outletId) query.outletId = outletId;
    return Cart.findOne(query).sort({ createdAt: -1 });
  },

  findActiveByChat({ workspaceId, chatId }) {
    return Cart.findOne({ workspaceId, chatId, status: 'active' });
  },

  findById({ workspaceId, cartId }) {
    return Cart.findOne({ _id: cartId, workspaceId });
  },

  create(data) {
    return Cart.create(data);
  },

  update({ workspaceId, cartId, updates }) {
    return Cart.findOneAndUpdate(
      { _id: cartId, workspaceId },
      { $set: updates },
      { new: true },
    );
  },

  pushItem({ workspaceId, cartId, item }) {
    return Cart.findOneAndUpdate(
      { _id: cartId, workspaceId },
      { $push: { items: item } },
      { new: true },
    );
  },

  updateItem({ workspaceId, cartId, productId, updates }) {
    const setKey = {};
    for (const [key, value] of Object.entries(updates)) {
      setKey[`items.$.${key}`] = value;
    }
    return Cart.findOneAndUpdate(
      { _id: cartId, workspaceId, 'items.productId': productId },
      { $set: setKey },
      { new: true },
    );
  },

  removeItem({ workspaceId, cartId, productId }) {
    return Cart.findOneAndUpdate(
      { _id: cartId, workspaceId },
      { $pull: { items: { productId } } },
      { new: true },
    );
  },

  setStatus({ workspaceId, cartId, status }) {
    return Cart.findOneAndUpdate(
      { _id: cartId, workspaceId },
      { $set: { status } },
      { new: true },
    );
  },

  findExpired(before = new Date()) {
    return Cart.find({ status: 'active', expiresAt: { $lte: before } });
  },

  expireMany(cartIds) {
    return Cart.updateMany(
      { _id: { $in: cartIds } },
      { $set: { status: 'expired' } },
    );
  },
};
