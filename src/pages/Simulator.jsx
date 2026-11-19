import { useState, useCallback, useMemo } from 'react'
import { parseRegex, thompsonConstruct, simulateNFA, astToString } from '../algorithms/index.js'
import RegexInput from '../components/RegexInput.jsx'
import ASTViewer from '../components/ASTViewer.jsx'
import ConstructionTimeline from '../components/ConstructionTimeline.jsx'
import NFAGraph from '../components/NFAGraph.jsx'
import StringTester from '../components/StringTester.jsx'

const EXAMPLES = [
  'a',
  'ab',
  'a|b',
  'a*',
  '(a|b)*',
  'a(b|c)*',
  '(a|b)*abb',
  '(a|b)(c|d)',
  '(ab|ba)*',
  'a(b|c)*d',
]

export default function Simulator() {
  const [regex, setRegex] = useState('(a|b)*abb')
  const [validationError, setValidationError] = useState(null)
  const [ast, setAst] = useState(null)
  const [nfa, setNfa] = useState(null)
  const [history, setHistory] = useState([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [mainTab, setMainTab] = useState('graph') // graph | timeline | ast
  const [activeStates, setActiveStates] = useState([])

  const displayedNfa = useMemo(() => {
    if (currentStep >= 0 && history[currentStep]) {
      return history[currentStep].nfa
    }
    return nfa
  }, [currentStep, history, nfa])

  const handleGenerate = useCallback(() => {
    setActiveStates([])
    const result = parseRegex(regex)
    if (!result.ok) {
      setValidationError(result.error)
      setAst(null)
      setNfa(null)
      setHistory([])
      setCurrentStep(-1)
      return
    }
    setValidationError(null)
    setAst(result.ast)

    try {
      const { nfa: built, history: hist } = thompsonConstruct(result.ast)
      setNfa(built)
      setHistory(hist)
      setCurrentStep(hist.length - 1) // show final by default
      setMainTab('graph')
    } catch (err) {
      setValidationError(err.message || 'Construction failed.')
      setNfa(null)
      setHistory([])
      setCurrentStep(-1)
    }
  }, [regex])

  const handleExample = useCallback((ex) => {
    setRegex(ex)
    setValidationError(null)
    // Do not auto-generate; let user click Generate
  }, [])

  const handleStepChange = useCallback((idx) => {
    setCurrentStep(idx)
    setActiveStates([])
  }, [])

  return (
    <div className="app-body">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="section-label">Regular Expression</div>
          <RegexInput
            value={regex}
            onChange={setRegex}
            onSubmit={handleGenerate}
            error={validationError}
          />
          <button
            className="btn btn-primary w-full mt-2"
            onClick={handleGenerate}
            style={{ width: '100%' }}
          >
            Generate ε-NFA
          </button>
        </div>

        <div className="sidebar-section">
          <div className="section-label">Examples</div>
          <div className="example-list">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className={`example-item ${regex === ex ? 'active' : ''}`}
                onClick={() => handleExample(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {nfa && (
          <div className="sidebar-section">
            <div className="section-label">NFA Summary</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div>States: <span className="mono">{nfa.states.length}</span></div>
              <div>Alphabet: <span className="mono">{'{'}{nfa.alphabet.join(', ') || '—'}{'}'}</span></div>
              <div>Start: <span className="mono">{nfa.startState}</span></div>
              <div>Final: <span className="mono">{'{'}{nfa.finalStates.join(', ') || '∅'}{'}'}</span></div>
              <div>Transitions: <span className="mono">{nfa.transitions.length}</span></div>
              <div>Construction steps: <span className="mono">{history.length}</span></div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="main-workspace">
        <div className="tabs">
          <button className={`tab ${mainTab === 'graph' ? 'active' : ''}`} onClick={() => setMainTab('graph')}>
            NFA Graph
          </button>
          <button className={`tab ${mainTab === 'timeline' ? 'active' : ''}`} onClick={() => setMainTab('timeline')}>
            Construction Steps
          </button>
          <button className={`tab ${mainTab === 'ast' ? 'active' : ''}`} onClick={() => setMainTab('ast')}>
            AST
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {mainTab === 'graph' && (
            <div className="graph-container">
              {displayedNfa ? (
                <NFAGraph nfa={displayedNfa} activeStates={activeStates} />
              ) : (
                <div className="empty-state">
                  <h3>No NFA yet</h3>
                  <p>Enter a regular expression and click Generate ε-NFA to build the automaton with Thompson&apos;s Construction.</p>
                </div>
              )}
            </div>
          )}

          {mainTab === 'timeline' && (
            <ConstructionTimeline
              history={history}
              currentStep={currentStep}
              onStepChange={handleStepChange}
            />
          )}

          {mainTab === 'ast' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {ast ? (
                <ASTViewer ast={ast} />
              ) : (
                <div className="empty-state">
                  <h3>No AST</h3>
                  <p>Generate an NFA to inspect the abstract syntax tree of the regular expression.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM: String Tester */}
        <div className="bottom-panel">
          <StringTester
            nfa={nfa}
            onActiveStates={setActiveStates}
          />
        </div>
      </div>
    </div>
  )
}
