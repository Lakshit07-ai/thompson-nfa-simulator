# thompson-nfa-simulator

**Interactive Regular Expression → ε-NFA Simulator using Thompson's Construction**

Academic project for **CSET302 — Automata Theory and Computability**.

## Overview

AutomataLab is a client-side educational web application that:

1. Accepts a user-defined regular expression
2. Validates and parses it into an Abstract Syntax Tree
3. Converts the AST into an equivalent ε-NFA via **Thompson's Construction**
4. Shows every intermediate construction step
5. Renders an interactive NFA graph
6. Lets the user simulate arbitrary input strings (ε-closure + move) and see Accept/Reject

All algorithms are implemented in pure JavaScript. No external regex-to-NFA library is used.

## Supported Grammar

```
RE            → Union
Union         → Concatenation ('|' Concatenation)*
Concatenation → Repetition+
Repetition    → Atom ('*')*
Atom          → SYMBOL | '(' RE ')' | ε | ∅
```

- Operators: `|` (union), implicit concatenation, `*` (Kleene star), `( )`
- Special: `ε` (empty string), `∅` (empty language)
- Precedence: Star > Concatenation > Union
- Alphabet: single-character symbols

## Quick Start

```bash
cd thompson-nfa-simulator
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

### Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Start development server             |
| `npm run build`| Production build                     |
| `npm run test` | Run the pure-JS algorithm test suite |
| `npm run preview` | Preview production build          |

## Project Structure

```
src/
  algorithms/
    validator.js    # Input validation & tokenization
    parser.js       # Recursive-descent parser → AST
    thompson.js     # Thompson's Construction + history
    nfa.js          # ε-closure, move, string simulation
    index.js        # Public API
  components/
    Header.jsx
    RegexInput.jsx
    ASTViewer.jsx
    ConstructionTimeline.jsx
    NFAGraph.jsx
    StringTester.jsx
  pages/
    Simulator.jsx
    Documentation.jsx
    About.jsx
  App.jsx
  main.jsx
  index.css
tests/
  algorithm.test.js
```

## Algorithm Correctness

The core algorithms are covered by an automated test suite (`npm run test`) that checks:

- Parser (precedence, parentheses, invalid inputs)
- Thompson construction for symbols, union, concatenation, star
- ε-closure and acceptance for representative strings
- Unique state identifiers and construction history

Two NFAs that accept the same language may have different state names and layouts; the tests compare accepted languages, not graph isomorphism.

## Design Notes

- Sophisticated dark theme (Linear / IDE inspired)
- Graph is the visual centrepiece (React Flow)
- Construction timeline behaves like a debugger
- String tester presents an execution trace table
- No fake / hardcoded automata — every expression runs through the same engine

## Limitations

- Single-character alphabet symbols only
- No character classes, quantifiers `{n,m}`, anchors, or look-around
- Automatic graph layout is heuristic; large NFAs may need manual node adjustment

## License

Academic / educational use. Team contribution details to be filled by the project group.
