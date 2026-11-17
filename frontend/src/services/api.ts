import type {
  Repository,
  AnalyzeRequest,
  AnalyzeResponse,
  FileContent,
  CodeExplanation,
  ChatRequest,
  ChatResponse,
  RepositoryStats,
  FileTreeNode,
} from '../types'

export type { AnalyzeRequest, AnalyzeResponse, ChatRequest, ChatResponse }

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const api = {
  analyze: (data: AnalyzeRequest): Promise<AnalyzeResponse> =>
    fetchJson('/repo/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStatus: (repoId: string): Promise<{ status: Repository['status']; error?: string }> =>
    fetchJson(`/repo/${repoId}/status`),

  getStructure: (repoId: string): Promise<FileTreeNode> =>
    fetchJson(`/repo/${repoId}/structure`),

  getStats: (repoId: string): Promise<RepositoryStats> =>
    fetchJson(`/repo/${repoId}/stats`),

  getFile: (repoId: string, filePath: string): Promise<FileContent> =>
    fetchJson(`/repo/${repoId}/files/${filePath.split('/').map(encodeURIComponent).join('/')}`),

  explainFile: (repoId: string, filePath: string): Promise<CodeExplanation> =>
    fetchJson(`/repo/${repoId}/explain`, {
      method: 'POST',
      body: JSON.stringify({ file_path: filePath }),
    }),

  chat: (data: ChatRequest): Promise<ChatResponse> =>
    fetchJson(`/repo/${data.repoId}/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteRepo: (repoId: string): Promise<void> =>
    fetchJson(`/repo/${repoId}`, { method: 'DELETE' }),
}

export function isValidGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'github.com' && parsed.pathname.split('/').filter(Boolean).length === 2
  } catch {
    return false
  }
}

export function extractRepoInfo(url: string): { owner: string; name: string } | null {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length === 2) {
      return { owner: parts[0], name: parts[1] }
    }
    return null
  } catch {
    return null
  }
}