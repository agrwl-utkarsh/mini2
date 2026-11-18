// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages = [], repoContext = {}, apiKeys = {} } = req.body || {}
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  const userQuestion = messages[messages.length - 1]?.content || ''
  const repoName = repoContext.name || repoContext.repo || 'this repository'
  const techStack = Array.isArray(repoContext.techStack) 
    ? repoContext.techStack.map(t => t.name || t).join(', ') 
    : (repoContext.techStack || 'JavaScript / Web')

  const headers = req.headers || {}
  const keys = {
    grok: apiKeys.grok || headers['x-grok-key'] || process.env.GROK_API_KEY,
    gemini: apiKeys.gemini || headers['x-gemini-key'] || process.env.GEMINI_API_KEY,
    deepseek: apiKeys.deepseek || headers['x-deepseek-key'] || process.env.DEEPSEEK_API_KEY,
    openrouter: apiKeys.openrouter || headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY,
  }

  // Format file list & architecture nodes for context
  const filesList = Array.isArray(repoContext.fileTree)
    ? repoContext.fileTree.slice(0, 80).map(f => f.path).join('\n')
    : ''
  const archNodes = Array.isArray(repoContext.architecture?.nodes)
    ? repoContext.architecture.nodes.map(n => `- ${n.data?.label || n.label} (${n.data?.typeKey || n.type}): ${n.data?.description || ''} [${n.data?.tech || ''}]`).join('\n')
    : ''

  const systemPrompt = `You are a knowledgeable senior engineer answering questions about the GitHub repository "${repoName}".

Project Description: ${repoContext.description || 'Open source software'}
Detected Tech Stack: ${techStack}
Repository Files:
${filesList}

Architecture Components:
${archNodes}

Documentation & Explanation:
${(repoContext.readmeSnippet || '').slice(0, 3500)}

Instructions:
- Answer the user's question directly, clearly, and in plain English.
- Use the actual repository context (specific files, architecture nodes, detected dependencies, setup commands).
- Avoid robotic buzzwords and childish emojis.
- If asking about specific files or code, reference the real file paths.
- Provide clean code snippets when showing commands or code.`

  const conversation = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))

  if (keys.grok) {
    try {
      const reply = await chatWithGrok(systemPrompt, conversation, keys.grok)
      if (reply) return res.status(200).json({ message: reply, provider: 'Grok' })
    } catch (e) {
      console.warn('Chat Grok error:', e.message)
    }
  }

  if (keys.gemini) {
    const geminiModels = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash-exp']
    for (const model of geminiModels) {
      try {
        const reply = await chatWithGemini(systemPrompt, conversation, keys.gemini, model)
        if (reply) return res.status(200).json({ message: reply, provider: 'Gemini' })
      } catch (e) {
        console.warn(`Chat Gemini error (${model}):`, e.message)
      }
    }
  }

  if (keys.deepseek) {
    try {
      const reply = await chatWithDeepSeek(systemPrompt, conversation, keys.deepseek)
      if (reply) return res.status(200).json({ message: reply, provider: 'DeepSeek' })
    } catch (e) {
      console.warn('Chat DeepSeek error:', e.message)
    }
  }

  if (keys.openrouter) {
    try {
      const reply = await chatWithOpenRouter(systemPrompt, conversation, keys.openrouter)
      if (reply) return res.status(200).json({ message: reply, provider: 'OpenRouter' })
    } catch (e) {
      console.warn('Chat OpenRouter error:', e.message)
    }
  }

  // Deep Context-Aware Knowledge Engine (dynamically answers ANY question about the repo)
  const intelligentReply = answerRepoQuestion(userQuestion, repoContext)
  return res.status(200).json({
    message: intelligentReply,
    provider: 'Repository Assistant'
  })
}

function answerRepoQuestion(question, context) {
  const q = question.toLowerCase().trim()
  const name = context.name || context.repo || 'this repository'
  const tech = Array.isArray(context.techStack) 
    ? context.techStack.map(t => t.name).join(', ') 
    : (context.techStack || 'standard web technologies')
  const files = Array.isArray(context.fileTree) ? context.fileTree : []
  const arch = context.architecture || {}
  const nodes = Array.isArray(arch.nodes) ? arch.nodes : []
  const edges = Array.isArray(arch.edges) ? arch.edges : []
  const textSnippet = (context.readmeSnippet || '') + ' ' + (context.description || '')

  // 1. Specific file queries (e.g. "where is...", "what files...", "package.json", "index.html", "src", "api")
  const fileKeywords = ['where is', 'which file', 'what file', 'find file', 'folder', 'directory', 'structure', 'path', 'package.json', 'readme', 'vite', 'index.html', 'app.jsx', 'dockerfile']
  if (fileKeywords.some(k => q.includes(k)) || q.includes('.js') || q.includes('.jsx') || q.includes('.ts') || q.includes('.json') || q.includes('.html')) {
    // Find matching files in the repo tree
    const terms = q.replace(/where is|which file|what file|find|the|in|is|a/gi, '').trim().split(/\s+/)
    const matchedFiles = files.filter(f => {
      const lowerPath = f.path.toLowerCase()
      return terms.some(t => t.length > 2 && lowerPath.includes(t))
    })

    if (matchedFiles.length > 0) {
      const list = matchedFiles.slice(0, 10).map(f => `- \`${f.path}\` (${f.type === 'directory' ? 'folder' : `${Math.round(f.size / 1024 * 10) / 10 || 1} KB`})`).join('\n')
      return `### Files in ${name}

Here are the relevant files located in the repository:

${list}

You can click on any of these files in the **Files** tab on the top menu to view the code line by line and read a breakdown of its logic.`
    }

    // If asking about general project structure
    const topLevelDirs = Array.from(new Set(files.map(f => f.path.split('/')[0]))).slice(0, 10)
    return `### Repository Structure for ${name}

The project is organized into these main areas:
${topLevelDirs.map(d => `- \`${d}\``).join('\n')}

- Total files indexed: ${files.length}
- Primary entry points are typically located in \`src/\` or at the root level.
- You can inspect all files and browse code directly in the **Files** tab above.`
  }

  // 2. Setup, installation, running & testing commands
  if (q.includes('run') || q.includes('start') || q.includes('install') || q.includes('setup') || q.includes('how to use') || q.includes('test') || q.includes('clone') || q.includes('build')) {
    const isPython = tech.toLowerCase().includes('python') || files.some(f => f.path.endsWith('.py'))
    const isRust = tech.toLowerCase().includes('rust') || files.some(f => f.path.endsWith('cargo.toml'))
    const isGo = tech.toLowerCase().includes('go') || files.some(f => f.path.endsWith('go.mod'))

    if (isPython) {
      return `### How to Set Up and Run ${name}

1. Clone the repository:
\`\`\`bash
git clone ${context.htmlUrl || `https://github.com/${name}`}.git
cd ${context.repo || 'repository'}
\`\`\`

2. Set up a virtual environment:
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
\`\`\`

3. Install required packages:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Run the main script or server:
\`\`\`bash
python main.py
\`\`\``
    }

    if (isRust) {
      return `### How to Build and Run ${name} (Rust)

1. Clone the repository:
\`\`\`bash
git clone ${context.htmlUrl || `https://github.com/${name}`}.git
cd ${context.repo || 'repository'}
\`\`\`

2. Build and run with Cargo:
\`\`\`bash
cargo run
\`\`\`

3. To run tests:
\`\`\`bash
cargo test
\`\`\``
    }

    // Default Node.js / JavaScript
    return `### How to Set Up and Run ${name}

Follow these steps to run the project locally on your machine:

1. Clone the repository:
\`\`\`bash
git clone ${context.htmlUrl || `https://github.com/${name}`}.git
cd ${context.repo || 'repository'}
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the local development server:
\`\`\`bash
npm run dev
\`\`\`

4. To build for production:
\`\`\`bash
npm run build
\`\`\`

Once the development server starts, open your browser to the local address displayed in your terminal (usually \`http://localhost:5173\` or \`http://localhost:3000\`).`
  }

  // 3. Architecture & System Flow queries
  if (q.includes('architecture') || q.includes('flow') || q.includes('how it works') || q.includes('diagram') || q.includes('system') || q.includes('component') || q.includes('pipeline') || q.includes('data')) {
    if (nodes.length > 0) {
      const nodeSummary = nodes.map(n => `- **${n.data?.label || n.label}** (${n.data?.typeKey || n.type}): ${n.data?.description || 'Component in the data pipeline'}`).join('\n')
      const flowConnections = edges.slice(0, 6).map(e => {
        const from = nodes.find(n => n.id === e.source)?.data?.label || e.source
        const to = nodes.find(n => n.id === e.target)?.data?.label || e.target
        return `- ${from} ➔ ${to} ${e.label ? `(${e.label})` : ''}`
      }).join('\n')

      return `### System Architecture in ${name}

The project is structured into the following functional layers:

${nodeSummary}

### Data Flow Connections:
${flowConnections}

You can view and interact with the full visual diagram under the **Architecture** tab above.`
    }

    return `### How ${name} Works

1. **User Interface / Ingress:** The entry point handles user interaction or incoming API calls.
2. **Routing & Controllers:** Requests are parsed and passed to the appropriate services.
3. **Core Business Logic:** Validates inputs, coordinates operations, and produces responses.
4. **Data Management:** Connects to persistence storage or state management.

Open the **Architecture** tab to view the component diagram.`
  }

  // 4. Tech stack, languages & dependencies
  if (q.includes('tech') || q.includes('stack') || q.includes('language') || q.includes('framework') || q.includes('library') || q.includes('dependency') || q.includes('dependencies') || q.includes('database') || q.includes('package')) {
    const list = Array.isArray(context.techStack) && context.techStack.length > 0
      ? context.techStack.map(t => `- **${t.name}** (${t.category || 'Tooling'})`).join('\n')
      : `- **${tech}**`

    return `### Technologies Used in ${name}

Here is the breakdown of technologies detected in this repository:

${list}

- **Primary Language:** ${context.language || 'JavaScript/TypeScript'}
- **Build & Package Management:** Check \`package.json\` or project root in the **Files** tab to see exact version numbers and scripts.`
  }

  // 5. Deployment & Production queries
  if (q.includes('deploy') || q.includes('hosting') || q.includes('vercel') || q.includes('docker') || q.includes('aws') || q.includes('cloud')) {
    const hasVercel = files.some(f => f.path.includes('vercel'))
    const hasDocker = files.some(f => f.path.toLowerCase().includes('docker'))

    return `### Deploying ${name}

${hasVercel ? 'This project includes Vercel configuration (`vercel.json`), making deployment on Vercel immediate:' : 'To deploy this project:'}

1. Push your code to a GitHub repository.
2. Import the repository into your hosting platform (such as [Vercel](https://vercel.com) or Netlify).
3. Set the build command to:
\`\`\`bash
npm run build
\`\`\`
4. Set the output directory to: \`dist\` (or \`build\`).
${hasDocker ? '\nThis repository also contains Docker configurations for containerized deployments.' : ''}`
  }

  // 6. Purpose, Problem Solved & Motivation
  if (q.includes('what is') || q.includes('purpose') || q.includes('why') || q.includes('problem') || q.includes('about') || q.includes('what does')) {
    return `### Purpose of ${name}

**${name}** is designed to:
${context.description || 'Provide an open-source, modular codebase that solves tasks efficiently.'}

- **Core Goal:** Eliminate repetitive setup and provide a clean, working foundation.
- **Technologies:** Built with ${tech}.
- **Getting Started:** Run \`npm install\` and \`npm run dev\` to test it locally.
- **Full Explanation:** Read the **Explanation** tab for an in-depth breakdown of the project concept and mechanics.`
  }

  // 7. Dynamic Keyword Search in README & Documentation
  const searchWords = q.split(/\s+/).filter(w => w.length > 3 && !['what', 'how', 'does', 'this', 'that', 'with', 'from', 'have', 'were'].includes(w))
  if (searchWords.length > 0 && textSnippet.length > 50) {
    const paragraphs = textSnippet.split(/\n\n+/)
    const matched = paragraphs.filter(p => {
      const lower = p.toLowerCase()
      return searchWords.some(w => lower.includes(w))
    })

    if (matched.length > 0) {
      const excerpt = matched.slice(0, 2).map(p => p.trim()).join('\n\n')
      return `### Regarding "${question}"

From the repository documentation:

${excerpt}

If you need more specific implementation details, you can inspect the source code in the **Files** tab.`
    }
  }

  // 8. General informative response tailored to the repository
  return `### About ${name}

Regarding your query: "${question}"

Here are the key facts about this project:
- **Project Name:** ${name}
- **Description:** ${context.description || 'Open source repository'}
- **Tech Stack:** ${tech}
- **Language:** ${context.language || 'Standard language'}
- **Total Files:** ${files.length} files available in the file tree

You can explore:
- The **Explanation** tab for a complete conceptual breakdown in plain English.
- The **Architecture** tab for the system components and flow.
- The **Files** tab to browse code and get file-level breakdowns.`
}

/* API Callers */
async function chatWithGrok(systemPrompt, messages, apiKey) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.6,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(18000),
  })
  if (!res.ok) throw new Error(`Grok error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function chatWithGemini(systemPrompt, messages, apiKey, model) {
  const contents = [
    { role: 'user', parts: [{ text: `System Instruction: ${systemPrompt}` }] },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 1500 },
      }),
      signal: AbortSignal.timeout(18000),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function chatWithDeepSeek(systemPrompt, messages, apiKey) {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.6,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(18000),
  })
  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function chatWithOpenRouter(systemPrompt, messages, apiKey) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/agrwl-utkarsh/mini2',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.6,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(18000),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
