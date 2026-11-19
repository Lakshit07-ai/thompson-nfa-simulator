/**
 * NFA Execution Engine
 * Implements ε-closure, move, and string acceptance for ε-NFAs.
 *
 * Formal definition:
 *   S₀ = ε-closure({q₀})
 *   S_{i+1} = ε-closure( move(S_i, a_{i+1}) )
 *   Accept if S_n ∩ F ≠ ∅
 */

import { EPSILON } from './thompson.js';

/**
 * Compute the ε-closure of a set of states.
 * Returns a Set of state ids reachable from the given states by only ε-transitions.
 */
export function epsilonClosure(nfa, states) {
  const result = new Set(states);
  const stack = [...states];

  // Build adjacency list for ε-transitions for efficiency
  const epsilonAdj = new Map();
  for (const t of nfa.transitions) {
    if (t.symbol === EPSILON) {
      if (!epsilonAdj.has(t.from)) epsilonAdj.set(t.from, []);
      epsilonAdj.get(t.from).push(t.to);
    }
  }

  while (stack.length > 0) {
    const s = stack.pop();
    const neighbors = epsilonAdj.get(s) || [];
    for (const next of neighbors) {
      if (!result.has(next)) {
        result.add(next);
        stack.push(next);
      }
    }
  }

  return result;
}

/**
 * Move: from a set of states, follow transitions on the given symbol (not ε).
 * Returns a Set of destination states.
 */
export function move(nfa, states, symbol) {
  const result = new Set();
  for (const t of nfa.transitions) {
    if (t.symbol === symbol && states.has(t.from)) {
      result.add(t.to);
    }
  }
  return result;
}

/**
 * Simulate the NFA on an input string.
 * Returns a detailed execution trace and the accept/reject result.
 *
 * @param {object} nfa - The NFA data structure
 * @param {string} input - The input string (use '' for empty string)
 * @returns {
 *   accepted: boolean,
 *   steps: Array<{ step, symbol, activeStates: string[], description }>,
 *   finalActiveStates: string[]
 * }
 */
export function simulateNFA(nfa, input) {
  if (!nfa || !nfa.startState) {
    return {
      accepted: false,
      steps: [],
      finalActiveStates: [],
      error: 'Invalid NFA.',
    };
  }

  // Treat null/undefined as empty string
  const str = input === null || input === undefined ? '' : String(input);

  const steps = [];

  // Step 0: ε-closure of start state
  let current = epsilonClosure(nfa, new Set([nfa.startState]));
  let currentSorted = Array.from(current).sort(stateSort);

  steps.push({
    step: 0,
    symbol: 'ε-closure',
    activeStates: currentSorted,
    description: `Initial ε-closure of start state {${nfa.startState}} = {${currentSorted.join(', ')}}`,
  });

  // Process each character
  for (let i = 0; i < str.length; i++) {
    const a = str[i];

    // Optional: if symbol is not in alphabet, move will be empty → reject path
    const moved = move(nfa, current, a);
    current = epsilonClosure(nfa, moved);
    currentSorted = Array.from(current).sort(stateSort);

    steps.push({
      step: i + 1,
      symbol: a,
      activeStates: currentSorted,
      description:
        `After reading '${a}': move → {${Array.from(moved).sort(stateSort).join(', ') || '∅'}}, ` +
        `ε-closure → {${currentSorted.join(', ') || '∅'}}`,
    });

    // Early exit optimisation: if no active states, remaining input cannot be accepted
    if (current.size === 0) {
      // Still record the remaining symbols as rejected
      for (let j = i + 1; j < str.length; j++) {
        steps.push({
          step: j + 1,
          symbol: str[j],
          activeStates: [],
          description: `No active states remaining; input '${str[j]}' cannot be consumed.`,
        });
      }
      break;
    }
  }

  // Acceptance check
  const finalSet = new Set(nfa.finalStates);
  const accepted = currentSorted.some((s) => finalSet.has(s));

  return {
    accepted,
    steps,
    finalActiveStates: currentSorted,
    error: null,
  };
}

/**
 * Helper: natural sort for state ids q0, q1, q10, ...
 */
function stateSort(a, b) {
  const na = parseInt(String(a).replace(/\D/g, ''), 10) || 0;
  const nb = parseInt(String(b).replace(/\D/g, ''), 10) || 0;
  return na - nb;
}

/**
 * Quick accept/reject without full trace (useful for tests).
 */
export function accepts(nfa, input) {
  const result = simulateNFA(nfa, input);
  return result.accepted;
}

/**
 * Compute the set of all reachable states (for layout / analysis).
 */
export function reachableStates(nfa) {
  const visited = new Set();
  const stack = [nfa.startState];
  visited.add(nfa.startState);

  const adj = new Map();
  for (const t of nfa.transitions) {
    if (!adj.has(t.from)) adj.set(t.from, []);
    adj.get(t.from).push(t.to);
  }

  while (stack.length) {
    const s = stack.pop();
    for (const next of adj.get(s) || []) {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
      }
    }
  }
  return visited;
}
