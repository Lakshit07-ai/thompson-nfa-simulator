export default function About() {
  return (
    <div className="page-content">
      <h1>About AutomataLab</h1>
      <p>
        <strong>AutomataLab</strong> is an interactive educational web application that
        converts regular expressions into equivalent ε-NFAs using Thompson&apos;s Construction
        and lets students simulate string acceptance.
      </p>

      <h2>Project Objective</h2>
      <p>
        Provide a clear, step-by-step visualization of the classic algorithm that
        underpins many compilers, text-processing tools, and formal-language courses.
        Students can enter arbitrary regular expressions (within the supported grammar),
        watch the NFA being built, inspect intermediate fragments, and test strings
        against the resulting automaton.
      </p>

      <h2>Academic Context</h2>
      <p>
        Course: <strong>CSET302 — Automata Theory and Computability</strong>
      </p>
      <p>
        This project is intended for both M1 (problem analysis & design) and M2
        (implementation, testing & demonstration) evaluation stages.
      </p>

      <h2>Technologies</h2>
      <ul>
        <li>React 19 + Vite</li>
        <li>Pure JavaScript implementation of parser, Thompson construction, ε-closure and NFA simulation</li>
        <li>React Flow (@xyflow/react) for interactive graph visualization</li>
        <li>Custom professional dark UI (no external CSS framework required)</li>
      </ul>

      <h2>Key Features</h2>
      <ul>
        <li>User-defined regular expressions with validation</li>
        <li>Recursive-descent parser → Abstract Syntax Tree</li>
        <li>Thompson&apos;s Construction with full construction history</li>
        <li>Interactive ε-NFA graph (zoom, pan, drag nodes)</li>
        <li>Step-by-step construction timeline</li>
        <li>String simulator with ε-closure / move trace</li>
        <li>Accept / Reject result with detailed execution table</li>
      </ul>

      <h2>Team Contributions</h2>
      <p>
        (Placeholders for individual student names, enrollment numbers and
        contribution descriptions — to be filled by the project team.)
      </p>
      <ul>
        <li>Algorithm design & implementation (parser, Thompson, simulation)</li>
        <li>UI / UX design and React components</li>
        <li>Graph visualization and layout</li>
        <li>Testing and documentation</li>
      </ul>

      <h2>Limitations</h2>
      <ul>
        <li>Alphabet symbols are single characters (no multi-character tokens by default).</li>
        <li>Extended regex features (character classes, quantifiers {'{n,m}'}, look-around, etc.) are not supported.</li>
        <li>Layout of the NFA graph is heuristic; large expressions may require manual node dragging.</li>
      </ul>
    </div>
  )
}
