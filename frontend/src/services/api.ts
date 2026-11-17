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

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('reposense_backend_url')
    if (custom) return custom.replace(/\/+$/, '')
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8003/api'
  }
  return '/api'
}

export function setCustomApiUrl(url: string) {
  if (typeof window !== 'undefined') {
    let clean = url.trim().replace(/\/+$/, '')
    if (clean && !clean.endsWith('/api')) {
      clean += '/api'
    }
    if (clean) {
      localStorage.setItem('reposense_backend_url', clean)
    } else {
      localStorage.removeItem('reposense_backend_url')
    }
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getApiBase()
  const url = `${base}${endpoint}`
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
  } catch (err: any) {
    throw new Error(`Cannot connect to backend API at ${base}. Make sure your Render backend is running and CORS is configured.`)
  }

  if (response.status === 405) {
    throw new Error(`HTTP 405: Vercel static hosting intercepted the API request because VITE_API_URL is not configured. Please configure your Render backend URL below.`)
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `Request failed with HTTP ${response.status}` }))
    throw new Error(error.detail || error.message || `HTTP ${response.status}`)
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