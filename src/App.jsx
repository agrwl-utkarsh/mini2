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

  return (
    <div className="container">
      <header>
        <h1>README Explainer</h1>
        <p className="subtitle">Paste a GitHub repository URL to get a beginner-friendly explanation of its README</p>
      </header>

      <form onSubmit={handleSubmit} className="analyze-form">
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

      {explanation && (
        <div className="result">
          <h2>Explanation</h2>
          <div className="explanation">{explanation}</div>
        </div>
      )}
    </div>
  )
}

export default App