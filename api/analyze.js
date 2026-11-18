// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, apiKeys = {} } = req.body || {}
  if (!url) {
    return res.status(400).json({ error: 'Repository URL is required' })
  }

  let owner, repo, branchHint
  try {
    const parsed = parseGithubUrl(url)
    owner = parsed.owner
    repo = parsed.repo
    branchHint = parsed.branch
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid GitHub URL' })
  }

  // Merge keys from request headers, request body, or server process.env
  const keys = {
    grok: apiKeys.grok || req.headers['x-grok-key'] || process.env.GROK_API_KEY,
    gemini: apiKeys.gemini || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY,
    deepseek: apiKeys.deepseek || req.headers['x-deepseek-key'] || process.env.DEEPSEEK_API_KEY,
    openrouter: apiKeys.openrouter || req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY,
    huggingface: apiKeys.huggingface || req.headers['x-huggingface-key'] || process.env.HUGGINGFACE_API_KEY,
    github: apiKeys.github || req.headers['x-github-token'] || process.env.GITHUB_TOKEN,
  }

  try {
    // 1. Fetch Repository Metadata from GitHub API
    const meta = await fetchRepoMetadata(owner, repo, keys.github)
    const branch = branchHint || meta.default_branch || 'main'

    // 2. Fetch README Content and File Tree in parallel
    const [repositoryContent, fileTree] = await Promise.all([
      fetchRepositoryReadme(owner, repo, branch),
      fetchRepositoryTree(owner, repo, branch, keys.github)
    ])

    // 3. Extract tech stack & key architectural hints from README & file tree
    const techStack = detectTechStack(repositoryContent, fileTree)

    // 4. Generate Explanation & Architecture concurrently
    const [explanationResult, architecture] = await Promise.all([
      explainRepository(repositoryContent, meta, fileTree, techStack, keys),
      generateArchitecture(repositoryContent, meta, fileTree, techStack, keys)
    ])

    return res.status(200).json({
      meta: {
        owner,
        repo,
        fullName: meta.full_name || `${owner}/${repo}`,
        description: meta.description || '',
        stars: meta.stargazers_count || 0,
        forks: meta.forks_count || 0,
        openIssues: meta.open_issues_count || 0,
        language: meta.language || 'Unknown',
        topics: meta.topics || [],
        license: meta.license?.spdx_id || meta.license?.name || 'Not specified',
        defaultBranch: branch,
        avatarUrl: meta.owner?.avatar_url || '',
        htmlUrl: meta.html_url || `https://github.com/${owner}/${repo}`,
      },
      explanation: explanationResult.text,
      highlights: explanationResult.highlights,
      techStack,
      architecture,
      fileTree: fileTree.slice(0, 300), // Return tree for code explorer
      providerUsed: explanationResult.provider,
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return res.status(500).json({ error: err.message || 'Failed to analyze repository' })
  }
}

export function parseGithubUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') throw new Error('Invalid URL provided')
  
  let clean = rawUrl.trim()
  // Strip protocol and trailing slashes
  clean = clean.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')
  clean = clean.replace(/\.git$/, '').replace(/\/$/, '')

  const parts = clean.split('/')
  if (parts.length < 2) {
    throw new Error('Please enter a valid repository URL like https://github.com/owner/repo')
  }

  const owner = parts[0]
  const repo = parts[1]
  let branch = null

  if (parts.length >= 4 && parts[2] === 'tree') {
    branch = parts[3]
  }

  return { owner, repo, branch }
}

async function fetchRepoMetadata(owner, repo, githubToken) {
  const headers = {
    'User-Agent': 'GitHub-Repo-Explainer-App',
    'Accept': 'application/vnd.github.v3+json',
  }
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    console.warn('GitHub API metadata fetch failed, using fallback:', e.message)
  }

  return {
    full_name: `${owner}/${repo}`,
    default_branch: 'main',
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    language: 'Code',
    html_url: `https://github.com/${owner}/${repo}`,
  }
}

async function fetchRepositoryReadme(owner, repo, branch) {
  const branches = [branch, 'main', 'master']
  const fileNames = [
    'README.md',
    'readme.md',
    'README.MD',
    'README.markdown',
    'README.rst',
    'README.txt',
    'README'
  ]

  for (const b of branches) {
    for (const name of fileNames) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${b}/${name}`
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (response.ok) {
          const text = await response.text()
          if (text && text.trim().length > 10) return text
        }
      } catch {
        continue
      }
    }
  }

  return `# ${repo}\n\nNo README found in this repository. The repository contains source code and assets.`
}

async function fetchRepositoryTree(owner, repo, branch, githubToken) {
  const headers = {
    'User-Agent': 'GitHub-Repo-Explainer-App',
    'Accept': 'application/vnd.github.v3+json',
  }
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers, signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.tree)) {
        return data.tree.map(item => ({
          path: item.path,
          type: item.type === 'tree' ? 'directory' : 'file',
          size: item.size || 0,
        }))
      }
    }
  } catch (e) {
    console.warn('Failed to fetch git tree:', e.message)
  }

  // Fallback tree based on typical repo structure
  return [
    { path: 'src', type: 'directory', size: 0 },
    { path: 'src/index.js', type: 'file', size: 1024 },
    { path: 'package.json', type: 'file', size: 512 },
    { path: 'README.md', type: 'file', size: 2048 },
    { path: '.gitignore', type: 'file', size: 120 },
  ]
}

function detectTechStack(readme, fileTree = []) {
  const text = (readme + ' ' + fileTree.map(f => f.path).join(' ')).toLowerCase()
  const tech = []

  const signatures = [
    { name: 'React', category: 'Frontend', match: /react|jsx|tsx|create-react-app/ },
    { name: 'Next.js', category: 'Framework', match: /next\.js|nextjs|"next"/ },
    { name: 'Vue.js', category: 'Frontend', match: /vue|vuex|pinia|\.vue/ },
    { name: 'Angular', category: 'Frontend', match: /angular|ng-module/ },
    { name: 'Node.js', category: 'Backend', match: /nodejs|node\.js|express|koa|fastify/ },
    { name: 'TypeScript', category: 'Language', match: /typescript|\.ts|\.tsx|tsconfig/ },
    { name: 'Python', category: 'Language', match: /python|\.py|requirements\.txt|django|flask|fastapi/ },
    { name: 'Go', category: 'Language', match: /golang|go\.mod|\.go/ },
    { name: 'Rust', category: 'Language', match: /rust|cargo\.toml|\.rs/ },
    { name: 'Docker', category: 'DevOps', match: /docker|dockerfile|docker-compose/ },
    { name: 'PostgreSQL', category: 'Database', match: /postgres|postgresql|psql/ },
    { name: 'MongoDB', category: 'Database', match: /mongodb|mongoose/ },
    { name: 'Redis', category: 'Cache', match: /redis|key-value store/ },
    { name: 'Tailwind CSS', category: 'Styling', match: /tailwind|tailwindcss/ },
    { name: 'GraphQL', category: 'API', match: /graphql|apollo/ },
    { name: 'REST API', category: 'API', match: /rest api|restful|endpoints/ },
    { name: 'Kubernetes', category: 'DevOps', match: /kubernetes|k8s|helm/ },
    { name: 'Vite', category: 'Tooling', match: /vite|vite\.config/ },
    { name: 'Vercel', category: 'Cloud', match: /vercel|vercel\.json/ },
    { name: 'AWS', category: 'Cloud', match: /aws|amazon web services|s3|lambda/ },
  ]

  for (const sig of signatures) {
    if (sig.match.test(text)) {
      tech.push({ name: sig.name, category: sig.category })
    }
  }

  return tech.length > 0 ? tech : [
    { name: 'JavaScript', category: 'Language' },
    { name: 'Web', category: 'Platform' }
  ]
}

async function explainRepository(readme, meta, fileTree, techStack, keys) {
  const truncatedReadme = readme.length > 8000 ? readme.slice(0, 8000) + '\n\n[Truncated]' : readme
  const topFiles = fileTree.slice(0, 40).map(f => f.path).join('\n')
  const techNames = techStack.map(t => t.name).join(', ')

  const prompt = `You are a Principal Software Engineer and mentor. Explain this GitHub repository to a developer in an engaging, lucid, and insightful way.

Project Name: ${meta.full_name || meta.repo}
Description: ${meta.description || 'Open-source software'}
Stars: ${meta.stargazers_count || 0}
Tech Stack: ${techNames}

Repository Files (excerpt):
${topFiles}

README Content:
${truncatedReadme}

Format your output in clean Markdown with the following clear sections:
### 1. The Core Problem & Motivation
What frustration or challenge does this solve? What was the "before" and "after" for developers? Use a relatable real-world analogy.

### 2. How It Works Under the Hood
Walk through the mechanics step-by-step. What happens when a request or operation enters the system?

### 3. Key Architectural Pillars & Tech Stack
Highlight the crucial architectural components, why they were chosen, and how they interact.

### 4. Getting Started & Practical Walkthrough
A friendly, no-nonsense guide on prerequisites, installation, and first-run.

### 5. Who Should Use This & Best Practices
Real-world use cases, scenarios where this shines, and production advice.

Write like you are having a brilliant whiteboard conversation. Be clear, inspiring, and technically rigorous.`

  const errors = []

  // 1. Grok
  if (keys.grok) {
    try {
      const text = await callGrok(prompt, keys.grok)
      return { text, highlights: extractHighlights(text), provider: 'Grok (xAI)' }
    } catch (e) {
      errors.push(`Grok: ${e.message}`)
    }
  }

  // 2. Gemini
  if (keys.gemini) {
    const models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro']
    for (const m of models) {
      try {
        const text = await callGemini(prompt, keys.gemini, m)
        return { text, highlights: extractHighlights(text), provider: `Gemini (${m})` }
      } catch (e) {
        errors.push(`Gemini ${m}: ${e.message}`)
      }
    }
  }

  // 3. DeepSeek
  if (keys.deepseek) {
    try {
      const text = await callDeepSeek(prompt, keys.deepseek)
      return { text, highlights: extractHighlights(text), provider: 'DeepSeek' }
    } catch (e) {
      errors.push(`DeepSeek: ${e.message}`)
    }
  }

  // 4. OpenRouter
  if (keys.openrouter) {
    const models = [
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-2-2b-it:free',
      'qwen/qwen-2.5-7b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
    ]
    for (const m of models) {
      try {
        const text = await callOpenRouter(prompt, keys.openrouter, m)
        return { text, highlights: extractHighlights(text), provider: `OpenRouter (${m})` }
      } catch (e) {
        errors.push(`OpenRouter ${m}: ${e.message}`)
      }
    }
  }

  // 5. Hugging Face
  if (keys.huggingface) {
    try {
      const text = await callHuggingFace(prompt, keys.huggingface, 'meta-llama/Meta-Llama-3.1-8B-Instruct')
      return { text, highlights: extractHighlights(text), provider: 'Hugging Face' }
    } catch (e) {
      errors.push(`Hugging Face: ${e.message}`)
    }
  }

  // Smart fallback when no keys are provided or all providers are unavailable
  const fallbackText = generateStructuredFallbackExplanation(meta, readme, techStack, fileTree)
  return {
    text: fallbackText,
    highlights: extractHighlights(fallbackText),
    provider: 'Built-in Code Analyzer (Offline Mode)',
  }
}

function extractHighlights(text) {
  const highlights = []
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const clean = trimmed.replace(/^[-*]|\d+\.\s*/, '').replace(/\*\*/g, '').trim()
      if (clean.length > 20 && clean.length < 140) {
        highlights.push(clean)
        if (highlights.length >= 4) break
      }
    }
  }
  if (highlights.length === 0) {
    return [
      'Modern open-source modular architecture designed for developer velocity',
      'Straightforward setup with containerized or standard package manager workflows',
      'High decoupling between business logic, data persistence, and interface layers',
      'Extensible foundation with clear configuration paradigms'
    ]
  }
  return highlights
}

function generateStructuredFallbackExplanation(meta, readme, techStack, fileTree) {
  const repoName = meta.repo || meta.name || 'Repository'
  const techNames = techStack.map(t => t.name).join(', ')
  const keyFiles = fileTree.slice(0, 10).map(f => `\`${f.path}\``).join(', ')

  return `### 1. The Core Problem & Motivation
Imagine you need to solve complex tasks with ${techNames || 'modern technologies'}, but traditional setups require tedious boilerplate, fragmented tooling, and constant maintenance. **${repoName}** addresses this head-on by delivering a cohesive, production-ready solution that streamlines workflows, enforces best practices, and minimizes friction.

Think of it like an architect-designed blueprint: rather than pouring concrete and running electrical wiring from scratch, you receive a rigorously engineered framework where core components connect harmoniously out of the box.

### 2. How It Works Under the Hood
At its foundation, **${repoName}** coordinates operations across structured execution layers:
1. **Entry & Routing:** Incoming requests or commands enter through designated interfaces (${keyFiles.slice(0, 60)}...).
2. **Business Domain Processing:** Dedicated services handle validation, transformation, and business rule orchestration.
3. **Data & State Management:** Data models and storage abstraction layers ensure resilient state persistence and cache synchronization.
4. **Output & Presentation:** Clean responses, events, or client-rendered views deliver deterministic results back to the user or caller.

### 3. Key Architectural Pillars & Tech Stack
The project leverages **${techNames}** to achieve balanced performance and developer ergonomics:
- **Modular Boundaries:** Clear separation between presentation, application logic, and persistence layers.
- **Resilient Configuration:** Centralized environment-driven configurations that adapt seamlessly between local development and cloud production.
- **Developer Experience:** Rapid build cycles, test runners, and predictable asset bundling.

### 4. Getting Started & Practical Walkthrough
To run this project locally, clone the repository and execute the standard lifecycle scripts:
\`\`\`bash
git clone ${meta.htmlUrl || `https://github.com/${meta.owner}/${meta.repo}`}.git
cd ${repoName}
# Install dependencies
npm install  # or yarn / pip install / cargo build depending on language
# Launch development environment
npm run dev
\`\`\`

### 5. Who Should Use This & Best Practices
- **Engineering Teams:** Looking for a battle-tested architecture that scales with team size without architectural debt.
- **Indie Hackers & Startups:** Seeking to prototype fast and deploy with confidence.
- **Recommended Next Steps:** Explore the **Architecture Flow** and **Code Explorer** tabs above to inspect individual components and trace system interactions.`
}

async function generateArchitecture(readme, meta, fileTree, techStack, keys) {
  const truncated = readme.length > 6000 ? readme.slice(0, 6000) : readme
  const fileList = fileTree.slice(0, 50).map(f => f.path).join('\n')

  const prompt = `Analyze this GitHub repository and generate an interactive flowchart architecture diagram for ReactFlow.
Return ONLY valid JSON matching this exact structure:
{
  "nodes": [
    { "id": "1", "type": "start", "position": { "x": 350, "y": 40 }, "data": { "label": "Client / User", "description": "Web or Mobile Client initiating requests", "tech": "Browser" } },
    { "id": "2", "type": "api", "position": { "x": 350, "y": 150 }, "data": { "label": "API Gateway", "description": "Routing & Rate Limiting", "tech": "Express / HTTP" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "label": "HTTP Requests", "animated": true }
  ]
}

Allowed node types: "start", "end", "process", "decision", "database", "api", "service", "ui", "worker", "cache"
Rules:
- Generate 8 to 14 realistic nodes that faithfully represent this repository.
- Include accurate technology labels in data.tech (e.g. React, PostgreSQL, Redis, Node.js, Vite).
- Position nodes cleanly with x between 100 and 700, and y between 40 and 600.
- Connect edges logically from top to bottom.

Repository: ${meta.full_name || meta.repo}
Tech Stack: ${techStack.map(t => t.name).join(', ')}
Key Files:
${fileList}

README:
${truncated}`

  const callers = [
    { key: keys.grok, call: (p) => callGrok(p, keys.grok) },
    { key: keys.gemini, call: (p) => callGemini(p, keys.gemini, 'gemini-1.5-flash-latest') },
    { key: keys.deepseek, call: (p) => callDeepSeek(p, keys.deepseek) },
    { key: keys.openrouter, call: (p) => callOpenRouter(p, keys.openrouter, 'meta-llama/llama-3.2-3b-instruct:free') },
  ]

  for (const item of callers) {
    if (!item.key) continue
    try {
      const raw = await item.call(prompt)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges) && parsed.nodes.length >= 4) {
        return normalizeArchitecture(parsed)
      }
    } catch (err) {
      console.warn('AI Architecture JSON parse failed, trying next provider:', err.message)
    }
  }

  // Fallback: Generate architecture from tech stack and file structure
  return generateIntelligentArchitecture(meta, fileTree, techStack)
}

function normalizeArchitecture(arch) {
  const nodes = arch.nodes.map((n, idx) => ({
    id: String(n.id || idx + 1),
    type: n.type || 'service',
    position: n.position || { x: 200 + (idx % 3) * 180, y: 60 + Math.floor(idx / 3) * 120 },
    data: {
      label: n.data?.label || n.label || `Node ${idx + 1}`,
      description: n.data?.description || n.description || '',
      tech: n.data?.tech || n.tech || '',
    }
  }))

  const edges = arch.edges.map((e, idx) => ({
    id: e.id || `e${e.source}-${e.target}-${idx}`,
    source: String(e.source),
    target: String(e.target),
    label: e.label || '',
    animated: e.animated ?? true,
  }))

  return { nodes, edges }
}

function generateIntelligentArchitecture(meta, fileTree, techStack) {
  const nodes = []
  const edges = []
  let nextNodeId = 1
  let nextEdgeId = 1

  const addNode = (type, label, x, y, description, tech) => {
    const id = String(nextNodeId++)
    nodes.push({ id, type, position: { x, y }, data: { label, description, tech } })
    return id
  }

  const addEdge = (source, target, label, animated = true) => {
    edges.push({ id: `e${nextEdgeId++}`, source, target, label, animated })
  }

  const filePaths = fileTree.map(f => f.path.toLowerCase()).join(' ')
  const techNames = techStack.map(t => t.name.toLowerCase())

  const hasUi = techNames.some(t => ['react', 'vue.js', 'angular', 'next.js', 'styling', 'frontend'].includes(t)) || filePaths.includes('src/') || filePaths.includes('index.html')
  const hasApi = techNames.some(t => ['node.js', 'express', 'fastify', 'python', 'go', 'api'].includes(t)) || filePaths.includes('api/') || filePaths.includes('routes')
  const hasDb = techNames.some(t => ['postgresql', 'mongodb', 'database', 'prisma', 'typeorm'].includes(t)) || filePaths.includes('db') || filePaths.includes('models')
  const hasCache = techNames.includes('redis') || filePaths.includes('cache')
  const hasWorkers = filePaths.includes('worker') || filePaths.includes('queue') || filePaths.includes('jobs')
  const hasDocker = techNames.includes('docker') || filePaths.includes('dockerfile')

  // Top level entry point
  const startId = addNode('start', 'Client / User Interaction', 350, 40, 'Web browser, Mobile App, or CLI Terminal', 'Client Layer')
  
  let entryTargetId = startId
  if (hasUi) {
    const uiId = addNode('ui', `${meta.repo} UI`, 350, 140, 'Interactive views, state management & user events', techStack.find(t => t.category === 'Frontend')?.name || 'Frontend')
    addEdge(startId, uiId, 'Interacts with')
    entryTargetId = uiId
  }

  let gatewayId = entryTargetId
  if (hasApi) {
    gatewayId = addNode('api', 'API Gateway & Controllers', 350, 240, 'Endpoint routing, authentication & request validation', techStack.find(t => t.category === 'Backend')?.name || 'HTTP Router')
    addEdge(entryTargetId, gatewayId, 'REST / JSON Calls')
  }

  // Core Service
  const serviceId = addNode('service', 'Core Business Engine', 350, 340, 'Main logic execution, algorithms, and orchestration', techStack.find(t => t.category === 'Language')?.name || 'Core Domain')
  addEdge(gatewayId, serviceId, 'Dispatches action')

  if (hasCache) {
    const cacheId = addNode('cache', 'Cache & Session Store', 160, 340, 'High-speed in-memory key-value caching', 'Redis')
    addEdge(serviceId, cacheId, 'Query cache')
  }

  if (hasWorkers) {
    const workerId = addNode('worker', 'Async Worker Pipeline', 540, 340, 'Background tasks, scheduled crons & event consumers', 'Async Queue')
    addEdge(serviceId, workerId, 'Enqueues jobs')
  }

  if (hasDb) {
    const dbId = addNode('database', 'Primary Data Store', 350, 440, 'Persistent records, transactions and schema relations', techStack.find(t => t.category === 'Database')?.name || 'SQL / NoSQL')
    addEdge(serviceId, dbId, 'Read / Write queries')
  }

  // Output
  const endId = addNode('end', 'Rendered Output / Response', 350, 540, 'Formatted response payload or finalized application state', 'Success (200 OK)')
  addEdge(serviceId, endId, 'Delivers result')

  return { nodes, edges }
}

/* Provider API Callers */
async function callGrok(prompt, apiKey) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Grok error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callGemini(prompt, apiKey, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2500 },
      }),
      signal: AbortSignal.timeout(20000),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callDeepSeek(prompt, apiKey) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`DeepSeek error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callOpenRouter(prompt, apiKey, model) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/agrwl-utkarsh/mini2',
      'X-Title': 'GitHub Repository Explainer',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500,
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callHuggingFace(prompt, apiKey, model) {
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { temperature: 0.7, max_new_tokens: 2000, return_full_text: false },
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`HuggingFace error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data?.[0]?.generated_text || ''
}
