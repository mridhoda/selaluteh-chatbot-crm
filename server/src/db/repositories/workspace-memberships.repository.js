import UserWorkspaceMembership from '../../models/UserWorkspaceMembership.js';

async function findActiveMembership({ userId, workspaceId }) {
  return UserWorkspaceMembership.findOne({ userId, workspaceId, status: 'active' });
}

async function listUserMemberships({ userId }) {
  return UserWorkspaceMembership.find({ userId }).sort({ createdAt: -1 });
}

async function listWorkspaceMembers({ workspaceId, status, limit = 100, skip = 0 }) {
  const filter = { workspaceId };
  if (status) filter.status = status;
  return UserWorkspaceMembership.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function createMembership({ workspaceId, userId, role, status = 'active' }) {
  return UserWorkspaceMembership.create({ workspaceId, userId, role, status });
}

async function updateRole({ userId, workspaceId, role }) {
  return UserWorkspaceMembership.findOneAndUpdate(
    { userId, workspaceId },
    { role },
    { new: true },
  );
}

async function disableMembership({ userId, workspaceId }) {
  return UserWorkspaceMembership.findOneAndUpdate(
    { userId, workspaceId },
    { status: 'disabled' },
    { new: true },
  );
}

async function countWorkspaceOwners(workspaceId) {
  return UserWorkspaceMembership.countDocuments({ workspaceId, role: 'owner', status: 'active' });
}

export const workspaceMembershipsRepository = {
  findActiveMembership,
  listUserMemberships,
  listWorkspaceMembers,
  createMembership,
  updateRole,
  disableMembership,
  countWorkspaceOwners,
};
