import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type AnalyzeRequest } from '../services/api'
import { useRepo } from '../context/RepoContext'
import type { Repository } from '../types'

export function useAnalyzeRepo() {
  const queryClient = useQueryClient()
  const { setRepo, updateRepoStatus } = useRepo()

  return useMutation({
    mutationFn: (data: AnalyzeRequest) => api.analyze(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['repo'] })
      const tempRepo: Repository = {
        id: 'temp',
        name: '',
        url: data.url,
        status: 'cloning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setRepo(tempRepo)
      return { tempRepo }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['repoStatus', response.repoId] })
    },
    onError: (error) => {
      updateRepoStatus('error', error.message)
    },
  })
}

export function useRepoStatus(repoId: string | null, enabled = true) {
  const { updateRepoStatus: _updateRepoStatus } = useRepo()

  return useQuery({
    queryKey: ['repoStatus', repoId],
    queryFn: () => api.getStatus(repoId!),
    enabled: !!repoId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.status === 'complete' || data?.status === 'error' ? false : 2000
    },
    gcTime: 0,
  })
}

export function useRepoStats(repoId: string | null) {
  const { setRepoStats: _setRepoStats } = useRepo()

  return useQuery({
    queryKey: ['repoStats', repoId],
    queryFn: () => api.getStats(repoId!),
    enabled: !!repoId,
    gcTime: 0,
  })
}

export function useRepoStructure(repoId: string | null) {
  const { setRepoTree: _setRepoTree } = useRepo()

  return useQuery({
    queryKey: ['repoStructure', repoId],
    queryFn: () => api.getStructure(repoId!),
    enabled: !!repoId,
    gcTime: 0,
  })
}

export function useFileContent(repoId: string | null, filePath: string | null) {
  const { setSelectedFile: _setSelectedFile } = useRepo()

  return useQuery({
    queryKey: ['fileContent', repoId, filePath],
    queryFn: () => api.getFile(repoId!, filePath!),
    enabled: !!repoId && !!filePath,
    gcTime: 0,
  })
}

export function useExplainFile(repoId: string | null) {
  const { setFileExplanation } = useRepo()

  return useMutation({
    mutationFn: (filePath: string) => api.explainFile(repoId!, filePath),
    onSuccess: setFileExplanation,
  })
}

export function useChat(repoId: string | null) {
  const { addChatMessage } = useRepo()

  return useMutation({
    mutationFn: ({ question, contextFiles }: { question: string; contextFiles?: string[] }) =>
      api.chat({ question, repoId: repoId!, contextFiles }),
    onMutate: async ({ question }) => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: question,
        timestamp: new Date().toISOString(),
      }
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      }
      addChatMessage(userMessage)
      addChatMessage(assistantMessage)
      return { assistantMessageId: assistantMessage.id }
    },
  })
}