export default function Documentation() {
  return (
    <div className="page-content">
      <h1>Documentation</h1>
      <p>
        AutomataLab converts regular expressions into equivalent ε-NFAs using
        Thompson&apos;s Construction and lets you simulate string acceptance.
      </p>

      <h2>Supported Regular Expression Grammar</h2>
      <pre>{`RE            → Union
Union         → Concatenation ('|' Concatenation)*
Concatenation → Repetition+
Repetition    → Atom ('*')*
Atom          → SYMBOL | '(' RE ')' | ε | ∅`}</pre>

      <p>
        <strong>Operators:</strong> <code>|</code> (union), implicit concatenation,
        <code>*</code> (Kleene star), <code>( )</code> (grouping).
      </p>
      <p>
        <strong>Special symbols:</strong> <code>ε</code> (empty string), <code>∅</code> (empty language).
      </p>
      <p>
        <strong>Precedence (highest → lowest):</strong> Kleene star → Concatenation → Union.
      </p>
      <p>
        Alphabet symbols are single characters (a–z, A–Z, 0–9 and most printable characters
        that are not operators).
      </p>

      <h2>Thompson&apos;s Construction</h2>
      <p>
        Thompson&apos;s Construction builds an ε-NFA from a regular expression by
        composing four primitive patterns:
      </p>

      <h3>1. Basic Symbol</h3>
      <p>For a symbol <code>a</code>:</p>
      <pre>{`q₀ ──a──► q₁`}</pre>
      <p>One start state, one final state, one transition labelled <code>a</code>.</p>

      <h3>2. Union (a|b)</h3>
      <pre>{`        ε     (NFA for a)     ε
      ┌───► startA ··· finalA ───┐
newS ─┤                          ├──► newF
      └───► startB ··· finalB ───┘
        ε                     ε`}</pre>
      <p>
        Create a new start and a new final. Add ε-transitions from the new start
        to both sub-NFA starts, and from both sub-NFA finals to the new final.
      </p>

      <h3>3. Concatenation (ab)</h3>
      <pre>{`(NFA for a) ──ε──► (NFA for b)
start = startA, final = finalB`}</pre>
      <p>
        Connect every final state of the left NFA to the start state of the right
        NFA with an ε-transition.
      </p>

      <h3>4. Kleene Star (a*)</h3>
      <pre>{`          ε
newS ──────────────► newF
  │  ε           ε  ▲
  └──► startA ··· finalA
         ▲         │
         └────ε────┘`}</pre>
      <p>
        New start has ε to the old start and to the new final (zero occurrences).
        Old final has ε back to the old start (repeat) and to the new final.
      </p>

      <h2>ε-Closure and NFA Simulation</h2>
      <p>Given an ε-NFA and an input string w = a₁a₂…aₙ:</p>
      <pre>{`S₀ = ε-closure({q₀})
Sᵢ₊₁ = ε-closure( move(Sᵢ, aᵢ₊₁) )
Accept iff Sₙ ∩ F ≠ ∅`}</pre>
      <p>
        <code>ε-closure(S)</code> is the set of states reachable from S by following
        only ε-transitions (including the states in S themselves).
      </p>
      <p>
        <code>move(S, a)</code> is the set of states reachable from S by a single
        transition labelled a.
      </p>

      <h2>Using the Simulator</h2>
      <ol>
        <li>Enter a regular expression (or click an example).</li>
        <li>Click <strong>Generate ε-NFA</strong>.</li>
        <li>Inspect the AST, step through the construction history, and explore the interactive graph.</li>
        <li>Type a test string in the bottom panel and run the simulation to see acceptance and the full execution trace.</li>
      </ol>

      <h2>Notes</h2>
      <ul>
        <li>Two equivalent NFAs may have different state names and graph layouts; language equivalence is what matters.</li>
        <li>The empty string ε is accepted by any expression that can generate the empty word (e.g. a*, (a|b)*).</li>
        <li>The empty language ∅ accepts nothing.</li>
      </ul>
    </div>
  )
}
