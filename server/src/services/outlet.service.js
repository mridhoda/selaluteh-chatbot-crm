/**
 * outlet.service.js — Supabase-backed (task 24.8)
 *
 * Business logic for outlet management.
 * Backed by outletsSupabaseRepository (Supabase/Postgres).
 */

import { outletsSupabaseRepository, outletManagementRepository } from '../db/repositories/index.js';
import { canManageWorkspace, getAllowedOutletIds } from './access-control.service.js';
import { AppError } from '../utils/errors.js';
import {
  OutletOperationalStatus, isValidTransition, canAcceptOrders, OUTLET_ERRORS,
} from '../outlets/outlet-status.js';
import { computeOpenState } from '../outlets/operating-hours.js';
import { evaluateOrderAcceptance, buildActivationChecklist, normalizeOutletCode } from '../outlets/outlet-policy.js';

export async function listOutlets({ user, status, search, page, limit }) {
  const workspaceId = user.workspaceId;

  let outlets = await outletsSupabaseRepository.list({ workspaceId, status, search, page, limit });

  // If the user is not a workspace manager, filter to only their accessible outlets
  if (!canManageWorkspace(user)) {
    const allowedIds = await getAllowedOutletIds(user);
    const allowedSet = new Set(allowedIds.map((id) => String(id)));
    outlets = outlets.filter((o) => allowedSet.has(String(o.id)));
  }

  const total = await outletsSupabaseRepository.count({ workspaceId, status, search });
  return { data: outlets, meta: { total, page: parseInt(page) || 1, limit: parseInt(limit) || 20 } };
}

export async function listActiveWorkspaceOutlets(workspaceId) {
  return outletsSupabaseRepository.findActiveByWorkspace(workspaceId);
}

export async function findActiveWorkspaceOutlet({ workspaceId, outletId }) {
  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet || outlet.status !== 'active') {
    throw new AppError('OUTLET_NOT_FOUND', 'Outlet not found or inactive', 404);
  }
  return outlet;
}

export async function getOutletDetail({ workspaceId, outletId }) {
  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet) throw new AppError('OUTLET_NOT_FOUND', 'Outlet not found', 404);
  return outlet;
}

export async function createOutlet({ user, payload }) {
  if (!canManageWorkspace(user)) {
    throw new AppError('FORBIDDEN', 'Insufficient permissions to create outlet', 403);
  }

  if (payload.code) {
    const existing = await outletsSupabaseRepository.findByCode({ workspaceId: user.workspaceId, code: payload.code });
    if (existing) throw new AppError('DUPLICATE_CODE', 'Outlet code already exists in this workspace', 409);
  }

  const operationalStatus = payload.operational_status || payload.status === 'active' ? OutletOperationalStatus.ACTIVE : OutletOperationalStatus.DRAFT;

  const created = await outletsSupabaseRepository.create({
    workspaceId: user.workspaceId,
    name: payload.name,
    code: payload.code,
    slug: payload.slug,
    city: payload.city,
    region: payload.region,
    address: payload.address,
    postalCode: payload.postalCode || payload.postal_code,
    phone: payload.phone,
    email: payload.email,
    operational_status: operationalStatus,
    timezone: payload.timezone || 'Asia/Makassar',
    openingHours: payload.openingHours || payload.opening_hours || {},
    metadata: payload.metadata || {},
  });

  await outletManagementRepository.upsertServiceSettings(user.workspaceId, created.id, { pickup_enabled: true, default_prep_minutes: 15 });
  return created;
}

export async function updateOutlet({ user, outletId, updates }) {
  if (!canManageWorkspace(user)) {
    throw new AppError('FORBIDDEN', 'Insufficient permissions to update outlet', 403);
  }

  const allowed = ['name', 'code', 'slug', 'city', 'region', 'address', 'postalCode', 'phone', 'email', 'timezone', 'openingHours', 'metadata', 'pickup_enabled', 'accepts_orders', 'version'];
  const safe = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safe[key] = updates[key];
  }

  if (safe.code) {
    safe.code = safe.code.toUpperCase();
    const existing = await outletsSupabaseRepository.findByCode({ workspaceId: user.workspaceId, code: safe.code });
    if (existing && existing.id !== outletId) {
      throw new AppError('DUPLICATE_CODE', 'Outlet code already exists in this workspace', 409);
    }
  }

  const outlet = await outletsSupabaseRepository.update({ workspaceId: user.workspaceId, outletId, updates: safe });
  if (!outlet) throw new AppError('OUTLET_NOT_FOUND', 'Outlet not found', 404);
  return outlet;
}

export async function updateOutletStatus({ user, outletId, status }) {
  if (!canManageWorkspace(user)) {
    throw new AppError('FORBIDDEN', 'Insufficient permissions to change outlet status', 403);
  }

  if (!['active', 'inactive', 'archived'].includes(status)) {
    throw new AppError('VALIDATION', 'Invalid status. Must be active, inactive, or archived', 400);
  }

  const outlet = await outletsSupabaseRepository.updateStatus({ workspaceId: user.workspaceId, outletId, status });
  if (!outlet) throw new AppError('OUTLET_NOT_FOUND', 'Outlet not found', 404);
  return outlet;
}

export async function setUserOutletAccess({ user, targetUserId, outlets }) {
  if (!canManageWorkspace(user)) {
    throw new AppError('FORBIDDEN', 'Insufficient permissions to modify outlet access', 403);
  }

  const rows = Array.isArray(outlets) ? outlets.map((item) => ({
    outletId: item.outletId || item.outlet_id,
    role: item.role || 'outlet_manager',
  })) : [];

  return outletsSupabaseRepository.replaceUserAccess({ workspaceId: user.workspaceId, userId: targetUserId, rows });
}

// ── New Canonical Outlet Service Functions ─────────────────────────────────

export async function changeOutletOperationalStatus({ user, outletId, status, version }) {
  const workspaceId = user.workspaceId;
  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet) throw new AppError(OUTLET_ERRORS.NOT_FOUND.code, 'Outlet not found', OUTLET_ERRORS.NOT_FOUND.status);

  if (!canAcceptOrders(outlet.operational_status) && canAcceptOrders(status)) {
    const checklist = buildActivationChecklist(outlet);
    if (!checklist.eligible) {
      throw new AppError(OUTLET_ERRORS.ACTIVATION_FAILED.code, 'Activation prerequisites not met', OUTLET_ERRORS.ACTIVATION_FAILED.status, { missing: checklist.missing });
    }
  }

  return outletsSupabaseRepository.update({ workspaceId, outletId, updates: { operational_status: status, version } });
}

export async function getOrderAcceptance({ workspaceId, outletId }) {
  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet) throw new AppError(OUTLET_ERRORS.NOT_FOUND.code, 'Outlet not found', OUTLET_ERRORS.NOT_FOUND.status);

  const hours = await outletManagementRepository.getOperatingHours(workspaceId, outletId);
  const special = await outletManagementRepository.getSpecialHours(workspaceId, outletId);
  const settings = await outletManagementRepository.getServiceSettings(workspaceId, outletId);

  const openState = computeOpenState({
    timezone: outlet.timezone,
    regularHours: hours,
    specialHours: special,
  });

  return evaluateOrderAcceptance({
    outlet,
    regularHours: hours,
    specialHours: special,
    healthStatus: outlet.health_status,
    currentOpenState: openState,
  });
}

export async function getSetupChecklist({ workspaceId, outletId }) {
  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet) throw new AppError(OUTLET_ERRORS.NOT_FOUND.code, 'Outlet not found', OUTLET_ERRORS.NOT_FOUND.status);
  return buildActivationChecklist(outlet);
}

export async function getOutletSummary({ workspaceId, outletId }) {
  const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId });
  if (!outlet) throw new AppError(OUTLET_ERRORS.NOT_FOUND.code, 'Outlet not found', OUTLET_ERRORS.NOT_FOUND.status);

  const hours = await outletManagementRepository.getOperatingHours(workspaceId, outletId);
  const special = await outletManagementRepository.getSpecialHours(workspaceId, outletId);

  const openState = computeOpenState({
    timezone: outlet.timezone,
    regularHours: hours,
    specialHours: special,
  });

  return {
    outlet,
    openState,
    health: { status: outlet.health_status },
    checklist: buildActivationChecklist(outlet),
  };
}

export async function upsertServiceSettings({ user, outletId, data }) {
  return outletManagementRepository.upsertServiceSettings(user.workspaceId, outletId, data);
}

export async function replaceOperatingHours({ user, outletId, hours }) {
  await outletManagementRepository.replaceOperatingHours(user.workspaceId, outletId, hours);
  return outletManagementRepository.getOperatingHours(user.workspaceId, outletId);
}
