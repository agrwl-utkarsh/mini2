import { useState, useCallback, useMemo } from 'react'
import { Search, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Input } from '../common'
import { TreeNode } from './TreeNode'
import type { FileTreeNode } from '../../types'

interface FileTreeProps {
  tree: FileTreeNode | null
  selectedPath: string
  onSelect: (path: string) => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function FileTree({ tree, selectedPath, onSelect, onRefresh, isLoading }: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [filterMode, setFilterMode] = useState<'all' | 'files' | 'folders'>('all')

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const paths = new Set<string>()
    const collectPaths = (node: FileTreeNode) => {
      if (node.type === 'folder') {
        paths.add(node.path)
        node.children?.forEach(collectPaths)
      }
    }
    if (tree) collectPaths(tree)
    setExpandedPaths(paths)
  }, [tree])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  const filteredTree = useMemo(() => {
    if (!tree || !searchQuery.trim()) return tree

    const query = searchQuery.toLowerCase()

    const filterNode = (node: FileTreeNode): FileTreeNode | null => {
      const matches = node.name.toLowerCase().includes(query)
      const typeMatch = filterMode === 'all' ||
        (filterMode === 'files' && node.type === 'file') ||
        (filterMode === 'folders' && node.type === 'folder')

      if (node.type === 'file') {
        return matches && typeMatch ? node : null
      }

      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((n): n is FileTreeNode => n !== null)

      const hasMatchingChildren = filteredChildren && filteredChildren.length > 0

      if (matches && typeMatch) {
        return { ...node, children: filteredChildren, expanded: true }
      }

      if (hasMatchingChildren) {
        return { ...node, children: filteredChildren, expanded: true }
      }

      return null
    }

    return filterNode(tree)
  }, [tree, searchQuery, filterMode])

  const getStats = (node: FileTreeNode) => {
    let files = 0
    let folders = 0
    const count = (n: FileTreeNode) => {
      if (n.type === 'file') files++
      else {
        folders++
        n.children?.forEach(count)
      }
    }
    count(node)
    return { files, folders }
  }

  if (!tree) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-navy-700">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex-1 flex items-center justify-center text-navy-500">
          No repository loaded
        </div>
      </div>
    )
  }

  const stats = getStats(tree)

  return (
    <div className="flex flex-col h-full panel">
      {/* Toolbar */}
      <div className="p-3 border-b border-navy-700 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-900 border border-navy-600 rounded-lg text-navy-100 placeholder-navy-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            disabled={isLoading}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as typeof filterMode)}
            className="flex-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-navy-100 text-sm focus:outline-none focus:border-cyan-500"
            aria-label="Filter by type"
          >
            <option value="all">All</option>
            <option value="files">Files only</option>
            <option value="folders">Folders only</option>
          </select>

          <button
            onClick={expandAll}
            className="p-2 hover:bg-navy-800 rounded-lg text-navy-400 hover:text-navy-100 transition-colors"
            aria-label="Expand all"
            title="Expand all"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={collapseAll}
            className="p-2 hover:bg-navy-800 rounded-lg text-navy-400 hover:text-navy-100 transition-colors"
            aria-label="Collapse all"
            title="Collapse all"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-navy-800 rounded-lg text-navy-400 hover:text-navy-100 transition-colors disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto" role="tree" aria-label="Repository files">
        <div className="p-3">
          <TreeNode
            node={filteredTree!}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onToggle={togglePath}
            expandedPaths={expandedPaths}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-navy-700 bg-navy-900/50">
        <div className="flex items-center justify-between text-xs text-navy-500">
          <span>{stats.files} files, {stats.folders} folders</span>
          {searchQuery && (
            <span className="text-cyan-400">Filtered</span>
          )}
        </div>
      </div>
    </div>
  )
}