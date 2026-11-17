import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setExplanation(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setExplanation(data.explanation)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (exampleUrl) => {
    setUrl(exampleUrl)
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>GitHub Repo Explainer</h1>
        <p className="subtitle">Paste any GitHub repository URL. Get a clear, beginner-friendly breakdown of what the project does, how it works, and how to use it — explained in plain English.</p>
      </header>

      <form onSubmit={handleSubmit} className="analyze-form" noValidate>
        <div className="input-wrapper">
          <label htmlFor="repo-url" className="visually-hidden">GitHub Repository URL</label>
          <input
            id="repo-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
            disabled={loading}
            autoComplete="off"
            autoFocus
          />
          {url && !loading && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setUrl('')}
              aria-label="Clear URL"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="submit-btn" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              <span>Analyzing Repository...</span>
            </>
          ) : (
            'Explain This Repo'
          )}
        </button>
      </form>

      <div className="examples" aria-label="Example repositories">
        <span className="examples-label">Try an example:</span>
        <button type="button" className="example-btn" onClick={() => handleExampleClick('https://github.com/vercel/next.js')}>Next.js</button>
        <button type="button" className="example-btn" onClick={() => handleExampleClick('https://github.com/facebook/react')}>React</button>
        <button type="button" className="example-btn" onClick={() => handleExampleClick('https://github.com/vitejs/vite')}>Vite</button>
        <button type="button" className="example-btn" onClick={() => handleExampleClick('https://github.com/tailwindlabs/tailwindcss')}>Tailwind CSS</button>
      </div>

      {error && (
        <div className="error" role="alert">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M10 6v6M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>{error}</span>
        </div>
      )}

      {explanation && (
        <article className="result" tabIndex="-1">
          <header className="result-header">
            <h2>Repository Breakdown</h2>
          </header>
          <div className="explanation">{explanation}</div>
        </article>
      )}

      <section className="future-features" aria-label="Planned features">
        <h3 className="future-title">Planned Features</h3>
        <div className="future-grid">
          <button type="button" className="future-btn" disabled>
            <span className="future-icon">📊</span>
            <span className="future-label">Architecture Flow Diagram</span>
            <span className="future-badge">Planned</span>
          </button>
          <button type="button" className="future-btn" disabled>
            <span className="future-icon">💬</span>
            <span className="future-label">AI Chatbot Q&A</span>
            <span className="future-badge">Planned</span>
          </button>
          <button type="button" className="future-btn" disabled>
            <span className="future-icon">🔍</span>
            <span className="future-label">Code Explorer</span>
            <span className="future-badge">Planned</span>
          </button>
          <button type="button" className="future-btn" disabled>
            <span className="future-icon">📁</span>
            <span className="future-label">File Tree Visualization</span>
            <span className="future-badge">Planned</span>
          </button>
          <button type="button" className="future-btn" disabled>
            <span className="future-icon">⚡</span>
            <span className="future-label">Dependency Graph</span>
            <span className="future-badge">Planned</span>
          </button>
          <button type="button" className="future-btn" disabled>
            <span className="future-icon">🧪</span>
            <span className="future-label">Test Coverage Insights</span>
            <span className="future-badge">Planned</span>
          </button>
        </div>
        <p className="future-note">These features are in our roadmap for future development.</p>
      </section>
    </div>
  )
}

export default App