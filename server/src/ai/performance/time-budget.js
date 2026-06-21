const DEFAULTS = {
  modelCallMs: 15000,
  toolExecMs: 10000,
  totalTurnMs: 60000,
};

let remainingMs = DEFAULTS.totalTurnMs;

export function resetBudget({ totalTurnMs } = {}) {
  remainingMs = totalTurnMs ?? DEFAULTS.totalTurnMs;
}

export function consumeModelBudget(ms) {
  const taken = Math.min(ms, remainingMs);
  remainingMs -= taken;
  return { consumed: taken, remaining: remainingMs, exhausted: remainingMs <= 0 };
}

export function consumeToolBudget(ms) {
  const taken = Math.min(ms, remainingMs);
  remainingMs -= taken;
  return { consumed: taken, remaining: remainingMs, exhausted: remainingMs <= 0 };
}

export function getRemaining() {
  return remainingMs;
}

export function isExhausted() {
  return remainingMs <= 0;
}
