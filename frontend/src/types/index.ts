export interface Repository {
  id: string
  name: string
  url: string
  status: 'pending' | 'cloning' | 'scanning' | 'analyzing' | 'complete' | 'error'
  error?: string
  stats?: RepositoryStats
  tree?: FileTreeNode
  createdAt: string
  updatedAt: string
}

export interface RepositoryStats {
  files: number
  folders: number
  languages: Record<string, number>
  frameworks: string[]
  totalSize: number
  linesOfCode: number
}

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  language?: string
  size?: number
  children?: FileTreeNode[]
  expanded?: boolean
}

export interface FileContent {
  path: string
  content: string
  language: string
  size: number
  lines: number
}

export interface CodeExplanation {
  filePath: string
  summary: string
  functions: FunctionInfo[]
  classes: ClassInfo[]
  imports: ImportInfo[]
  complexity: 'low' | 'medium' | 'high'
}

export interface FunctionInfo {
  name: string
  lineStart: number
  lineEnd: number
  params: string[]
  returnType?: string
  docstring?: string
  isAsync: boolean
  isExport: boolean
}

export interface ClassInfo {
  name: string
  lineStart: number
  lineEnd: number
  methods: FunctionInfo[]
  properties: PropertyInfo[]
  extends?: string
  implements?: string[]
  docstring?: string
  isExport: boolean
}

export interface PropertyInfo {
  name: string
  type?: string
  visibility: 'public' | 'private' | 'protected'
  isStatic: boolean
  isReadonly: boolean
}

export interface ImportInfo {
  source: string
  specifiers: string[]
  isDefault: boolean
  isNamespace: boolean
  line: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  references?: FileReference[]
  isLoading?: boolean
  model?: 'gemini' | 'fallback'
}

export interface FileReference {
  path: string
  lineStart?: number
  lineEnd?: number
  snippet?: string
}

export interface ChatRequest {
  question: string
  repoId: string
  contextFiles?: string[]
}

export interface ChatResponse {
  answer: string
  references: FileReference[]
  model: 'gemini' | 'fallback'
}

export interface AnalyzeRequest {
  url: string
}

export interface AnalyzeResponse {
  repoId: string
  status: Repository['status']
}

export interface ApiError {
  message: string
  code: string
  details?: unknown
}

export type LanguageColorMap = Record<string, string>

export const LANGUAGE_COLORS: LanguageColorMap = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3776ab',
  Java: '#ed8b00',
  'C++': '#00599c',
  C: '#a8b9cc',
  'C#': '#239120',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#777bb4',
  Ruby: '#cc342d',
  Swift: '#fa7343',
  Kotlin: '#7f52ff',
  Dart: '#0175c2',
  HTML: '#e34f26',
  CSS: '#1572b6',
  SCSS: '#cf649a',
  Vue: '#42b883',
  Svelte: '#ff3e00',
  React: '#61dafb',
  JSON: '#292929',
  YAML: '#cb171e',
  Markdown: '#083fa1',
  Shell: '#4eaa25',
  Dockerfile: '#2496ed',
  Other: '#8b949e',
}

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const extMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    cc: 'C++',
    cxx: 'C++',
    c: 'C',
    h: 'C',
    hpp: 'C++',
    cs: 'C#',
    go: 'Go',
    rs: 'Rust',
    php: 'PHP',
    rb: 'Ruby',
    swift: 'Swift',
    kt: 'Kotlin',
    dart: 'Dart',
    html: 'HTML',
    htm: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'SCSS',
    less: 'CSS',
    vue: 'Vue',
    svelte: 'Svelte',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    sh: 'Shell',
    bash: 'Shell',
    zsh: 'Shell',
    fish: 'Shell',
    dockerfile: 'Dockerfile',
  }
  return extMap[ext || ''] || 'Other'
}