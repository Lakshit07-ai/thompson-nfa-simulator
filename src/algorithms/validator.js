/**
 * Regex Validator for AutomataLab
 * Validates user-provided regular expressions against the supported grammar.
 *
 * Grammar (simplified):
 *   RE           → Union
 *   Union        → Concatenation ('|' Concatenation)*
 *   Concatenation→ Repetition+
 *   Repetition   → Atom ('*')?
 *   Atom         → SYMBOL | '(' RE ')' | 'ε' | '∅'
 *
 * Supported operators: | (union), implicit concat, * (Kleene star), ( )
 * Special symbols: ε (epsilon), ∅ (empty language)
 * Alphabet: single alphanumeric characters and common symbols (a-z, A-Z, 0-9, and a few others)
 */

const EPSILON = 'ε';
const EMPTY_LANG = '∅';
const SPECIAL_SYMBOLS = new Set([EPSILON, EMPTY_LANG]);
const OPERATORS = new Set(['|', '*', '(', ')']);

/**
 * Check if a character is a valid alphabet symbol (single char).
 * We support a-z, A-Z, 0-9, and a small set of printable symbols that are not operators.
 */
function isSymbol(ch) {
  if (SPECIAL_SYMBOLS.has(ch)) return true;
  if (OPERATORS.has(ch)) return false;
  // Single printable character that is not whitespace or control
  return typeof ch === 'string' && ch.length === 1 && !/\s/.test(ch);
}

/**
 * Validate balanced parentheses.
 */
function checkParentheses(expr) {
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth < 0) {
        return { valid: false, error: `Unmatched closing parenthesis at position ${i + 1}.` };
      }
    }
  }
  if (depth > 0) {
    return { valid: false, error: `Unmatched opening parenthesis. Missing ${depth} closing parenthesis(es).` };
  }
  return { valid: true };
}

/**
 * Tokenize the expression into a list of tokens for easier validation and parsing.
 * Tokens: { type: 'symbol' | 'operator' | 'epsilon' | 'empty', value: string }
 */
export function tokenize(expr) {
  const tokens = [];
  let i = 0;
  const s = expr.trim();

  while (i < s.length) {
    const ch = s[i];

    // Handle multi-char special symbols if present as unicode
    if (ch === 'ε' || ch === '∅') {
      tokens.push({ type: ch === 'ε' ? 'epsilon' : 'empty', value: ch });
      i++;
      continue;
    }

    // Allow "epsilon" or "empty" as aliases? Keep simple: only unicode for now.
    // Also allow 'e' as epsilon? No – stick to single-char alphabet + explicit ε/∅.

    if (ch === '|') {
      tokens.push({ type: 'operator', value: '|' });
      i++;
    } else if (ch === '*') {
      tokens.push({ type: 'operator', value: '*' });
      i++;
    } else if (ch === '(') {
      tokens.push({ type: 'operator', value: '(' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'operator', value: ')' });
      i++;
    } else if (/\s/.test(ch)) {
      i++; // skip whitespace
    } else if (isSymbol(ch)) {
      tokens.push({ type: 'symbol', value: ch });
      i++;
    } else {
      return {
        tokens: null,
        error: `Invalid character '${ch}' at position ${i + 1}. Supported symbols are alphanumeric and special ε, ∅.`,
      };
    }
  }

  return { tokens, error: null };
}

/**
 * Validate operator placement and missing operands.
 * This is a lightweight structural check before full parsing.
 */
function validateStructure(tokens) {
  if (!tokens || tokens.length === 0) {
    return { valid: false, error: 'Expression is empty.' };
  }

  // Cannot start with binary operator or star
  const first = tokens[0];
  if (first.type === 'operator' && (first.value === '|' || first.value === '*')) {
    return {
      valid: false,
      error: `Expression cannot start with '${first.value}'.`,
    };
  }

  // Cannot end with binary operator or open paren
  const last = tokens[tokens.length - 1];
  if (last.type === 'operator' && (last.value === '|' || last.value === '(')) {
    return {
      valid: false,
      error: `Expression cannot end with '${last.value}'.`,
    };
  }

  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;
    const next = i < tokens.length - 1 ? tokens[i + 1] : null;

    // Consecutive operators that are invalid
    if (curr.type === 'operator') {
      if (curr.value === '|') {
        // | cannot be followed by | or * or )
        if (next && next.type === 'operator' && (next.value === '|' || next.value === '*' || next.value === ')')) {
          return {
            valid: false,
            error: `Invalid operator sequence near position ${i + 1}: '|${next.value}'.`,
          };
        }
        // | must have something before and after
        if (!prev || (prev.type === 'operator' && prev.value === '(')) {
          return {
            valid: false,
            error: `Union operator '|' is missing a left operand.`,
          };
        }
      }

      if (curr.value === '*') {
        // * must be preceded by an atom (symbol, ), or another *)
        if (!prev) {
          return { valid: false, error: `Kleene star '*' cannot appear at the beginning.` };
        }
        if (prev.type === 'operator' && (prev.value === '|' || prev.value === '(' || prev.value === '*')) {
          // Allow **? We treat ** as invalid for simplicity (or allow successive * as a* *)
          // Standard: a** is valid (star of star). But consecutive * after | is invalid.
          if (prev.value === '|' || prev.value === '(') {
            return {
              valid: false,
              error: `Kleene star '*' has no operand before it.`,
            };
          }
        }
        // * cannot be followed by * in some grammars, but we allow a** as (a*)*
        // For now we allow consecutive * .
      }

      if (curr.value === '(') {
        // Empty group () is allowed and means ε in some systems; we treat it as ε.
        // But () is fine.
      }

      if (curr.value === ')') {
        // ) cannot follow (
        if (prev && prev.type === 'operator' && prev.value === '(') {
          // Empty parentheses → treat as ε later
        }
      }
    }
  }

  // Check for consecutive | |
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].type === 'operator' &&
      tokens[i].value === '|' &&
      tokens[i + 1].type === 'operator' &&
      tokens[i + 1].value === '|'
    ) {
      return { valid: false, error: `Consecutive union operators '||' are not allowed.` };
    }
  }

  return { valid: true };
}

/**
 * Main validation entry point.
 * Returns { valid: boolean, error?: string, tokens?: Token[] }
 */
export function validateRegex(input) {
  if (input === null || input === undefined) {
    return { valid: false, error: 'Input is null or undefined.' };
  }

  const expr = String(input).trim();

  if (expr.length === 0) {
    return { valid: false, error: 'Please enter a regular expression.' };
  }

  // Parentheses check first (on raw string)
  const parenCheck = checkParentheses(expr);
  if (!parenCheck.valid) {
    return parenCheck;
  }

  // Tokenize
  const { tokens, error: tokenError } = tokenize(expr);
  if (tokenError) {
    return { valid: false, error: tokenError };
  }

  if (!tokens || tokens.length === 0) {
    return { valid: false, error: 'Expression contains no valid tokens.' };
  }

  // Structural validation
  const structCheck = validateStructure(tokens);
  if (!structCheck.valid) {
    return structCheck;
  }

  return { valid: true, tokens, error: null };
}

/**
 * Convenience helper used by the UI.
 */
export function getValidationMessage(result) {
  if (result.valid) return null;
  return result.error || 'Invalid regular expression.';
}

export { EPSILON, EMPTY_LANG, isSymbol };
