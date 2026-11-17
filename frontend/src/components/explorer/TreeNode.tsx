import { useState, useRef, useEffect } from 'react'
import { File, Folder, FolderOpen } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { FileTreeNode } from '../../types'
import { getLanguageColor } from '../../types'

interface TreeNodeProps {
  node: FileTreeNode
  depth: number
  selectedPath: string
  onSelect: (path: string) => void
  onToggle: (path: string) => void
  expandedPaths: Set<string>
}

export function TreeNode({ node, depth, selectedPath, onSelect, onToggle, expandedPaths }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(expandedPaths.has(node.path) || node.expanded)
  const childrenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsExpanded(expandedPaths.has(node.path) || node.expanded || false)
  }, [expandedPaths, node.path, node.expanded])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle(node.path)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type === 'file') {
      onSelect(node.path)
    } else {
      handleToggle(e)
    }
  }

  const isSelected = selectedPath === node.path
  const iconColor = node.language ? getLanguageColor(node.language) : undefined

  if (node.type === 'file') {
    return (
      <div
        className={cn(
          'tree-node',
          isSelected && 'tree-node-active',
          `pl-${4 + depth * 4}`
        )}
        onClick={handleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-level={depth + 1}
      >
        <File
          className="w-4 h-4 flex-shrink-0"
          style={iconColor ? { color: iconColor } : undefined}
          aria-hidden="true"
        />
        <span className="truncate block">{node.name}</span>
        {node.size && (
          <span className="text-xs text-navy-500 ml-auto flex-shrink-0">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`pl-${4 + depth * 4}`}>
      <div
        className={cn(
          'tree-node',
          isSelected && 'tree-node-active'
        )}
        onClick={handleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isExpanded}
        aria-level={depth + 1}
      >
        <button
          onClick={handleToggle}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-navy-700 transition-colors flex-shrink-0"
          aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
        >
          {isExpanded ? (
            <FolderOpen className="w-4 h-4" style={iconColor ? { color: iconColor } : undefined} />
          ) : (
            <Folder className="w-4 h-4" style={iconColor ? { color: iconColor } : undefined} />
          )}
        </button>
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0" style={iconColor ? { color: iconColor } : undefined} aria-hidden="true" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0" style={iconColor ? { color: iconColor } : undefined} aria-hidden="true" />
        )}
        <span className="truncate block font-medium">{node.name}</span>
        {node.children && node.children.length > 0 && (
          <span className="text-xs text-navy-500 ml-auto flex-shrink-0">
            {node.children.length} items
          </span>
        )}
      </div>
      {isExpanded && node.children && (
        <div
          ref={childrenRef}
          role="group"
          aria-label={`${node.name} contents`}
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onToggle={onToggle}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      )}
    </div>
  )
}