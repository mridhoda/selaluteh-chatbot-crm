const locks = new Map();

const LOCK_TIMEOUT_MS = 30000;

export function acquireRunLock(chatId) {
  const existing = locks.get(chatId);
  if (existing && Date.now() - existing < LOCK_TIMEOUT_MS) {
    return false;
  }
  locks.set(chatId, Date.now());
  return true;
}

export function releaseRunLock(chatId) {
  locks.delete(chatId);
}

export function clearStaleLocks() {
  const now = Date.now();
  for (const [chatId, acquiredAt] of locks) {
    if (now - acquiredAt >= LOCK_TIMEOUT_MS) {
      locks.delete(chatId);
    }
  }
  return locks.size;
}
