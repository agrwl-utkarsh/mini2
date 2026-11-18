import { useState, useMemo } from 'react'

export default function CodeExplanation({ explanation, repoMeta, techStack = [], highlights = [] }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const markdownContent = `# ${repoMeta?.fullName || 'Repository'} - Architecture & Code Explanation\n\n${explanation}`
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repoMeta?.repo || 'repository'}-explanation.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Parse markdown-like blocks for clean presentation
  const renderedSections = useMemo(() => {
    if (!explanation) return null
    const blocks = explanation.split(/(```[\s\S]*?```)/g)

    return blocks.map((block, idx) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const lines = block.slice(3, -3).trim().split('\n')
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines.shift() : 'bash'
        const code = lines.join('\n')

        return (
          <div key={idx} className="explanation-code-block">
            <div className="code-lang-tag">{lang}</div>
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        )
      }

      // Process standard markdown headings and paragraphs
      return (
        <div key={idx} className="explanation-text-block">
          {block.split('\n\n').map((para, pIdx) => {
            const trimmed = para.trim()
            if (!trimmed) return null

            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={pIdx} className="section-title">
                  {trimmed.replace('### ', '')}
                </h3>
              )
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={pIdx} className="section-title main">
                  {trimmed.replace('## ', '')}
                </h2>
              )
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <ul key={pIdx} className="bullet-list">
                  {trimmed.split('\n').map((item, iIdx) => (
                    <li key={iIdx}>{item.replace(/^[-*]\s+/, '')}</li>
                  ))}
                </ul>
              )
            }

            return <p key={pIdx} className="prose-paragraph">{trimmed}</p>
          })}
        </div>
      )
    })
  }, [explanation])

  return (
    <div className="explanation-wrapper">
      {/* Executive Summary Card */}
      <section className="executive-card" aria-label="Executive Summary">
        <div className="executive-header">
          <h3>⚡ Executive Summary</h3>
          <div className="explanation-actions">
            <button type="button" className="btn-tool" onClick={handleCopy}>
              {copied ? '✓ Copied' : '📋 Copy Text'}
            </button>
            <button type="button" className="btn-tool" onClick={handleDownload}>
              📥 Download .md
            </button>
          </div>
        </div>

        {/* Tech Stack Badges */}
        {techStack.length > 0 && (
          <div className="tech-stack-row">
            <span className="row-label">Detected Stack:</span>
            <div className="tech-tags">
              {techStack.map((t, idx) => (
                <span key={idx} className="tech-pill">
                  {t.name}
                  {t.category && <small className="tech-cat">({t.category})</small>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Highlights */}
        {highlights.length > 0 && (
          <div className="highlights-box">
            <span className="row-label">Key Architectural Takeaways:</span>
            <ul className="highlight-bullets">
              {highlights.map((h, idx) => (
                <li key={idx}>
                  <span className="bullet-check">✓</span> {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Main Formatted Explanation */}
      <article className="explanation-body">
        {renderedSections}
      </article>
    </div>
  )
}
