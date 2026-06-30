import { AppError } from '../utils/errors.js';
import { assertOutletAccess, canAccessAllOutlets } from '../services/access-control.service.js';
import { hasEffectivePermission } from '../services/access-control.service.js';
import { normalizeRole } from '../security/permission-matrix.js';

function getRequestRole(req) {
  return normalizeRole(req?.workspace?.role || req?.me?.workspaceRole || req?.me?.role);
}

export function authorizePermission(resource, action) {
  const middleware = (req, _res, next) => {
    try {
      if (!req.me) throw new AppError('UNAUTHORIZED', 'Unauthorized', 401);

      const role = getRequestRole(req);
      if (!hasEffectivePermission(req.me, resource, action)) {
        throw new AppError('FORBIDDEN', `Missing permission: ${resource}.${action}`, 403, {
          resource,
          action,
          role,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  middleware.permission = { resource, action };
  return middleware;
}

export function requireOutletAccess(fieldName, source = 'params') {
  return requireOutletAccessFrom((req) => req?.[source]?.[fieldName], `${source}.${fieldName}`);
}

export function requireOutletAccessFrom(getter, label = 'outletId') {
  const middleware = async (req, _res, next) => {
    try {
      const outletId = getter(req);
      if (!outletId) return next();
      await assertOutletAccess(req.me, outletId);
      next();
    } catch (err) {
      next(err);
    }
  };

  middleware.outletAccess = { label };
  return middleware;
}

export function requireManyOutletAccessFrom(getter, label = 'outletIds') {
  const middleware = async (req, _res, next) => {
    try {
      const outletIds = getter(req) || [];
      for (const outletId of outletIds) {
        if (outletId) await assertOutletAccess(req.me, outletId);
      }
      next();
    } catch (err) {
      next(err);
    }
  };

  middleware.outletAccess = { label, multiple: true };
  return middleware;
}

export function requireScopedOutletSelection(getter, message = 'outletId is required for outlet-scoped access') {
  const middleware = (req, _res, next) => {
    try {
      const outletId = getter(req);
      if (outletId || canAccessAllOutlets(req.me) || (req.allowedOutletIds || []).length <= 1) {
        return next();
      }
      throw new AppError('OUTLET_REQUIRED', message, 400);
    } catch (err) {
      next(err);
    }
  };

  middleware.outletAccess = { scopedSelectionRequired: true };
  return middleware;
}
