import { cn } from '../../utils/cn'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { Button } from './Button'

interface ErrorMessageProps {
  message: string
  title?: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorMessage({ message, title = 'Error', onRetry, onDismiss, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl',
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5 text-red-400">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-red-300">{title}</h4>
        <p className="mt-1 text-sm text-navy-300">{message}</p>
        <div className="mt-3 flex items-center gap-2">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="w-3.5 h-3.5" />
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm', className)} role="alert">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="w-16 h-16 rounded-full bg-navy-800 flex items-center justify-center text-navy-500 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-medium text-navy-100">{title}</h3>
      <p className="mt-2 text-navy-400 max-w-md">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}