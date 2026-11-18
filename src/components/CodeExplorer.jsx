import { useState, useEffect, useMemo } from 'react'

function getFileBadge(filename, type) {
  if (type === 'directory') return 'DIR'
  const ext = filename.split('.').pop()?.toUpperCase() || 'FILE'
  return ext.slice(0, 4)
}

export default function CodeExplorer({ repoMeta, fileTree = [], apiKeys }) {
  const [selectedPath, setSelectedPath] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const [filterQuery, setFilterQuery] = useState('')
  const [fileExplanation, setFileExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [copied, setCopied] = useState(false)

  const filteredTree = useMemo(() => {
    if (!filterQuery.trim()) return fileTree
    const q = filterQuery.toLowerCase()
    return fileTree.filter(item => item.path.toLowerCase().includes(q))
  }, [fileTree, filterQuery])

  useEffect(() => {
    if (!selectedPath && fileTree.length > 0) {
      const firstFile = fileTree.find(f => f.type === 'file') || fileTree[0]
      if (firstFile) handleFileSelect(firstFile.path)
    }
  }, [fileTree])

  const handleFileSelect = async (path) => {
    setSelectedPath(path)
    setFileLoading(true)
    setFileError('')
    setFileExplanation('')

    try {
      const params = new URLSearchParams({
        owner: repoMeta?.owner || '',
        repo: repoMeta?.repo || '',
        path,
        branch: repoMeta?.defaultBranch || 'main',
      })

      const res = await fetch(`/api/file?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Failed to load file (HTTP ${res.status})`)
      }

      const data = await res.json()
      setFileContent(data.content || '')
    } catch (err) {
      setFileError(err.message || 'Failed to load file contents')
      setFileContent('')
    } finally {
      setFileLoading(false)
    }
  }

  const handleExplainFile = async () => {
    if (!selectedPath || explaining) return
    setExplaining(true)

    try {
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain',
          owner: repoMeta?.owner,
          repo: repoMeta?.repo,
          path: selectedPath,
          content: fileContent,
          apiKeys,
        }),
      })

      if (!res.ok) throw new Error('Explanation request failed')
      const data = await res.json()
      setFileExplanation(data.explanation || 'No explanation returned.')
    } catch (err) {
      setFileExplanation(`Unable to explain file: ${err.message}`)
    } finally {
      setExplaining(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lineCount = useMemo(() => {
    return fileContent ? fileContent.split('\n').length : 0
  }, [fileContent])

  return (
    <div className="explorer-container">
      {/* Sidebar: File Tree */}
      <aside className="explorer-sidebar">
        <div className="tree-header">
          <span className="tree-title">Files</span>
          <span className="file-count-badge">{fileTree.length}</span>
        </div>

        <div className="tree-search">
          <input
            type="search"
            placeholder="Filter files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        <div className="tree-list" role="tree">
          {filteredTree.map((item) => (
            <button
              key={item.path}
              type="button"
              role="treeitem"
              aria-selected={selectedPath === item.path}
              className={`tree-item ${item.type} ${selectedPath === item.path ? 'active' : ''}`}
              onClick={() => item.type === 'file' && handleFileSelect(item.path)}
              disabled={item.type === 'directory'}
            >
              <span className="file-type-badge">
                {getFileBadge(item.path, item.type)}
              </span>
              <span className="tree-name" title={item.path}>
                {item.path}
              </span>
            </button>
          ))}

          {filteredTree.length === 0 && (
            <div className="empty-tree-state">
              No files found
            </div>
          )}
        </div>
      </aside>

      {/* Main View: Code */}
      <main className="explorer-main">
        {selectedPath ? (
          <>
            <header className="file-toolbar">
              <div className="file-breadcrumbs">
                <span className="repo-crumb">{repoMeta?.repo || 'repo'}</span>
                <span className="crumb-separator">/</span>
                <span className="active-file">{selectedPath}</span>
                {lineCount > 0 && <span className="line-count-tag">{lineCount} lines</span>}
              </div>

              <div className="file-actions">
                <button
                  type="button"
                  className="btn-tool"
                  onClick={handleCopyCode}
                  disabled={fileLoading || !fileContent}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>

                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={handleExplainFile}
                  disabled={fileLoading || explaining || !fileContent}
                >
                  {explaining ? 'Explaining...' : 'Explain File'}
                </button>

                <a
                  href={`${repoMeta?.htmlUrl || `https://github.com/${repoMeta?.owner}/${repoMeta?.repo}`}/blob/${repoMeta?.defaultBranch || 'main'}/${selectedPath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-tool"
                >
                  View on GitHub
                </a>
              </div>
            </header>

            {fileExplanation && (
              <div className="file-ai-explanation">
                <div className="ai-explanation-header">
                  <span>File Explanation: <code>{selectedPath.split('/').pop()}</code></span>
                  <button type="button" className="close-btn" onClick={() => setFileExplanation('')}>✕</button>
                </div>
                <div className="ai-explanation-content">
                  {fileExplanation.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="code-content-wrapper">
              {fileLoading ? (
                <div className="loading-state">
                  <span className="spinner" aria-hidden="true"></span>
                  <p>Loading file...</p>
                </div>
              ) : fileError ? (
                <div className="error-state">
                  <p>{fileError}</p>
                </div>
              ) : (
                <div className="code-editor-view">
                  <div className="line-numbers" aria-hidden="true">
                    {fileContent.split('\n').map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  <pre className="code-display">
                    <code>{fileContent}</code>
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a file from the list to view its code and explanation.</p>
          </div>
        )}
      </main>
    </div>
  )
}
