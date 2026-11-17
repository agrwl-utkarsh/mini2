import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Repository, FileTreeNode, RepositoryStats, FileContent, CodeExplanation, ChatMessage } from '../types'

interface RepoContextType {
  repo: Repository | null
  setRepo: (repo: Repository | null) => void
  updateRepoStatus: (status: Repository['status'], error?: string) => void
  setRepoStats: (stats: RepositoryStats) => void
  setRepoTree: (tree: FileTreeNode) => void
  selectedFile: FileContent | null
  setSelectedFile: (file: FileContent | null) => void
  fileExplanation: CodeExplanation | null
  setFileExplanation: (explanation: CodeExplanation | null) => void
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  updateLastChatMessage: (updates: Partial<ChatMessage>) => void
  clearChat: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activePanel: 'dashboard' | 'explorer' | 'explainer' | 'assistant'
  setActivePanel: (panel: 'dashboard' | 'explorer' | 'explainer' | 'assistant') => void
}

const RepoContext = createContext<RepoContextType | undefined>(undefined)

export function RepoProvider({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState<Repository | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [fileExplanation, setFileExplanation] = useState<CodeExplanation | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activePanel, setActivePanel] = useState<'dashboard' | 'explorer' | 'explainer' | 'assistant'>('dashboard')

  const updateRepoStatus = useCallback((status: Repository['status'], error?: string) => {
    setRepo(prev => prev ? { ...prev, status, error } : null)
  }, [])

  const setRepoStats = useCallback((stats: RepositoryStats) => {
    setRepo(prev => prev ? { ...prev, stats } : null)
  }, [])

  const setRepoTree = useCallback((tree: FileTreeNode) => {
    setRepo(prev => prev ? { ...prev, tree } : null)
  }, [])

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message])
  }, [])

  const updateLastChatMessage = useCallback((updates: Partial<ChatMessage>) => {
    setChatMessages(prev => {
      if (prev.length === 0) return prev
      const newMessages = [...prev]
      newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], ...updates }
      return newMessages
    })
  }, [])

  const clearChat = useCallback(() => {
    setChatMessages([])
  }, [])

  return (
    <RepoContext.Provider value={{
      repo,
      setRepo,
      updateRepoStatus,
      setRepoStats,
      setRepoTree,
      selectedFile,
      setSelectedFile,
      fileExplanation,
      setFileExplanation,
      chatMessages,
      addChatMessage,
      updateLastChatMessage,
      clearChat,
      sidebarOpen,
      setSidebarOpen,
      activePanel,
      setActivePanel,
    }}>
      {children}
    </RepoContext.Provider>
  )
}

export function useRepo() {
  const context = useContext(RepoContext)
  if (!context) {
    throw new Error('useRepo must be used within a RepoProvider')
  }
  return context
}