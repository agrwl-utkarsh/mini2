import { Database, Loader } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Repository } from '../../types'
import { StatsCards, LanguageBreakdown, FrameworkBadges } from './StatsCards'
import { Card } from '../common'

function getStatusColor(status: Repository['status']): string {
  switch (status) {
    case 'complete':
      return 'bg-green-500/20 text-green-400'
    case 'error':
      return 'bg-red-500/20 text-red-400'
    case 'cloning':
    case 'scanning':
    case 'analyzing':
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 animate-pulse'
    default:
      return 'bg-navy-500/20 text-navy-400'
  }
}

interface DashboardProps {
  repo: Repository | null
  isLoading?: boolean
}

export function Dashboard({ repo, isLoading }: DashboardProps) {
  if (!repo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card variant="glass" padding="lg" className="max-w-md w-full text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-navy-500" />
          <h3 className="text-lg font-semibold text-navy-100 mb-2">No Repository Loaded</h3>
          <p className="text-navy-400">Analyze a GitHub repository to see dashboard stats</p>
        </Card>
      </div>
    )
  }

  if (isLoading || repo.status !== 'complete') {
    return (
      <div className="space-y-4">
        <Loader className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-navy-700 rounded w-1/2 mb-2" />
              <div className="h-8 bg-navy-700 rounded w-1/4" />
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <div className="p-4 space-y-3">
            <div className="h-4 bg-navy-700 rounded w-1/4 mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-navy-700 rounded" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Repo Header */}
      <Card className="bg-gradient-to-br from-navy-900 to-navy-800 border-cyan-500/20">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Database className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-100">{repo.name}</h2>
                <p className="text-navy-400 mt-1">{repo.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                getStatusColor(repo.status)
              )}>
                {repo.status.charAt(0).toUpperCase() + repo.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <StatsCards stats={repo.stats} isLoading={isLoading} />

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LanguageBreakdown stats={repo.stats} />
        <FrameworkBadges stats={repo.stats} />
      </div>

      {/* Additional Info */}
      {repo.stats && (
        <Card>
          <div className="p-4 border-b border-navy-700">
            <h3 className="font-semibold text-navy-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Repository Info
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-navy-500">Total Size</p>
              <p className="text-navy-100 font-mono">{(repo.stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="text-navy-500">Files</p>
              <p className="text-navy-100 font-mono">{repo.stats.files.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-navy-500">Folders</p>
              <p className="text-navy-100 font-mono">{repo.stats.folders.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-navy-500">Languages</p>
              <p className="text-navy-100 font-mono">{Object.keys(repo.stats.languages).length}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}