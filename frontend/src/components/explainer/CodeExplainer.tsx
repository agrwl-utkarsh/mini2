import { useState } from 'react'
import { FileText, Box, Square, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { CodeExplanation, FunctionInfo, ClassInfo, ImportInfo } from '../../types'
import { Card, Button } from '../common'

interface CodeExplainerProps {
  explanation: CodeExplanation | null
  isLoading?: boolean
  onRefresh?: () => void
}

function FunctionCard({ func }: { func: FunctionInfo }) {
  return (
    <div className="p-4 bg-navy-800/50 rounded-lg border border-navy-700">
      <div className="flex items-start gap-3">
        <Box className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-cyan-300 text-sm">{func.name}</code>
            {func.isAsync && <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">async</span>}
            {func.isExport && <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">export</span>}
            <span className="text-xs text-navy-500">L{func.lineStart}-{func.lineEnd}</span>
          </div>
          {func.params.length > 0 && (
            <p className="mt-1 text-sm text-navy-300 font-mono">
              ({func.params.join(', ')}){func.returnType ? ` => ${func.returnType}` : ''}
            </p>
          )}
          {func.docstring && (
            <p className="mt-2 text-sm text-navy-400 italic">{func.docstring}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ClassCard({ cls }: { cls: ClassInfo }) {
  return (
    <div className="p-4 bg-navy-800/50 rounded-lg border border-navy-700">
      <div className="flex items-start gap-3">
        <Square className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-blue-300 text-sm">{cls.name}</code>
            {cls.isExport && <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">export</span>}
            <span className="text-xs text-navy-500">L{cls.lineStart}-{cls.lineEnd}</span>
          </div>
          {cls.extends && (
            <p className="mt-1 text-sm text-navy-300">extends <code className="font-mono">{cls.extends}</code></p>
          )}
          {cls.implements && cls.implements.length > 0 && (
            <p className="mt-1 text-sm text-navy-300">implements <code className="font-mono">{cls.implements.join(', ')}</code></p>
          )}
          {cls.docstring && (
            <p className="mt-2 text-sm text-navy-400 italic">{cls.docstring}</p>
          )}
          {(cls.methods.length > 0 || cls.properties.length > 0) && (
            <div className="mt-3 space-y-1">
              {cls.properties.slice(0, 5).map((prop) => (
                <div key={prop.name} className="text-xs text-navy-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-navy-500" />
                  <code className="font-mono">{prop.name}</code>{prop.type && <span>: {prop.type}</span>}
                  {prop.isStatic && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded">static</span>}
                  {prop.isReadonly && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">readonly</span>}
                </div>
              ))}
              {cls.methods.slice(0, 5).map((method) => (
                <div key={method.name} className="text-xs text-navy-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <code className="font-mono">{method.name}</code>
                  {method.isAsync && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">async</span>}
                </div>
              ))}
              {(cls.properties.length > 5 || cls.methods.length > 5) && (
                <p className="text-xs text-navy-500">... and {cls.properties.length + cls.methods.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ImportCard({ imp }: { imp: ImportInfo }) {
  return (
    <div className="p-3 bg-navy-800/50 rounded-lg border border-navy-700">
      <div className="flex items-center gap-2 flex-wrap">
        <FileText className="w-4 h-4 text-navy-400" />
        <code className="font-mono text-navy-300 text-sm">{imp.source}</code>
        <span className="text-xs text-navy-500">L{imp.line}</span>
        {imp.isDefault && <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 rounded">default</span>}
        {imp.isNamespace && <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">namespace</span>}
      </div>
      {imp.specifiers.length > 0 && (
        <p className="mt-1 text-xs text-navy-400 font-mono">{imp.specifiers.join(', ')}</p>
      )}
    </div>
  )
}

export function CodeExplainer({ explanation, isLoading, onRefresh }: CodeExplainerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'functions' | 'classes' | 'imports'>('summary')

  if (!explanation && !isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <div className="p-6 text-center text-navy-500">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No explanation available</p>
          <p className="text-sm mt-1">Select a file and click "Explain" to get an AI-powered explanation</p>
          {onRefresh && (
            <Button variant="primary" className="mt-4" onClick={onRefresh}>
              <Sparkles className="w-4 h-4" />
              Generate Explanation
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (isLoading && !explanation) {
    return (
      <Card className="h-full">
        <div className="p-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-navy-700 rounded w-3/4" />
            <div className="h-4 bg-navy-700 rounded w-1/2" />
            <div className="h-4 bg-navy-700 rounded w-5/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-navy-700 rounded" />
            <div className="h-24 bg-navy-700 rounded" />
          </div>
        </div>
      </Card>
    )
  }

  const exp = explanation!

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-navy-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Code Explanation
          </h3>
          <p className="text-sm text-navy-400 mt-1">{exp.filePath}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-1 text-xs rounded-full font-medium',
            exp.complexity === 'low' && 'bg-green-500/20 text-green-400',
            exp.complexity === 'medium' && 'bg-amber-500/20 text-amber-400',
            exp.complexity === 'high' && 'bg-red-500/20 text-red-400'
          )}>
            {exp.complexity} complexity
          </span>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <Sparkles className="w-4 h-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-700 px-4">
        <nav className="flex gap-1 pb-px" role="tablist" aria-label="Explanation sections">
          {[
            { id: 'summary', label: 'Summary', count: null },
            { id: 'functions', label: 'Functions', count: exp.functions.length },
            { id: 'classes', label: 'Classes', count: exp.classes.length },
            { id: 'imports', label: 'Imports', count: exp.imports.length },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-t-lg transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                activeTab === tab.id
                  ? 'bg-navy-800 text-navy-100 border-b-2 border-cyan-500'
                  : 'text-navy-400 hover:text-navy-200 hover:bg-navy-800/50'
              )}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-navy-700 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Summary */}
        <div role="tabpanel" id="panel-summary" aria-labelledby="tab-summary" hidden={activeTab !== 'summary'}>
          <div className="prose prose-invert max-w-none">
            <p className="text-navy-300 whitespace-pre-wrap">{exp.summary}</p>
          </div>
        </div>

        {/* Functions */}
        <div role="tabpanel" id="panel-functions" aria-labelledby="tab-functions" hidden={activeTab !== 'functions'}>
          {exp.functions.length === 0 ? (
            <div className="text-center py-12 text-navy-500">
              <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No functions detected in this file</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exp.functions.map((func) => (
                <FunctionCard key={`${func.name}-${func.lineStart}`} func={func} />
              ))}
            </div>
          )}
        </div>

        {/* Classes */}
        <div role="tabpanel" id="panel-classes" aria-labelledby="tab-classes" hidden={activeTab !== 'classes'}>
          {exp.classes.length === 0 ? (
            <div className="text-center py-12 text-navy-500">
              <Square className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No classes detected in this file</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exp.classes.map((cls) => (
                <ClassCard key={`${cls.name}-${cls.lineStart}`} cls={cls} />
              ))}
            </div>
          )}
        </div>

        {/* Imports */}
        <div role="tabpanel" id="panel-imports" aria-labelledby="tab-imports" hidden={activeTab !== 'imports'}>
          {exp.imports.length === 0 ? (
            <div className="text-center py-12 text-navy-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No imports detected in this file</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exp.imports.map((imp, i) => (
                <ImportCard key={i} imp={imp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}