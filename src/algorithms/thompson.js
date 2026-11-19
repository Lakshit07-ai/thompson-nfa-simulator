/**
 * Thompson's Construction
 * Converts an AST into an equivalent ε-NFA.
 *
 * Each construction returns an NFA fragment:
 * {
 *   states: string[],
 *   alphabet: string[],          // symbols excluding ε
 *   transitions: { from, to, symbol }[],
 *   startState: string,
 *   finalStates: string[]        // always a single final for Thompson fragments
 * }
 *
 * Construction history is recorded so the UI can step through the process.
 */

import { astToExpr } from './parser.js';

const EPSILON = 'ε';

/** Global state counter – reset before each top-level construction. */
let stateCounter = 0;

function nextStateId() {
  return `q${stateCounter++}`;
}

/**
 * Create a fresh empty NFA fragment.
 */
function createFragment() {
  return {
    states: [],
    alphabet: [],
    transitions: [],
    startState: null,
    finalStates: [],
  };
}

/**
 * Clone a fragment (shallow enough for our purposes).
 */
function cloneFragment(frag) {
  return {
    states: [...frag.states],
    alphabet: [...frag.alphabet],
    transitions: frag.transitions.map((t) => ({ ...t })),
    startState: frag.startState,
    finalStates: [...frag.finalStates],
  };
}

/**
 * Merge two alphabets without duplicates.
 */
function mergeAlphabet(a, b) {
  const set = new Set([...a, ...b]);
  return Array.from(set).filter((s) => s !== EPSILON);
}

/**
 * Record a construction step.
 */
function recordStep(history, step) {
  history.push({
    stepNumber: history.length + 1,
    ...step,
    // Deep-ish copy of the resulting NFA so later mutations don't affect history
    nfa: {
      states: [...step.nfa.states],
      alphabet: [...step.nfa.alphabet],
      transitions: step.nfa.transitions.map((t) => ({ ...t })),
      startState: step.nfa.startState,
      finalStates: [...step.nfa.finalStates],
    },
  });
}

/**
 * A. Basic Symbol Construction
 * For symbol a:  q0 --a--> q1
 */
function constructSymbol(symbol, history) {
  const start = nextStateId();
  const end = nextStateId();

  const frag = {
    states: [start, end],
    alphabet: symbol === EPSILON ? [] : [symbol],
    transitions: [{ from: start, to: end, symbol }],
    startState: start,
    finalStates: [end],
  };

  recordStep(history, {
    operation: 'SYMBOL',
    subExpression: symbol,
    description: `Create basic NFA for symbol '${symbol}': start state → '${symbol}' → final state.`,
    newlyCreatedStates: [start, end],
    newlyCreatedTransitions: frag.transitions.map((t) => ({ ...t })),
    nfa: frag,
  });

  return frag;
}

/**
 * Empty language ∅ – a single start state with no transitions and no final state.
 * (Some presentations use a start with no outgoing edges.)
 * For simulation convenience we still give it a final that is unreachable.
 * Classic Thompson for ∅ is often just a start state that is not accepting.
 */
function constructEmpty(history) {
  const start = nextStateId();
  // No final state – language is empty
  const frag = {
    states: [start],
    alphabet: [],
    transitions: [],
    startState: start,
    finalStates: [], // empty language
  };

  recordStep(history, {
    operation: 'EMPTY',
    subExpression: '∅',
    description: 'Create NFA for the empty language ∅: a single start state with no accepting state.',
    newlyCreatedStates: [start],
    newlyCreatedTransitions: [],
    nfa: frag,
  });

  return frag;
}

/**
 * ε (empty string) – start and final are the same state, or start --ε--> final.
 * We use two states connected by ε for uniformity with other constructions.
 */
function constructEpsilon(history) {
  const start = nextStateId();
  const end = nextStateId();

  const frag = {
    states: [start, end],
    alphabet: [],
    transitions: [{ from: start, to: end, symbol: EPSILON }],
    startState: start,
    finalStates: [end],
  };

  recordStep(history, {
    operation: 'EPSILON',
    subExpression: 'ε',
    description: 'Create NFA for the empty string ε: start --ε--> final.',
    newlyCreatedStates: [start, end],
    newlyCreatedTransitions: frag.transitions.map((t) => ({ ...t })),
    nfa: frag,
  });

  return frag;
}

/**
 * B. Union Construction (a|b)
 * New start --ε--> startA, startB
 * finalA, finalB --ε--> new final
 */
function constructUnion(fragA, fragB, history, subExpr) {
  const newStart = nextStateId();
  const newFinal = nextStateId();

  const states = [newStart, newFinal, ...fragA.states, ...fragB.states];
  const transitions = [
    ...fragA.transitions,
    ...fragB.transitions,
    { from: newStart, to: fragA.startState, symbol: EPSILON },
    { from: newStart, to: fragB.startState, symbol: EPSILON },
    // Handle multiple finals (though Thompson keeps one)
    ...fragA.finalStates.map((f) => ({ from: f, to: newFinal, symbol: EPSILON })),
    ...fragB.finalStates.map((f) => ({ from: f, to: newFinal, symbol: EPSILON })),
  ];

  // If a fragment has no final states (empty language), the corresponding ε-edges are simply omitted.
  const frag = {
    states,
    alphabet: mergeAlphabet(fragA.alphabet, fragB.alphabet),
    transitions,
    startState: newStart,
    finalStates: [newFinal],
  };

  const newTransitions = [
    { from: newStart, to: fragA.startState, symbol: EPSILON },
    { from: newStart, to: fragB.startState, symbol: EPSILON },
    ...fragA.finalStates.map((f) => ({ from: f, to: newFinal, symbol: EPSILON })),
    ...fragB.finalStates.map((f) => ({ from: f, to: newFinal, symbol: EPSILON })),
  ];

  recordStep(history, {
    operation: 'UNION',
    subExpression: subExpr,
    description:
      `Apply UNION construction for '${subExpr}'. ` +
      `New start state has ε-transitions to both sub-NFAs; both sub-finals have ε-transitions to a new final state.`,
    newlyCreatedStates: [newStart, newFinal],
    newlyCreatedTransitions: newTransitions,
    nfa: frag,
  });

  return frag;
}

/**
 * C. Concatenation Construction (ab)
 * Connect final(s) of A to start of B with ε.
 * Result start = start(A), final = final(B)
 */
function constructConcat(fragA, fragB, history, subExpr) {
  const transitions = [
    ...fragA.transitions,
    ...fragB.transitions,
    ...fragA.finalStates.map((f) => ({
      from: f,
      to: fragB.startState,
      symbol: EPSILON,
    })),
  ];

  const frag = {
    states: [...fragA.states, ...fragB.states],
    alphabet: mergeAlphabet(fragA.alphabet, fragB.alphabet),
    transitions,
    startState: fragA.startState,
    finalStates: [...fragB.finalStates],
  };

  const newTransitions = fragA.finalStates.map((f) => ({
    from: f,
    to: fragB.startState,
    symbol: EPSILON,
  }));

  recordStep(history, {
    operation: 'CONCAT',
    subExpression: subExpr,
    description:
      `Apply CONCATENATION for '${subExpr}'. ` +
      `Connect final state(s) of the left NFA to the start state of the right NFA with ε-transitions.`,
    newlyCreatedStates: [],
    newlyCreatedTransitions: newTransitions,
    nfa: frag,
  });

  return frag;
}

/**
 * D. Kleene Star Construction (a*)
 * New start --ε--> old start
 * New start --ε--> new final          (zero occurrences)
 * Old final --ε--> old start          (loop)
 * Old final --ε--> new final
 */
function constructStar(frag, history, subExpr) {
  const newStart = nextStateId();
  const newFinal = nextStateId();

  const transitions = [
    ...frag.transitions,
    { from: newStart, to: frag.startState, symbol: EPSILON },
    { from: newStart, to: newFinal, symbol: EPSILON },
    ...frag.finalStates.map((f) => ({ from: f, to: frag.startState, symbol: EPSILON })),
    ...frag.finalStates.map((f) => ({ from: f, to: newFinal, symbol: EPSILON })),
  ];

  const result = {
    states: [newStart, newFinal, ...frag.states],
    alphabet: [...frag.alphabet],
    transitions,
    startState: newStart,
    finalStates: [newFinal],
  };

  const newTransitions = [
    { from: newStart, to: frag.startState, symbol: EPSILON },
    { from: newStart, to: newFinal, symbol: EPSILON },
    ...frag.finalStates.map((f) => ({ from: f, to: frag.startState, symbol: EPSILON })),
    ...frag.finalStates.map((f) => ({ from: f, to: newFinal, symbol: EPSILON })),
  ];

  recordStep(history, {
    operation: 'STAR',
    subExpression: subExpr,
    description:
      `Apply KLEENE STAR construction for '${subExpr}'. ` +
      `New start has ε to old start and to new final (zero times). ` +
      `Old final has ε back to old start (repeat) and to new final.`,
    newlyCreatedStates: [newStart, newFinal],
    newlyCreatedTransitions: newTransitions,
    nfa: result,
  });

  return result;
}

/**
 * Recursively build the NFA from an AST node, recording every step.
 */
function build(node, history) {
  if (!node) {
    throw new Error('Cannot build NFA from null AST node.');
  }

  switch (node.type) {
    case 'SYMBOL':
      return constructSymbol(node.value, history);

    case 'EPSILON':
      return constructEpsilon(history);

    case 'EMPTY':
      return constructEmpty(history);

    case 'STAR': {
      const childFrag = build(node.child, history);
      const expr = astToExpr(node);
      return constructStar(childFrag, history, expr);
    }

    case 'CONCAT': {
      const leftFrag = build(node.left, history);
      const rightFrag = build(node.right, history);
      const expr = astToExpr(node);
      return constructConcat(leftFrag, rightFrag, history, expr);
    }

    case 'UNION': {
      const leftFrag = build(node.left, history);
      const rightFrag = build(node.right, history);
      const expr = astToExpr(node);
      return constructUnion(leftFrag, rightFrag, history, expr);
    }

    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

/**
 * Public entry point.
 * Resets state counter, builds the NFA, returns { nfa, history }.
 */
export function thompsonConstruct(ast) {
  stateCounter = 0;
  const history = [];

  if (!ast) {
    throw new Error('AST is required for Thompson construction.');
  }

  const nfa = build(ast, history);

  // Ensure unique state list and sorted for determinism
  nfa.states = Array.from(new Set(nfa.states)).sort((a, b) => {
    const na = parseInt(a.slice(1), 10);
    const nb = parseInt(b.slice(1), 10);
    return na - nb;
  });

  nfa.alphabet = Array.from(new Set(nfa.alphabet)).sort();

  // Final history entry already contains the complete NFA.
  return {
    nfa,
    history,
    stateCount: stateCounter,
  };
}

/**
 * Utility: produce a human-readable description of an NFA (for debugging / panel).
 */
export function nfaToString(nfa) {
  if (!nfa) return 'null';
  const lines = [];
  lines.push(`States: {${nfa.states.join(', ')}}`);
  lines.push(`Alphabet: {${nfa.alphabet.join(', ')}}`);
  lines.push(`Start: ${nfa.startState}`);
  lines.push(`Final: {${nfa.finalStates.join(', ')}}`);
  lines.push('Transitions:');
  for (const t of nfa.transitions) {
    lines.push(`  δ(${t.from}, ${t.symbol}) = ${t.to}`);
  }
  return lines.join('\n');
}

export { EPSILON };
