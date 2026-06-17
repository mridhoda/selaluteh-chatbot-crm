import Order from '../../models/Order.js';
import { parsePagination } from '../../utils/pagination.js';

export const ordersRepository = {
  create(data) {
    return Order.create(data);
  },

  findList(query) {
    return Order.find(query)
      .populate('contactId', 'name phone')
      .populate('outletId', 'name code city status')
      .sort({ createdAt: -1 });
  },

  findOne(query) {
    return Order.findOne(query).populate('chatId').populate('contactId');
  },

  updateOne(query, update) {
    return Order.findOneAndUpdate(query, update, { new: true }).populate('chatId').populate('contactId');
  },

  deleteOne(query) {
    return Order.deleteOne(query);
  },

  workspaceList({ workspaceId, outletId, status, paymentStatus, search, page, limit, sort }) {
    const query = { workspaceId };
    if (outletId) query.outletId = outletId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }
    const { skip, sort: sortField } = parsePagination({ page, limit, sort });
    const sortObj = {};
    sortObj[sortField.startsWith('-') ? sortField.slice(1) : sortField] = sortField.startsWith('-') ? -1 : 1;
    return Order.find(query).sort(sortObj).skip(skip).limit(limit)
      .populate('contactId', 'name phone')
      .populate('outletId', 'name code city status');
  },

  workspaceCount({ workspaceId, outletId, status, paymentStatus, search }) {
    const query = { workspaceId };
    if (outletId) query.outletId = outletId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
      ];
    }
    return Order.countDocuments(query);
  },

  workspaceFindById({ workspaceId, orderId }) {
    return Order.findOne({ _id: orderId, workspaceId })
      .populate('contactId', 'name phone')
      .populate('outletId', 'name code city status')
      .populate('chatId');
  },

  atomicStatusUpdate({ workspaceId, orderId, expectedStatus, newStatus }) {
    return Order.findOneAndUpdate(
      { _id: orderId, workspaceId, status: expectedStatus },
      { $set: { status: newStatus }, $push: { timeline: { type: `status:${newStatus}`, actor: 'system', timestamp: new Date() } } },
      { new: true },
    );
  },

  addTimelineEntry({ workspaceId, orderId, entry }) {
    return Order.findOneAndUpdate(
      { _id: orderId, workspaceId },
      { $push: { timeline: entry } },
      { new: true },
    );
  },

  getNextOrderNumber(workspaceId) {
    return Order.findOne({ workspaceId }).sort({ orderNumber: -1 }).select('orderNumber');
  },
};
