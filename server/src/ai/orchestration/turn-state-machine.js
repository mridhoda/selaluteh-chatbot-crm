const STATES = [
  'received', 'eligible', 'context_building', 'model_running',
  'tool_requested', 'tool_running', 'finalizing',
  'persisting', 'sending', 'completed', 'failed', 'cancelled', 'handed_off',
];

const TERMINAL = new Set(['completed', 'failed', 'cancelled', 'handed_off']);

const TRANSITIONS = {
  received: ['eligible'],
  eligible: ['context_building', 'failed'],
  context_building: ['model_running', 'failed'],
  model_running: ['tool_requested', 'finalizing', 'failed', 'cancelled'],
  tool_requested: ['tool_running'],
  tool_running: ['model_running', 'failed', 'cancelled'],
  finalizing: ['persisting', 'failed'],
  persisting: ['sending', 'failed'],
  sending: ['completed', 'failed', 'handed_off'],
};

export function createTurnState() {
  let state = 'received';
  let history = [{ state, at: Date.now() }];

  function current() { return state; }

  function canTransition(to) {
    const allowed = TRANSITIONS[state];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  function transition(to) {
    if (TERMINAL.has(state)) throw new Error(`Cannot transition from terminal state: ${state}`);
    if (!canTransition(to)) throw new Error(`Invalid transition: ${state} -> ${to}`);
    state = to;
    history.push({ state, at: Date.now() });
    return state;
  }

  function isTerminal() { return TERMINAL.has(state); }

  return { current, transition, canTransition, isTerminal, history: () => [...history] };
}

export { STATES, TERMINAL, TRANSITIONS };
