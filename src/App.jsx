import { useState } from 'react'
import Header from './components/Header.jsx'
import Simulator from './pages/Simulator.jsx'
import Documentation from './pages/Documentation.jsx'
import About from './pages/About.jsx'

export default function App() {
  const [page, setPage] = useState('simulator')

  return (
    <div className="app-shell">
      <Header page={page} onNavigate={setPage} />
      {page === 'simulator' && <Simulator />}
      {page === 'docs' && <Documentation />}
      {page === 'about' && <About />}
    </div>
  )
}
