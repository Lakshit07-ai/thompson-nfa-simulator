export default function RegexInput({ value, onChange, onSubmit, error }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div>
      <textarea
        className="textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. (a|b)*abb"
        rows={3}
        spellCheck={false}
        aria-label="Regular expression input"
      />
      {error ? (
        <div className="validation-badge invalid">
          <span>✕</span> {error}
        </div>
      ) : value.trim() ? (
        <div className="validation-badge valid" style={{ opacity: 0.7 }}>
          <span>✓</span> Ready — press Generate or Ctrl+Enter
        </div>
      ) : null}
    </div>
  )
}
