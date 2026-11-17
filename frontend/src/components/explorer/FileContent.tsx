import { useEffect, useRef, useState } from 'react'
import { Copy, X, Download, Info } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { FileContent } from '../../types'
import { getLanguageFromPath } from '../../types'

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  dockerfile: 'docker',
}

export function FileContent({ file, onClose, onExplain }: {
  file: FileContent | null
  onClose: () => void
  onExplain?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [wrapLines, setWrapLines] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (file) {
      highlightCode()
    }
  }, [file])

  const highlightCode = async () => {
    if (!preRef.current || !file) return

    try {
      const { codeToHtml } = await import('shiki')
      const language = LANGUAGE_ALIASES[file.language.toLowerCase()] || file.language.toLowerCase()

      const html = await codeToHtml(file.content, {
        lang: language,
        theme: 'github-dark',
        transformers: [
          {
            pre(node) {
              if (showLineNumbers) {
                node.properties['data-line-numbers'] = ''
              }
            },
          },
        ],
      })

      preRef.current.innerHTML = html
    } catch (error) {
      console.error('Syntax highlighting failed:', error)
      preRef.current.textContent = file.content
    }
  }

  const handleCopy = async () => {
    if (!file) return
    await navigator.clipboard.writeText(file.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!file) return
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.path.split('/').pop() || 'file'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center panel">
        <div className="text-center text-navy-500">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No file selected</p>
          <p className="text-sm mt-1">Select a file from the explorer to view its contents</p>
        </div>
      </div>
    )
  }

  const language = getLanguageFromPath(file.path)

  return (
    <div className="flex-1 flex flex-col panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-navy-700 bg-navy-900/50 flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={onClose} className="p-1.5 hover:bg-navy-800 rounded-lg text-navy-400 hover:text-navy-100 transition-colors" aria-label="Close file">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-navy-100 truncate">{file.path.split('/').pop()}</span>
            <span className="px-2 py-0.5 text-xs rounded bg-navy-800 text-navy-400 border border-navy-700 font-mono">
              {language}
            </span>
          </div>
          <span className="text-xs text-navy-500 hidden sm:inline-flex items-center gap-1">
            {file.lines} lines · {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn('p-1.5 rounded-lg text-navy-400 hover:text-navy-100 transition-colors', showLineNumbers && 'bg-navy-800')}
            aria-label={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
            aria-pressed={showLineNumbers}
          >
            <span className="text-xs font-mono">#{showLineNumbers ? 'on' : 'off'}</span>
          </button>
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={cn('p-1.5 rounded-lg text-navy-400 hover:text-navy-100 transition-colors', wrapLines && 'bg-navy-800')}
            aria-label={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
            aria-pressed={wrapLines}
          >
            <span className="text-xs">↴ {wrapLines ? 'on' : 'off'}</span>
          </button>
          <button onClick={handleCopy} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-100 transition-colors" aria-label="Copy to clipboard">
            {copied ? <span className="text-xs text-green-400">Copied!</span> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-100 transition-colors" aria-label="Download file">
            <Download className="w-4 h-4" />
          </button>
          {onExplain && (
            <button onClick={onExplain} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Explain
            </button>
          )}
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto" style={{ fontFamily: 'var(--font-mono), monospace' }}>
        <pre
          ref={preRef}
          className={cn('m-0 p-4', wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre')}
          style={{
            fontSize: '13px',
            lineHeight: '1.6',
            tabSize: 2,
            counterReset: 'line',
          }}
        />
      </div>
    </div>
  )
}