import { AppError } from '../../utils/errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

export const RepositoryErrorCode = Object.freeze({
  DATABASE_CONNECTION: 'DATABASE_CONNECTION_ERROR',
  UNIQUE_CONSTRAINT: 'UNIQUE_CONSTRAINT_VIOLATION',
  FOREIGN_KEY: 'FOREIGN_KEY_VIOLATION',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  TRANSACTION_CONFLICT: 'TRANSACTION_CONFLICT',
  DEADLOCK: 'DEADLOCK_DETECTED',
});

export function assertWorkspaceScope(workspaceId) {
  return requireWorkspaceId(workspaceId);
}

export function assertRepositoryMethod(name, value) {
  if (typeof value !== 'function') {
    throw new AppError('REPOSITORY_CONTRACT_ERROR', `${name} must be a repository method`, 500);
  }
}

export function createTxRepository(repository, tx) {
  if (!tx || typeof tx.query !== 'function') {
    throw new AppError('INVALID_TRANSACTION_CONTEXT', 'Repository transaction context must expose query()', 500);
  }
  return Object.freeze({
    ...repository,
    tx,
    withTx(nextTx) {
      return createTxRepository(repository, nextTx);
    },
  });
}

export function withRepositoryTx(repository) {
  return Object.freeze({
    ...repository,
    withTx(tx) {
      return createTxRepository(repository, tx);
    },
  });
}

export function normalizeRepositoryError(error, context = '') {
  if (!error) return error;
  if (error instanceof AppError) return error;

  const code = error.code || error.status;
  const ctx = context ? ` [${context}]` : '';

  if (code === '23505') {
    return new AppError(RepositoryErrorCode.UNIQUE_CONSTRAINT, `Unique constraint violation${ctx}`, 409, { detail: error.message }, error);
  }
  if (code === '23503') {
    return new AppError(RepositoryErrorCode.FOREIGN_KEY, `Foreign key violation${ctx}`, 400, { detail: error.message }, error);
  }
  if (code === '40P01') {
    return new AppError(RepositoryErrorCode.DEADLOCK, `Deadlock detected${ctx}`, 409, { detail: error.message }, error);
  }
  if (code === '40001' || code === '55P03') {
    return new AppError(RepositoryErrorCode.TRANSACTION_CONFLICT, `Transaction conflict${ctx}`, 409, { detail: error.message }, error);
  }

  return new AppError('REPOSITORY_ERROR', `Repository operation failed${ctx}`, 500, { code, detail: error.message }, error);
}

export function buildOrderListFilter({ workspaceId, outletIds, channel, paymentStatus, fulfillmentStatus, dateFrom, dateTo, search, page = 1, limit = 50 } = {}) {
  assertWorkspaceScope(workspaceId);
  return {
    workspaceId,
    outletIds,
    channel,
    paymentStatus,
    fulfillmentStatus,
    dateFrom,
    dateTo,
    search,
    page,
    limit,
  };
}
