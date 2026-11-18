import { useState, useEffect } from 'react'
import ArchitectureFlow from './components/ArchitectureFlow'
import Chatbot from './components/Chatbot'
import CodeExplorer from './components/CodeExplorer'
import CodeExplanation from './components/CodeExplanation'
import SettingsModal from './components/SettingsModal'
import './App.css'

const TABS = [
  { id: 'explanation', label: '📖 Code Explanation', icon: '📖' },
  { id: 'architecture', label: '🏗 Architecture Flow', icon: '🏗' },
  { id: 'chatbot', label: '🤖 AI Chatbot Q&A', icon: '🤖' },
  { id: 'explorer', label: '📁 Code Explorer', icon: '📁' },
]

const EXAMPLE_REPOS = [
  { label: 'Next.js', url: 'https://github.com/vercel/next.js' },
  { label: 'React', url: 'https://github.com/facebook/react' },
  { label: 'Vite', url: 'https://github.com/vitejs/vite' },
  { label: 'Tailwind CSS', url: 'https://github.com/tailwindlabs/tailwindcss' },
  { label: 'Express', url: 'https://github.com/expressjs/express' },
]

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')
  
  // Analyzed repository data
  const [repoMeta, setRepoMeta] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [highlights, setHighlights] = useState([])
  const [techStack, setTechStack] = useState([])
  const [architecture, setArchitecture] = useState(null)
  const [fileTree, setFileTree] = useState([])

  // User Preferences & Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('repo_explainer_keys') || '{}')
    } catch {
      return {}
    }
  })
  const [recentRepos, setRecentRepos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('repo_explainer_recents') || '[]')
    } catch {
      return []
    }
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('repo_explainer_theme') || 'light'
  })

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('repo_explainer_theme', theme)
  }, [theme])

  // Sync API keys
  const handleSaveKeys = (keys) => {
    setApiKeys(keys)
    localStorage.setItem('repo_explainer_keys', JSON.stringify(keys))
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const hasConfiguredKeys = Object.values(apiKeys).some(k => Boolean(k?.trim()))

  const saveRecentRepo = (urlToSave, name) => {
    setRecentRepos(prev => {
      const filtered = prev.filter(r => r.url !== urlToSave)
      const updated = [{ url: urlToSave, name }, ...filtered].slice(0, 5)
      localStorage.setItem('repo_explainer_recents', JSON.stringify(updated))
      return updated
    })
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!url.trim() || loading) return

    setLoading(true)
    setError('')
    setExplanation(null)
    setArchitecture(null)
    setRepoMeta(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKeys?.gemini && { 'x-gemini-key': apiKeys.gemini }),
          ...(apiKeys?.grok && { 'x-grok-key': apiKeys.grok }),
          ...(apiKeys?.openrouter && { 'x-openrouter-key': apiKeys.openrouter }),
          ...(apiKeys?.deepseek && { 'x-deepseek-key': apiKeys.deepseek }),
          ...(apiKeys?.huggingface && { 'x-huggingface-key': apiKeys.huggingface }),
          ...(apiKeys?.github && { 'x-github-token': apiKeys.github }),
        },
        body: JSON.stringify({
          url: url.trim(),
          apiKeys,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setRepoMeta(data.meta)
      setExplanation(data.explanation)
      setHighlights(data.highlights || [])
      setTechStack(data.techStack || [])
      setArchitecture(data.architecture)
      setFileTree(data.fileTree || [])
      setActiveTab('explanation')

      saveRecentRepo(url.trim(), data.meta?.fullName || url.trim())
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing the repository.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExample = (exampleUrl) => {
    setUrl(exampleUrl)
  }

  const renderActiveTabContent = () => {
    if (!repoMeta && !explanation && !loading) {
      return (
        <div className="empty-state">
          <span className="empty-icon">🧠</span>
          <p>Enter any GitHub repository URL above and click <strong>"Explain This Repo"</strong> to generate an architectural breakdown, interactive flowchart, AI Q&A bot, and code explorer.</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'explanation':
        return (
          <CodeExplanation
            explanation={explanation}
            repoMeta={repoMeta}
            techStack={techStack}
            highlights={highlights}
          />
        )
      case 'architecture':
        return (
          <ArchitectureFlow
            architecture={architecture}
            repoMeta={repoMeta}
          />
        )
      case 'chatbot':
        return (
          <Chatbot
            repoMeta={repoMeta}
            techStack={techStack}
            explanation={explanation}
            architecture={architecture}
            apiKeys={apiKeys}
          />
        )
      case 'explorer':
        return (
          <CodeExplorer
            repoMeta={repoMeta}
            fileTree={fileTree}
            apiKeys={apiKeys}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app-layout">
      {/* Navigation Topbar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <span className="brand-logo">⚡</span>
            <span className="brand-title">GitHub Repo Explainer</span>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="btn-topbar"
              onClick={() => setIsSettingsOpen(true)}
              title="Configure API Keys"
            >
              ⚙️ API Keys
              {hasConfiguredKeys && <span className="active-dot" title="Custom keys active"></span>}
            </button>

            <button
              type="button"
              className="btn-topbar theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>

            <a
              href="https://github.com/agrwl-utkarsh/mini2"
              target="_blank"
              rel="noreferrer"
              className="btn-topbar github-link"
              title="View on GitHub"
            >
              ⭐ GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Hero Section */}
        <section className="hero">
          <h1>Understand Any GitHub Repository</h1>
          <p className="subtitle">
            Paste any GitHub repository URL. Get a senior engineer explanation, interactive architecture flowcharts, a context-aware AI chatbot, and a deep file tree code explorer.
          </p>
        </section>

        {/* Input Form */}
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
                <span>Analyzing Architecture...</span>
              </>
            ) : (
              'Explain This Repo 🚀'
            )}
          </button>
        </form>

        {/* Quick Example Repositories */}
        <div className="examples" aria-label="Example repositories">
          <span className="examples-label">Try an example:</span>
          {EXAMPLE_REPOS.map((ex) => (
            <button
              key={ex.url}
              type="button"
              className="example-btn"
              onClick={() => handleSelectExample(ex.url)}
              disabled={loading}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Recent Repositories */}
        {recentRepos.length > 0 && (
          <div className="recents-row">
            <span className="recents-label">Recent Searches:</span>
            {recentRepos.map((r) => (
              <button
                key={r.url}
                type="button"
                className="recent-chip"
                onClick={() => handleSelectExample(r.url)}
                disabled={loading}
              >
                🕒 {r.name}
              </button>
            ))}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="error" role="alert">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 6v6M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Main Content Area */}
        {(repoMeta || explanation || loading) && (
          <article className="result" tabIndex="-1">
            {/* Repository Info Header Card */}
            {repoMeta && (
              <header className="repo-info-banner">
                <div className="repo-identity">
                  {repoMeta.avatarUrl && (
                    <img src={repoMeta.avatarUrl} alt="" className="owner-avatar" />
                  )}
                  <div>
                    <h2 className="repo-name">
                      <a href={repoMeta.htmlUrl} target="_blank" rel="noreferrer">
                        {repoMeta.fullName}
                      </a>
                    </h2>
                    {repoMeta.description && (
                      <p className="repo-desc">{repoMeta.description}</p>
                    )}
                  </div>
                </div>

                <div className="repo-stats-pills">
                  <span className="stat-pill" title="GitHub Stars">⭐ {repoMeta.stars.toLocaleString()}</span>
                  <span className="stat-pill" title="GitHub Forks">🍴 {repoMeta.forks.toLocaleString()}</span>
                  <span className="stat-pill" title="Primary Language">🏷️ {repoMeta.language}</span>
                  <span className="stat-pill" title="License">⚖️ {repoMeta.license}</span>
                </div>
              </header>
            )}

            {/* Tab Navigation */}
            <div className="tab-bar" role="tablist" aria-label="Analysis tool views">
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

            {/* Tab Panel Content */}
            <div
              className="tab-panels"
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {renderActiveTabContent()}
            </div>
          </article>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onSave={handleSaveKeys}
      />
    </div>
  )
}

export default App
