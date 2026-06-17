import Outlet from '../../models/Outlet.js';
import UserOutletAccess from '../../models/UserOutletAccess.js';
import { parsePagination } from '../../utils/pagination.js';

export const outletsRepository = {
  list({ workspaceId, status, search, page, limit, sort }) {
    const query = { workspaceId };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };
    const { skip, sort: sortField } = parsePagination({ page, limit, sort });
    const sortObj = {};
    sortObj[sortField.startsWith('-') ? sortField.slice(1) : sortField] = sortField.startsWith('-') ? -1 : 1;
    return Outlet.find(query).sort(sortObj).skip(skip).limit(limit);
  },

  count({ workspaceId, status, search }) {
    const query = { workspaceId };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };
    return Outlet.countDocuments(query);
  },

  findById(scope) {
    return Outlet.findOne({ _id: scope.outletId, workspaceId: scope.workspaceId });
  },

  findByWorkspaceAndId({ workspaceId, outletId }) {
    return Outlet.findOne({ _id: outletId, workspaceId });
  },

  findByCode({ workspaceId, code }) {
    return Outlet.findOne({ workspaceId, code: code.toUpperCase() });
  },

  findActiveByWorkspace(workspaceId) {
    return Outlet.find({ workspaceId, status: 'active' }).sort({ name: 1 });
  },

  create(data) {
    return Outlet.create(data);
  },

  update({ workspaceId, outletId, updates }) {
    return Outlet.findOneAndUpdate(
      { _id: outletId, workspaceId },
      { $set: updates },
      { new: true, runValidators: true },
    );
  },

  updateStatus({ workspaceId, outletId, status }) {
    return Outlet.findOneAndUpdate(
      { _id: outletId, workspaceId },
      { $set: { status } },
      { new: true },
    );
  },

  findActiveIdsByWorkspace(workspaceId) {
    return Outlet.find({ workspaceId, status: { $ne: 'archived' } }).select('_id');
  },

  findUserAccess({ workspaceId, userId }) {
    return UserOutletAccess.find({ workspaceId, userId, status: 'active' }).select('outletId');
  },

  findOneUserAccess({ workspaceId, outletId, userId }) {
    return UserOutletAccess.findOne({ workspaceId, outletId, userId, status: 'active' });
  },

  replaceUserAccess({ workspaceId, userId, rows }) {
    return UserOutletAccess.deleteMany({ workspaceId, userId }).then(() => {
      if (!rows.length) return [];
      return UserOutletAccess.insertMany(rows);
    });
  },
};
