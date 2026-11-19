export default function ConstructionTimeline({ history, currentStep, onStepChange }) {
  if (!history || history.length === 0) {
    return (
      <div className="empty-state">
        <h3>No construction history</h3>
        <p>Generate an NFA to see Thompson&apos;s Construction applied step by step.</p>
      </div>
    )
  }

  const goPrev = () => {
    if (currentStep > 0) onStepChange(currentStep - 1)
  }
  const goNext = () => {
    if (currentStep < history.length - 1) onStepChange(currentStep + 1)
  }
  const goFinal = () => onStepChange(history.length - 1)
  const goFirst = () => onStepChange(0)

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button className="btn btn-outline btn-sm" onClick={goFirst} disabled={currentStep <= 0}>
          ⏮ First
        </button>
        <button className="btn btn-outline btn-sm" onClick={goPrev} disabled={currentStep <= 0}>
          ◀ Prev
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 70, textAlign: 'center' }}>
          {currentStep + 1} / {history.length}
        </span>
        <button className="btn btn-outline btn-sm" onClick={goNext} disabled={currentStep >= history.length - 1}>
          Next ▶
        </button>
        <button className="btn btn-outline btn-sm" onClick={goFinal} disabled={currentStep >= history.length - 1}>
          Final ⏭
        </button>
      </div>

      <div className="timeline-steps">
        {history.map((step, idx) => (
          <div
            key={idx}
            className={`step-card ${idx === currentStep ? 'active' : ''}`}
            onClick={() => onStepChange(idx)}
          >
            <div className="step-num">Step {step.stepNumber}</div>
            <div className="step-op">{step.operation}</div>
            <div className="step-expr">{step.subExpression}</div>
            <div className="step-desc">{step.description}</div>
            {(step.newlyCreatedStates?.length > 0 || step.newlyCreatedTransitions?.length > 0) && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                {step.newlyCreatedStates?.length > 0 && (
                  <span>New states: {step.newlyCreatedStates.join(', ')} </span>
                )}
                {step.newlyCreatedTransitions?.length > 0 && (
                  <span>· New transitions: {step.newlyCreatedTransitions.length}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
