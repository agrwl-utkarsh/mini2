import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, LayoutDashboard, FolderTree, FileText, MessageSquare, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'
import { Button } from '../components/common'
import { FileTree } from '../components/explorer'
import { FileContent } from '../components/explorer'
import { CodeExplainer } from '../components/explainer'
import { ChatPanel } from '../components/assistant'
import { Dashboard } from '../components/dashboard'
import { useRepo } from '../context/RepoContext'
import { useRepoStatus, useRepoStats, useRepoStructure, useFileContent, useExplainFile, useChat } from '../hooks/useRepo'

const PANELS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'explorer', label: 'Explorer', icon: FolderTree },
  { id: 'explainer', label: 'Explainer', icon: FileText },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare },
] as const

type PanelId = typeof PANELS[number]['id']

export function AnalysisPage() {
  const navigate = useNavigate()
  const {
    repo,
    setRepo,
    selectedFile,
    setSelectedFile,
    fileExplanation,
    setFileExplanation,
    sidebarOpen,
    setSidebarOpen,
    activePanel,
    setActivePanel,
  } = useRepo()

  const [repoId, setRepoId] = useState<string | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [explorerWidth, setExplorerWidth] = useState(280)
  const [contentWidth, setContentWidth] = useState(320)
  const [isResizingExplorer, setIsResizingExplorer] = useState(false)
  const [isResizingContent, setIsResizingContent] = useState(false)

  // API hooks
  const statusQuery = useRepoStatus(repoId)
  const isComplete = repo?.status === 'complete' || statusQuery.data?.status === 'complete'
  const statsQuery = useRepoStats(repoId, isComplete)
  const structureQuery = useRepoStructure(repoId, isComplete)
  const fileContentQuery = useFileContent(repoId, selectedFilePath)
  const explainMutation = useExplainFile(repoId)
  useChat(repoId)

  // Handle URL analysis from landing page
  useEffect(() => {
    if (repo && !repoId) {
      setRepoId(repo.id)
    }
  }, [repo, repoId])

  // Sync selected file content
  useEffect(() => {
    if (fileContentQuery.data) {
      setSelectedFile(fileContentQuery.data)
    }
  }, [fileContentQuery.data, setSelectedFile])

  const handleFileSelect = useCallback((path: string) => {
    setSelectedFilePath(path)
    setFileExplanation(null)
    if (activePanel === 'dashboard') {
      setActivePanel('explorer')
    }
  }, [setSelectedFilePath, setFileExplanation, activePanel, setActivePanel])

  const handleExplain = useCallback(() => {
    if (selectedFile) {
      setActivePanel('explainer')
      explainMutation.mutate(selectedFile.path)
    }
  }, [selectedFile, explainMutation, setActivePanel])

  const handleCloseFile = useCallback(() => {
    setSelectedFilePath(null)
    setSelectedFile(null)
    setFileExplanation(null)
  }, [setSelectedFile, setFileExplanation])

  const handleNewAnalysis = useCallback(() => {
    setRepo(null)
    setRepoId(null)
    setSelectedFilePath(null)
    setSelectedFile(null)
    setFileExplanation(null)
    setSidebarOpen(true)
    navigate('/')
  }, [setRepo, setSelectedFile, setFileExplanation, setSidebarOpen, navigate])

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen)
  }, [sidebarOpen, setSidebarOpen])

  // Resize handlers
  const handleExplorerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingExplorer(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleContentMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingContent(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingExplorer) {
        const newWidth = Math.max(200, Math.min(500, e.clientX))
        setExplorerWidth(newWidth)
      }
      if (isResizingContent && selectedFile) {
        const containerWidth = window.innerWidth - explorerWidth - 24
        const newWidth = Math.max(300, Math.min(containerWidth - 200, containerWidth - (e.clientX - explorerWidth - 8)))
        setContentWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingExplorer(false)
      setIsResizingContent(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizingExplorer || isResizingContent) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingExplorer, isResizingContent, explorerWidth, selectedFile])

  if (!repo) {
    return (
      <div className="flex h-screen bg-navy-950 items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-navy-100 mb-2">No Repository Loaded</h2>
          <p className="text-navy-400 mb-6 text-sm">Please enter a GitHub repository URL on the home page to start analyzing.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  const isLoading = repo.status !== 'complete' && !isComplete
  const isDashboard = activePanel === 'dashboard'
  const showExplorer = !isDashboard && (activePanel === 'explorer' || activePanel === 'explainer' || !!selectedFile)
  const showContent = !isDashboard && (selectedFile || activePanel === 'explorer' || activePanel === 'explainer')
  const showExplainer = !isDashboard && !!selectedFile && activePanel === 'explainer'
  const showAssistant = activePanel === 'assistant'

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col panel border-r border-navy-700 transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-16'
        )}
        style={{ minWidth: sidebarOpen ? '288px' : '64px' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-navy-950 font-bold text-sm">RS</span>
              </div>
              <span className="font-bold text-navy-100">RepoSense</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSidebarToggle}
            className={cn('flex-shrink-0', !sidebarOpen && 'ml-auto')}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id as PanelId)}
              className={cn(
                'w-full rounded-lg transition-colors duration-150',
                'flex items-center gap-3 px-3 py-2.5',
                activePanel === panel.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-navy-300 hover:text-navy-100 hover:bg-navy-800'
              )}
              aria-current={activePanel === panel.id ? 'page' : undefined}
            >
              <panel.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {sidebarOpen && <span className="font-medium">{panel.label}</span>}
            </button>
          ))}
        </nav>

        {/* Repo Actions */}
        {sidebarOpen && (
          <div className="p-3 border-t border-navy-700 space-y-2">
            <Button variant="secondary" className="w-full justify-start" onClick={handleNewAnalysis}>
              <RefreshCw className="w-4 h-4" />
              New Analysis
            </Button>
            {repo && (
              <div className="px-2 py-2 text-xs text-navy-500 border-t border-navy-700">
                <p className="font-medium text-navy-300 mb-1">{repo.name}</p>
                <p className="truncate">{repo.url}</p>
                <p className="mt-1 flex items-center gap-1">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    repo.status === 'complete' && 'bg-green-400',
                    repo.status === 'error' && 'bg-red-400',
                    (repo.status === 'cloning' || repo.status === 'scanning' || repo.status === 'analyzing') && 'bg-amber-400 animate-pulse',
                    'bg-navy-500'
                  )} />
                  {repo.status}
                </p>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Explorer Resizer */}
      {sidebarOpen && showExplorer && (
        <div
          onMouseDown={handleExplorerMouseDown}
          className="w-1 cursor-col-resize bg-navy-700 hover:bg-cyan-500/30 transition-colors flex-shrink-0"
          style={{ height: '100%' }}
          aria-label="Resize explorer"
          role="separator"
          tabIndex={0}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3 border-b border-navy-700 bg-navy-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleSidebarToggle} aria-label="Toggle sidebar">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-semibold text-navy-100 truncate max-w-md">
              {repo.name}
            </h1>
            {isLoading && (
              <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {repo.status === 'error' && repo.error && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                Error: {repo.error}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {isDashboard ? (
            <div className="flex-1 overflow-auto p-6">
              <Dashboard repo={{ ...repo, stats: repo.stats || statsQuery.data }} isLoading={isLoading} />
            </div>
          ) : (
            <>
              {/* Explorer Panel */}
              {showExplorer && (
                <div
                  className="flex flex-col panel border-r border-navy-700"
                  style={{ width: `${explorerWidth}px`, minWidth: '200px', maxWidth: '500px' }}
                >
                  <FileTree
                    tree={repo.tree || structureQuery.data || null}
                    selectedPath={selectedFile?.path || selectedFilePath || ''}
                    onSelect={handleFileSelect}
                    onRefresh={() => structureQuery.refetch()}
                    isLoading={structureQuery.isLoading}
                  />
                </div>
              )}

              {/* Content Resizer */}
              {showContent && showExplorer && (
                <div
                  onMouseDown={handleContentMouseDown}
                  className="w-1 cursor-col-resize bg-navy-700 hover:bg-cyan-500/30 transition-colors flex-shrink-0"
                  style={{ height: '100%' }}
                  aria-label="Resize content panel"
                  role="separator"
                  tabIndex={0}
                />
              )}

              {/* Content Panel */}
              {selectedFile ? (
                <div
                  className="flex-1 flex flex-col min-w-0"
                  style={{ width: showExplorer ? `${contentWidth}px` : '100%' }}
                >
                  <FileContent
                    file={selectedFile}
                    onClose={handleCloseFile}
                    onExplain={handleExplain}
                  />
                </div>
              ) : fileContentQuery.isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-navy-400 p-8 space-y-3">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                    <p className="text-sm">Loading file content...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-navy-500 p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a file to view its contents</p>
                  </div>
                </div>
              )}

              {/* Explainer Panel Resizer */}
              {showExplainer && (
                <div
                  className="w-1 cursor-col-resize bg-navy-700 hover:bg-cyan-500/30 transition-colors flex-shrink-0"
                  style={{ height: '100%' }}
                  aria-label="Resize explainer panel"
                  role="separator"
                  tabIndex={0}
                />
              )}

              {/* Explainer Panel */}
              {showExplainer && (
                <div className="w-96 flex-shrink-0 border-l border-navy-700 bg-navy-900/80">
                  <CodeExplainer
                    explanation={fileExplanation}
                    isLoading={explainMutation.isPending}
                    onRefresh={() => selectedFile && explainMutation.mutate(selectedFile.path)}
                  />
                </div>
              )}
            </>
          )}

          {/* Assistant Overlay */}
          {showAssistant && (
            <div className="absolute inset-0 z-50 bg-navy-950/95 backdrop-blur-sm flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-navy-700">
                <h3 className="font-semibold text-navy-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Assistant
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActivePanel('explorer')}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <ChatPanel onSelectFile={handleFileSelect} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
