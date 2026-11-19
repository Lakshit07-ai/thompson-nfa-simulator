/**
 * Manual / node-runnable test suite for the core algorithms.
 * Run with: node tests/algorithm.test.js
 */

import { parseRegex, thompsonConstruct, simulateNFA, accepts } from '../src/algorithms/index.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function test(name, fn) {
  console.log(`\n▸ ${name}`);
  try {
    fn();
  } catch (err) {
    failed++;
    console.error(`  ✗ threw: ${err.message}`);
  }
}

// ---------- Parser tests ----------
test('Parser: simple symbol', () => {
  const r = parseRegex('a');
  assert(r.ok, 'parses "a"');
  assert(r.ast.type === 'SYMBOL' && r.ast.value === 'a', 'AST is SYMBOL(a)');
});

test('Parser: concatenation', () => {
  const r = parseRegex('ab');
  assert(r.ok, 'parses "ab"');
  assert(r.ast.type === 'CONCAT', 'AST is CONCAT');
  assert(r.ast.left.value === 'a' && r.ast.right.value === 'b', 'children correct');
});

test('Parser: union', () => {
  const r = parseRegex('a|b');
  assert(r.ok, 'parses "a|b"');
  assert(r.ast.type === 'UNION', 'AST is UNION');
});

test('Parser: star', () => {
  const r = parseRegex('a*');
  assert(r.ok, 'parses "a*"');
  assert(r.ast.type === 'STAR', 'AST is STAR');
  assert(r.ast.child.value === 'a', 'child is a');
});

test('Parser: complex (a|b)*abb', () => {
  const r = parseRegex('(a|b)*abb');
  assert(r.ok, 'parses "(a|b)*abb"');
  assert(r.ast.type === 'CONCAT', 'top is CONCAT');
});

test('Parser: precedence – a|b* is a|(b*)', () => {
  const r = parseRegex('a|b*');
  assert(r.ok, 'parses "a|b*"');
  assert(r.ast.type === 'UNION', 'top is UNION');
  assert(r.ast.right.type === 'STAR', 'right is STAR');
});

test('Parser: parentheses force order', () => {
  const r = parseRegex('(a|b)*');
  assert(r.ok, 'parses "(a|b)*"');
  assert(r.ast.type === 'STAR', 'top is STAR');
  assert(r.ast.child.type === 'UNION', 'child is UNION');
});

test('Parser: invalid a|', () => {
  const r = parseRegex('a|');
  assert(!r.ok, 'rejects "a|"');
});

test('Parser: invalid |a', () => {
  const r = parseRegex('|a');
  assert(!r.ok, 'rejects "|a"');
});

test('Parser: invalid *a', () => {
  const r = parseRegex('*a');
  assert(!r.ok, 'rejects "*a"');
});

test('Parser: unbalanced paren', () => {
  const r = parseRegex('(ab');
  assert(!r.ok, 'rejects "(ab"');
});

// ---------- Thompson + simulation tests ----------
function build(expr) {
  const r = parseRegex(expr);
  if (!r.ok) throw new Error(`Parse failed for ${expr}: ${r.error}`);
  return thompsonConstruct(r.ast).nfa;
}

test('Accept: a on "a"', () => {
  const nfa = build('a');
  assert(accepts(nfa, 'a') === true, 'a accepts "a"');
  assert(accepts(nfa, 'b') === false, 'a rejects "b"');
  assert(accepts(nfa, '') === false, 'a rejects empty');
});

test('Accept: ab', () => {
  const nfa = build('ab');
  assert(accepts(nfa, 'ab') === true, 'ab accepts "ab"');
  assert(accepts(nfa, 'a') === false, 'ab rejects "a"');
  assert(accepts(nfa, 'ba') === false, 'ab rejects "ba"');
});

test('Accept: a|b', () => {
  const nfa = build('a|b');
  assert(accepts(nfa, 'a') === true, 'a|b accepts "a"');
  assert(accepts(nfa, 'b') === true, 'a|b accepts "b"');
  assert(accepts(nfa, 'ab') === false, 'a|b rejects "ab"');
  assert(accepts(nfa, '') === false, 'a|b rejects empty');
});

test('Accept: a*', () => {
  const nfa = build('a*');
  assert(accepts(nfa, '') === true, 'a* accepts empty string');
  assert(accepts(nfa, 'a') === true, 'a* accepts "a"');
  assert(accepts(nfa, 'aaa') === true, 'a* accepts "aaa"');
  assert(accepts(nfa, 'b') === false, 'a* rejects "b"');
  assert(accepts(nfa, 'ab') === false, 'a* rejects "ab"');
});

test('Accept: (a|b)*', () => {
  const nfa = build('(a|b)*');
  assert(accepts(nfa, '') === true, '(a|b)* accepts empty');
  assert(accepts(nfa, 'abba') === true, '(a|b)* accepts "abba"');
  assert(accepts(nfa, 'abc') === false, '(a|b)* rejects "abc"');
});

test('Accept: a(b|c)*', () => {
  const nfa = build('a(b|c)*');
  assert(accepts(nfa, 'a') === true, 'a(b|c)* accepts "a"');
  assert(accepts(nfa, 'abcb') === true, 'a(b|c)* accepts "abcb"');
  assert(accepts(nfa, 'bca') === false, 'a(b|c)* rejects "bca"');
  assert(accepts(nfa, '') === false, 'a(b|c)* rejects empty');
});

test('Accept: (a|b)*abb', () => {
  const nfa = build('(a|b)*abb');
  assert(accepts(nfa, 'aabb') === true, '(a|b)*abb accepts "aabb"');
  assert(accepts(nfa, 'abb') === true, '(a|b)*abb accepts "abb"');
  assert(accepts(nfa, 'babb') === true, '(a|b)*abb accepts "babb"');
  assert(accepts(nfa, 'ab') === false, '(a|b)*abb rejects "ab"');
  assert(accepts(nfa, 'abc') === false, '(a|b)*abb rejects "abc"');
});

test('Accept: (ab|ba)*', () => {
  const nfa = build('(ab|ba)*');
  assert(accepts(nfa, '') === true, '(ab|ba)* accepts empty');
  assert(accepts(nfa, 'ab') === true, '(ab|ba)* accepts "ab"');
  assert(accepts(nfa, 'ba') === true, '(ab|ba)* accepts "ba"');
  assert(accepts(nfa, 'abba') === true, '(ab|ba)* accepts "abba"');
  assert(accepts(nfa, 'a') === false, '(ab|ba)* rejects "a"');
});

test('Simulation returns detailed steps', () => {
  const nfa = build('a*');
  const sim = simulateNFA(nfa, 'aa');
  assert(sim.accepted === true, 'accepted');
  assert(sim.steps.length === 3, '3 steps (ε + a + a)');
  assert(sim.steps[0].symbol === 'ε-closure', 'first step is ε-closure');
});

test('Unique state ids', () => {
  const parsed = parseRegex('(a|b)*');
  const { nfa, history } = thompsonConstruct(parsed.ast);
  const ids = new Set(nfa.states);
  assert(ids.size === nfa.states.length, 'no duplicate state ids');
  assert(history.length >= 4, 'history has multiple steps');
});

// ---------- Summary ----------
console.log('\n========================================');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('========================================');
process.exit(failed > 0 ? 1 : 0);
