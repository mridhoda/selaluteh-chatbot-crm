import Product from '../../models/Product.js';
import ProductOutletAvailability from '../../models/ProductOutletAvailability.js';
import { parsePagination } from '../../utils/pagination.js';

export const productsRepository = {
  findProducts(query) {
    return Product.find(query).sort({ createdAt: -1 });
  },

  findProduct(query) {
    return Product.findOne(query);
  },

  findById({ workspaceId, productId }) {
    return Product.findOne({ _id: productId, workspaceId });
  },

  list({ workspaceId, status, search, category, page, limit, sort }) {
    const query = { workspaceId };
    if (status) query.isActive = status === 'active';
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    const { skip, limit: lim } = parsePagination({ page, limit, sort });
    return Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim);
  },

  count({ workspaceId, status, search, category }) {
    const query = { workspaceId };
    if (status) query.isActive = status === 'active';
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    return Product.countDocuments(query);
  },

  create(data) {
    return Product.create(data);
  },

  update({ workspaceId, productId, updates }) {
    return Product.findOneAndUpdate(
      { _id: productId, workspaceId },
      { $set: updates },
      { new: true, runValidators: true },
    );
  },

  archive({ workspaceId, productId }) {
    return Product.findOneAndUpdate(
      { _id: productId, workspaceId },
      { $set: { isActive: false } },
      { new: true },
    );
  },

  findAvailability(query) {
    return ProductOutletAvailability.find(query);
  },

  findOneAvailability({ workspaceId, productId, outletId }) {
    return ProductOutletAvailability.findOne({ workspaceId, productId, outletId });
  },

  findAvailabilityByOutlet({ workspaceId, outletId, status, isAvailable, productIds }) {
    const query = { workspaceId, outletId };
    if (status) query.status = status;
    if (isAvailable !== undefined) query.isAvailable = isAvailable;
    if (productIds) query.productId = { $in: productIds };
    return ProductOutletAvailability.find(query);
  },

  findAvailabilityByProduct({ workspaceId, productId }) {
    return ProductOutletAvailability.find({ workspaceId, productId }).populate('outletId', 'name code status');
  },

  upsertAvailability(query, update) {
    return ProductOutletAvailability.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  },

  bulkUpsertAvailability(operations) {
    const bulkOps = operations.map((op) => ({
      updateOne: {
        filter: op.filter,
        update: op.update,
        upsert: true,
      },
    }));
    return ProductOutletAvailability.bulkWrite(bulkOps);
  },

  removeAvailability({ workspaceId, productId, outletId }) {
    return ProductOutletAvailability.findOneAndDelete({ workspaceId, productId, outletId });
  },
};
