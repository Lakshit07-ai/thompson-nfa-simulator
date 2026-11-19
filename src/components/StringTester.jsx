import { useState, useCallback } from 'react'
import { simulateNFA } from '../algorithms/nfa.js'

export default function StringTester({ nfa, onActiveStates }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [traceStep, setTraceStep] = useState(0)

  const run = useCallback(() => {
    if (!nfa) return
    const sim = simulateNFA(nfa, input)
    setResult(sim)
    setTraceStep(sim.steps.length - 1)
    if (sim.steps.length > 0) {
      const last = sim.steps[sim.steps.length - 1]
      onActiveStates?.(last.activeStates || [])
    }
  }, [nfa, input, onActiveStates])

  const handleStepSelect = (idx) => {
    setTraceStep(idx)
    if (result?.steps?.[idx]) {
      onActiveStates?.(result.steps[idx].activeStates || [])
    }
  }

  if (!nfa) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <h3>String Tester</h3>
        <p>Generate an NFA first, then test input strings against it.</p>
      </div>
    )
  }

  return (
    <div className="tester-layout">
      <div className="tester-input-area">
        <div className="section-label">Test String</div>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="Enter string (empty = ε)"
          spellCheck={false}
        />
        <button className="btn btn-primary" onClick={run} style={{ width: '100%' }}>
          Run Simulation
        </button>

        {result && (
          <div className={`tester-result ${result.accepted ? 'accepted' : 'rejected'}`}>
            {result.accepted ? '✓ ACCEPTED' : '✕ REJECTED'}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          Tip: leave empty to test the empty string ε.
        </div>
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {result ? (
          <table className="trace-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Symbol</th>
                <th>Active States</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {result.steps.map((s, i) => (
                <tr
                  key={i}
                  className={i === traceStep ? 'active-row' : ''}
                  onClick={() => handleStepSelect(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{s.step}</td>
                  <td>{s.symbol}</td>
                  <td>{s.activeStates.length ? `{${s.activeStates.join(', ')}}` : '∅'}</td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11 }}>
                    {s.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <p>Run a simulation to see the execution trace (ε-closure and move steps).</p>
          </div>
        )}
      </div>
    </div>
  )
}
