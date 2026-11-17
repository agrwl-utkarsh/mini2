import { cn } from '../../utils/cn'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function Loader({ size = 'md', className, text }: LoaderProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-navy-600 border-t-cyan-500 animate-spin',
          sizes[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-sm text-navy-400">{text}</p>}
    </div>
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-1', className)} aria-label="Loading">
      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
      <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
    </div>
  )
}

export function LoadingSkeleton({ className, width, height }: { className?: string; width?: string; height?: string }) {
  return (
    <div
      className={cn('animate-pulse bg-navy-700 rounded', className)}
      style={{ width, height }}
    />
  )
}

export function PageLoader({ text = 'Analyzing repository...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-navy-700 border-t-cyan-500 rounded-full animate-spin" />
        <div className="absolute inset-0 border-4 border-navy-700 border-r-cyan-400 rounded-full animate-spin reverse" style={{ animationDuration: '2s' }} />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-navy-100">{text}</p>
        <LoadingDots className="mt-4 justify-center" />
      </div>
    </div>
  )
}