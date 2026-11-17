import { useRef, useState, type KeyboardEvent } from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from '../common'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = 'Ask about the repository...' }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const [height, setHeight] = useState(44)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    // Auto-resize
    textareaRef.current!.style.height = 'auto'
    const newHeight = Math.min(textareaRef.current!.scrollHeight, 200)
    setHeight(newHeight)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim())
      setValue('')
      setHeight(44)
      textareaRef.current!.style.height = 'auto'
    }
  }

  return (
    <div className="border-t border-navy-700 bg-navy-900/50 p-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-navy-100 placeholder-navy-500',
            'focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
            'pr-16'
          )}
          style={{ height: `${height}px`, minHeight: '44px', maxHeight: '200px' }}
          aria-label="Chat input"
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="p-1.5" aria-label="Attach file">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1.5" aria-label="Voice input">
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="p-1.5"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-navy-500 mt-2 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-navy-800 rounded text-navy-300 font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-navy-800 rounded text-navy-300 font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}