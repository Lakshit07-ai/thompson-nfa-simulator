export default function Header({ page, onNavigate }) {
  return (
    <header className="app-header">
      <a className="logo" href="#" onClick={(e) => { e.preventDefault(); onNavigate('simulator') }}>
        <span className="logo-mark">A</span>
        thompson-nfa-simulator
      </a>
      <nav className="nav-links">
        <button
          className={`nav-link ${page === 'simulator' ? 'active' : ''}`}
          onClick={() => onNavigate('simulator')}
        >
          Simulator
        </button>
        <button
          className={`nav-link ${page === 'docs' ? 'active' : ''}`}
          onClick={() => onNavigate('docs')}
        >
          Documentation
        </button>
        <button
          className={`nav-link ${page === 'about' ? 'active' : ''}`}
          onClick={() => onNavigate('about')}
        >
          About
        </button>
      </nav>
    </header>
  )
}
