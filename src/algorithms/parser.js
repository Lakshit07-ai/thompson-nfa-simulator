/**
 * Recursive-descent parser for regular expressions.
 * Produces an Abstract Syntax Tree (AST).
 *
 * Precedence (highest to lowest):
 *   1. Kleene Star (*)
 *   2. Concatenation (implicit)
 *   3. Union (|)
 *
 * AST node shapes:
 *   { type: 'SYMBOL', value: string }
 *   { type: 'EPSILON' }
 *   { type: 'EMPTY' }          // empty language ∅
 *   { type: 'STAR', child: Node }
 *   { type: 'CONCAT', left: Node, right: Node }
 *   { type: 'UNION', left: Node, right: Node }
 */

import { tokenize, EPSILON, EMPTY_LANG, validateRegex } from './validator.js';

/**
 * Parse a validated token stream into an AST.
 * Caller should call validateRegex first.
 */
export function parse(tokens) {
  if (!tokens || tokens.length === 0) {
    throw new Error('Cannot parse empty token list.');
  }

  let pos = 0;

  function peek() {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function consume(expectedValue) {
    const t = peek();
    if (!t) throw new Error(`Unexpected end of expression. Expected '${expectedValue}'.`);
    if (expectedValue && t.value !== expectedValue) {
      throw new Error(`Expected '${expectedValue}' but found '${t.value}'.`);
    }
    pos++;
    return t;
  }

  // RE → Union
  function parseUnion() {
    let left = parseConcat();
    while (peek() && peek().value === '|') {
      consume('|');
      const right = parseConcat();
      left = { type: 'UNION', left, right };
    }
    return left;
  }

  // Concatenation → Repetition+
  function parseConcat() {
    let left = parseRepetition();
    // Continue while next token can start an atom
    while (peek() && canStartAtom(peek())) {
      const right = parseRepetition();
      left = { type: 'CONCAT', left, right };
    }
    return left;
  }

  function canStartAtom(token) {
    if (!token) return false;
    if (token.type === 'symbol' || token.type === 'epsilon' || token.type === 'empty') return true;
    if (token.type === 'operator' && token.value === '(') return true;
    return false;
  }

  // Repetition → Atom ('*')*
  function parseRepetition() {
    let node = parseAtom();
    while (peek() && peek().value === '*') {
      consume('*');
      node = { type: 'STAR', child: node };
    }
    return node;
  }

  // Atom → SYMBOL | '(' RE ')' | ε | ∅
  function parseAtom() {
    const t = peek();
    if (!t) {
      throw new Error('Unexpected end of expression while parsing atom.');
    }

    if (t.type === 'symbol') {
      consume();
      return { type: 'SYMBOL', value: t.value };
    }

    if (t.type === 'epsilon') {
      consume();
      return { type: 'EPSILON' };
    }

    if (t.type === 'empty') {
      consume();
      return { type: 'EMPTY' };
    }

    if (t.value === '(') {
      consume('(');
      // Empty parentheses () → EPSILON
      if (peek() && peek().value === ')') {
        consume(')');
        return { type: 'EPSILON' };
      }
      const node = parseUnion();
      consume(')');
      return node;
    }

    throw new Error(`Unexpected token '${t.value}' while parsing atom.`);
  }

  const ast = parseUnion();

  if (pos < tokens.length) {
    throw new Error(`Unexpected token '${tokens[pos].value}' after complete expression.`);
  }

  return ast;
}

/**
 * High-level entry: validate + parse.
 * Returns { ok: true, ast, tokens } or { ok: false, error }
 */
export function parseRegex(input) {
  const validation = validateRegex(input);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  try {
    const ast = parse(validation.tokens);
    return { ok: true, ast, tokens: validation.tokens };
  } catch (err) {
    return { ok: false, error: err.message || 'Parse error.' };
  }
}

/**
 * Pretty-print AST as indented text (for the AST viewer panel).
 */
export function astToString(node, indent = 0) {
  if (!node) return '';
  const pad = '  '.repeat(indent);

  switch (node.type) {
    case 'SYMBOL':
      return `${pad}SYMBOL(${node.value})`;
    case 'EPSILON':
      return `${pad}EPSILON(ε)`;
    case 'EMPTY':
      return `${pad}EMPTY(∅)`;
    case 'STAR':
      return `${pad}STAR\n${astToString(node.child, indent + 1)}`;
    case 'CONCAT':
      return `${pad}CONCAT\n${astToString(node.left, indent + 1)}\n${astToString(node.right, indent + 1)}`;
    case 'UNION':
      return `${pad}UNION\n${astToString(node.left, indent + 1)}\n${astToString(node.right, indent + 1)}`;
    default:
      return `${pad}UNKNOWN`;
  }
}

/**
 * Convert AST to a compact tree object useful for React tree rendering.
 */
export function astToTree(node) {
  if (!node) return null;
  switch (node.type) {
    case 'SYMBOL':
      return { name: `SYMBOL(${node.value})`, children: [] };
    case 'EPSILON':
      return { name: 'ε', children: [] };
    case 'EMPTY':
      return { name: '∅', children: [] };
    case 'STAR':
      return { name: 'STAR (*)', children: [astToTree(node.child)] };
    case 'CONCAT':
      return { name: 'CONCAT', children: [astToTree(node.left), astToTree(node.right)] };
    case 'UNION':
      return { name: 'UNION (|)', children: [astToTree(node.left), astToTree(node.right)] };
    default:
      return { name: '?', children: [] };
  }
}

/**
 * Reconstruct a readable sub-expression string from an AST node (for step descriptions).
 */
export function astToExpr(node) {
  if (!node) return '';
  switch (node.type) {
    case 'SYMBOL':
      return node.value;
    case 'EPSILON':
      return 'ε';
    case 'EMPTY':
      return '∅';
    case 'STAR': {
      const child = astToExpr(node.child);
      // Add parens if child is union or concat
      if (node.child.type === 'UNION' || node.child.type === 'CONCAT') {
        return `(${child})*`;
      }
      return `${child}*`;
    }
    case 'CONCAT': {
      const left = astToExpr(node.left);
      const right = astToExpr(node.right);
      // Parenthesize unions
      const L = node.left.type === 'UNION' ? `(${left})` : left;
      const R = node.right.type === 'UNION' ? `(${right})` : right;
      return `${L}${R}`;
    }
    case 'UNION':
      return `${astToExpr(node.left)}|${astToExpr(node.right)}`;
    default:
      return '?';
  }
}
