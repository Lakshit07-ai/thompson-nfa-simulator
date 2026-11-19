import { astToString } from '../algorithms/parser.js'

export default function ASTViewer({ ast }) {
  if (!ast) return null
  const text = astToString(ast)

  return (
    <div>
      <div className="section-label" style={{ marginBottom: 12 }}>Abstract Syntax Tree</div>
      <pre className="ast-tree" style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        overflow: 'auto',
      }}>
        {text}
      </pre>
      <p style={{ marginTop: 12, color: 'var(--text-dim)', fontSize: 12 }}>
        The AST is produced by a recursive-descent parser that respects operator precedence:
        Kleene star &gt; Concatenation &gt; Union.
      </p>
    </div>
  )
}
