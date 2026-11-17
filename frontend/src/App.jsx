import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>RepoSense</h1>
        <p className="subtitle">Paste a GitHub repository URL to get a plain-English explanation of its README</p>
      </header>

      <form onSubmit={handleAnalyze} className="analyze-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading || !url.trim()}>
          {loading ? 'Analyzing...' : 'Explain README'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h2>Explanation</h2>
          <div className="explanation">{result.explanation}</div>
          
          <details className="readme-toggle">
            <summary>Show raw README</summary>
            <pre className="readme-content">{result.readme}</pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default App