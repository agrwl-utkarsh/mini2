import { useRef, useEffect, useCallback } from 'react'
import { Sparkles, Trash2, Settings } from 'lucide-react'
import { Button } from '../common'
import { Message, WelcomeMessage } from './Message'
import { ChatInput } from './ChatInput'
import { useChat } from '../../hooks/useRepo'
import { useRepo } from '../../context/RepoContext'
import type { FileReference } from '../../types'

export function ChatPanel() {
  const { repo, chatMessages, clearChat, setActivePanel } = useRepo()
  const { mutate: sendMessage, isPending } = useChat(repo?.id || null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, scrollToBottom])

  const handleSend = (question: string) => {
    sendMessage({ question })
  }

  const handleFileClick = (ref: FileReference) => {
    // Navigate to file in explorer
    setActivePanel('explorer')
    // The file selection would be handled by the parent component
    // For now, we'll just log it
    console.log('Navigate to file:', ref.path)
  }

  const handleExampleClick = (question: string) => {
    handleSend(question)
  }

  const handleClear = () => {
    clearChat()
  }

  return (
    <div className="flex flex-col h-full panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-navy-700 bg-navy-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-100">Assistant</h3>
            <p className="text-xs text-navy-500">
              {repo ? `Analyzing ${repo.name}` : 'No repository loaded'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={chatMessages.length === 0} aria-label="Clear chat">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {chatMessages.length === 0 ? (
          <WelcomeMessage onExampleClick={handleExampleClick} />
        ) : (
          <>
            {chatMessages.map((message) => (
              <Message
                key={message.id}
                message={message}
                onFileClick={handleFileClick}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isPending || !repo} />
    </div>
  )
}