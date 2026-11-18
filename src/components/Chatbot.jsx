import { useState, useRef, useEffect } from 'react'

const SUGGESTED_QUESTIONS = [
  '🚀 How do I run and test this locally?',
  '🏗 Explain the architecture flow and data lifecycle',
  '📦 What are the core dependencies and tech stack?',
  '🔍 What is the primary entry point file?',
  '💡 What real-world problem does this solve best?',
]

export default function Chatbot({ repoMeta, techStack, explanation, architecture, apiKeys }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI codebase assistant for **${repoMeta?.fullName || 'this repository'}**. 

I can explain any part of the project, walk you through local setup, analyze specific files, or clarify architectural decisions. 

Try asking one of the suggested questions below, or ask anything you'd like!`,
      provider: 'Assistant',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (queryText) => {
    const textToSend = (queryText || input).trim()
    if (!textToSend || loading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKeys?.gemini && { 'x-gemini-key': apiKeys.gemini }),
          ...(apiKeys?.grok && { 'x-grok-key': apiKeys.grok }),
          ...(apiKeys?.openrouter && { 'x-openrouter-key': apiKeys.openrouter }),
          ...(apiKeys?.deepseek && { 'x-deepseek-key': apiKeys.deepseek }),
          ...(apiKeys?.huggingface && { 'x-huggingface-key': apiKeys.huggingface }),
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          repoContext: {
            name: repoMeta?.fullName || 'repo',
            repo: repoMeta?.repo,
            description: repoMeta?.description,
            techStack,
            language: repoMeta?.language,
            htmlUrl: repoMeta?.htmlUrl,
            readmeSnippet: explanation?.slice(0, 3000) || '',
            highlights: repoMeta?.highlights || [],
          },
          apiKeys,
        }),
      })

      if (!res.ok) {
        throw new Error(`Chat error (${res.status})`)
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'No response generated.',
          provider: data.provider || 'AI Assistant',
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to get answer: ${err.message}. Please check your connection or API keys.`,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat cleared. Ask me anything about **${repoMeta?.fullName || 'this repository'}**!`,
      },
    ])
  }

  // Render markdown-like simple paragraphs and code blocks safely
  const renderMessageContent = (content, messageId) => {
    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n')
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines.shift() : 'code'
        const codeText = lines.join('\n')

        return (
          <div key={index} className="chat-code-wrapper">
            <div className="chat-code-header">
              <span className="code-lang">{language}</span>
              <button
                type="button"
                className="btn-copy-code"
                onClick={() => handleCopy(codeText, `${messageId}-${index}`)}
              >
                {copiedId === `${messageId}-${index}` ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <pre className="chat-code-block">
              <code>{codeText}</code>
            </pre>
          </div>
        )
      }

      // Format bold text and lists cleanly
      return (
        <div key={index} className="chat-prose">
          {part.split('\n\n').map((para, pIdx) => {
            if (!para.trim()) return null
            if (para.startsWith('### ')) {
              return <h4 key={pIdx} className="chat-heading">{para.replace('### ', '')}</h4>
            }
            if (para.startsWith('## ')) {
              return <h3 key={pIdx} className="chat-heading">{para.replace('## ', '')}</h3>
            }
            if (para.startsWith('- ') || para.startsWith('* ')) {
              return (
                <ul key={pIdx} className="chat-list">
                  {para.split('\n').map((item, iIdx) => (
                    <li key={iIdx}>{item.replace(/^[-*]\s+/, '')}</li>
                  ))}
                </ul>
              )
            }
            return <p key={pIdx}>{para}</p>
          })}
        </div>
      )
    })
  }

  return (
    <div className="chatbot-container">
      {/* Chat header bar */}
      <div className="chat-header">
        <div className="chat-meta">
          <span className="chat-avatar-bot">🤖</span>
          <div>
            <span className="chat-title">Repository Q&A Assistant</span>
            <span className="chat-sub">Context: {repoMeta?.fullName || 'Active Repository'}</span>
          </div>
        </div>
        <button type="button" className="btn-tool text-danger" onClick={handleClear} title="Clear Conversation">
          🗑 Clear Chat
        </button>
      </div>

      {/* Suggested prompts pills */}
      <div className="suggested-prompts" aria-label="Suggested questions">
        <span className="prompt-label">Quick Questions:</span>
        <div className="prompt-chips">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => handleSend(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`chat-message ${m.role} ${m.isError ? 'error-bubble' : ''}`}>
            <div className="message-avatar">
              {m.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {renderMessageContent(m.content, m.id)}
              {m.provider && (
                <span className="message-provider-tag">Generated by {m.provider}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="chat-input-form"
      >
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask anything about ${repoMeta?.repo || 'this repository'}... (Press Enter to send)`}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-chat-send"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? 'Thinking...' : 'Send ➤'}
        </button>
      </form>
    </div>
  )
}
