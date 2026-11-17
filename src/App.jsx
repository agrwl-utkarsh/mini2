import { useState } from 'react'
import './App.css'

const TABS = [
  { id: 'explanation', label: 'Code Explanation' },
  { id: 'architecture', label: 'Architecture Flow' },
  { id: 'chatbot', label: 'AI Chatbot Q&A' },
  { id: 'explorer', label: 'Code Explorer' },
]

const PLACEHOLDERS = {
  architecture: 'Architecture flow diagram will be generated here. This will show the high-level system architecture, data flow, and component interactions.',
  chatbot: 'AI Chatbot Q&A interface will appear here. You\'ll be able to ask questions about the repository and get contextual answers.',
  explorer: 'Code Explorer will appear here. Browse files, view code with syntax highlighting, and get AI explanations for specific functions or classes.',
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')

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
      setActiveTab('explanation')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (exampleUrl) => {
    setUrl(exampleUrl)
  }

  const renderTabContent = () => {
    if (activeTab === 'explanation') {
      return explanation ? (
        <div className="explanation">{explanation}</div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">🧠</span>
          <p>Enter a GitHub repository URL and click "Explain This Repository" to get an AI-powered breakdown.</p>
        </div>
      )
    }

    return (
      <div className="placeholder-content">
        <p>{PLACEHOLDERS[activeTab]}</p>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="hero">
        <h1>GitHub Repository Explainer</h1>
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
            placeholder="https://github.com/owner/repository"
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
            'Explain This Repository'
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

      {explanation || activeTab !== 'explanation' ? (
        <article className="result" tabIndex="-1">
          <header className="result-header">
            <h2>Repository Breakdown</h2>
            <div className="tab-bar" role="tablist" aria-label="Analysis views">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </header>
          <div className="tab-panels" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {renderTabContent()}
          </div>
        </article>
      ) : null}
    </div>
  )
}

export default App