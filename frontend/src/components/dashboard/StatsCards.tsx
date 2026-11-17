import { FileText, FolderOpen, Code2, Zap, Globe, Layers } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { RepositoryStats } from '../../types'
import { getLanguageColor } from '../../types'
import { Card } from '../common'

interface StatsCardsProps {
  stats: RepositoryStats | undefined
  isLoading?: boolean
}

const statItems = [
  { key: 'files', label: 'Files', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { key: 'folders', label: 'Folders', icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'languages', label: 'Languages', icon: Code2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'linesOfCode', label: 'Lines of Code', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
] as const

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <Card key={item.key} className="animate-pulse">
            <div className="h-4 bg-navy-700 rounded w-1/2 mb-2" />
            <div className="h-8 bg-navy-700 rounded w-1/4" />
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <Card key={item.key}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.bg)}>
                <item.icon className={cn('w-5 h-5', item.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-100">—</p>
                <p className="text-sm text-navy-400">{item.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const languageCount = Object.keys(stats.languages).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-100">{stats.files.toLocaleString()}</p>
            <p className="text-sm text-navy-400">Files</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-100">{stats.folders.toLocaleString()}</p>
            <p className="text-sm text-navy-400">Folders</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-100">{languageCount}</p>
            <p className="text-sm text-navy-400">Languages</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-100">{stats.linesOfCode.toLocaleString()}</p>
            <p className="text-sm text-navy-400">Lines of Code</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function LanguageBreakdown({ stats }: { stats: RepositoryStats | undefined }) {
  if (!stats) return null

  const total = Object.values(stats.languages).reduce((a, b) => a + b, 0)
  const sortedLanguages = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  return (
    <Card>
      <div className="p-4 border-b border-navy-700">
        <h3 className="font-semibold text-navy-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Language Breakdown
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {sortedLanguages.map(([lang, count]) => {
          const percentage = ((count / total) * 100).toFixed(1)
          const color = getLanguageColor(lang)
          return (
            <div key={lang} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-navy-100">{lang}</span>
                </div>
                <span className="text-sm text-navy-400">{percentage}%</span>
              </div>
              <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
        {Object.keys(stats.languages).length > 8 && (
          <p className="text-xs text-navy-500 text-center mt-2">
            +{Object.keys(stats.languages).length - 8} more languages
          </p>
        )}
      </div>
    </Card>
  )
}

export function FrameworkBadges({ stats }: { stats: RepositoryStats | undefined }) {
  if (!stats?.frameworks?.length) return null

  return (
    <Card>
      <div className="p-4 border-b border-navy-700">
        <h3 className="font-semibold text-navy-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          Detected Frameworks
        </h3>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {stats.frameworks.map((fw) => (
          <span key={fw} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
            {fw}
          </span>
        ))}
      </div>
    </Card>
  )
}