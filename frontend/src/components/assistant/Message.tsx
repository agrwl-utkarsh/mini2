import { format } from 'date-fns'
import { Copy, Check, FileText, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import type { ChatMessage, FileReference } from '../../types'
import { Button } from '../common'

interface MessageProps {
  message: ChatMessage
  onFileClick?: (ref: FileReference) => void
}

export function Message({ message, onFileClick }: MessageProps) {
  const [copied, setCopied] = useState(false)
  const [showRefs, setShowRefs] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const time = format(new Date(message.timestamp), 'HH:mm')

  const isUser = message.role === 'user'
  const isLoading = message.isLoading

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
      )}

      <div className={cn(
        'chat-message max-w-[85%] relative',
        isUser ? 'chat-message-user' : 'chat-message-assistant'
      )}>
        <div className={cn('prose prose-invert prose-sm max-w-none', isLoading && 'opacity-70')}>
          <p className="whitespace-pre-wrap">{message.content || ' '}</p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-navy-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-500">{time}</span>
            {message.model && (
              <span className={cn(
                'px-1.5 py-0.5 text-[10px] rounded font-medium',
                message.model === 'gemini'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-amber-500/20 text-amber-400'
              )}>
                {message.model === 'gemini' ? 'Gemini' : 'Fallback'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy message">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {message.references && message.references.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowRefs(!showRefs)}
              className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-cyan-400 transition-colors"
              aria-expanded={showRefs}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{message.references.length} file reference{message.references.length !== 1 ? 's' : ''}</span>
              <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showRefs && 'rotate-90')} />
            </button>

            {showRefs && (
              <div className="mt-2 flex flex-wrap gap-2" role="list">
                {message.references.map((ref, i) => (
                  <button
                    key={i}
                    onClick={() => onFileClick?.(ref)}
                    className="file-ref-chip"
                    role="listitem"
                  >
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[200px] font-mono text-xs">{ref.path}</span>
                    {ref.lineStart && ref.lineEnd && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-navy-700 rounded">
                        L{ref.lineStart}-{ref.lineEnd}
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="absolute bottom-0 right-0 m-2 flex items-center gap-1 text-navy-500">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-medium text-navy-300">U</span>
        </div>
      )}
    </div>
  )
}

export function WelcomeMessage({ onExampleClick }: { onExampleClick: (question: string) => void }) {
  const examples = [
    'How does authentication work in this codebase?',
    'What are the main components and their responsibilities?',
    'Explain the data flow in this application',
    'Where are the API routes defined?',
    'What testing framework is used and how to run tests?',
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-cyan-400" />
      </div>
      <h3 className="text-xl font-semibold text-navy-100 mb-2">How can I help?</h3>
      <p className="text-navy-400 mb-6 max-w-md">
        Ask me anything about the repository. I can explain code, find files, trace logic, and more.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(ex)}
            className="text-left p-3 bg-navy-800/50 border border-navy-700 rounded-lg text-navy-300 hover:border-cyan-500 hover:text-navy-100 transition-colors text-sm"
          >
            {ex}
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-navy-500">
        <AlertCircle className="w-3 h-3 inline mr-1" />
        Currently using fallback mode. Configure Gemini API key for AI-powered responses.
      </p>
    </div>
  )
}