export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body
  if (!url) {
    return res.status(400).json({ error: 'url required' })
  }

  let owner, repo
  try {
    const cleanUrl = url.replace(/\/$/, '')
    const parts = cleanUrl.split('/')
    owner = parts[parts.length - 2]
    repo = parts[parts.length - 1]
    if (!owner || !repo) throw new Error()
  } catch {
    return res.status(400).json({ error: 'Invalid GitHub URL' })
  }

  try {
    const repository = await fetchRepository(owner, repo)
    const [explanation, architecture] = await Promise.all([
      explainRepository(repository),
      generateArchitecture(repository)
    ])
    return res.status(200).json({ explanation, architecture })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function fetchRepository(owner, repo) {
  const paths = ['README.md', 'README.txt', 'README.rst', 'readme.md']
  const branches = ['main', 'master']

  for (const branch of branches) {
    for (const path of paths) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      try {
        const response = await fetch(url, { timeout: 10000 })
        if (response.ok) {
          return await response.text()
        }
      } catch {
        continue
      }
    }
  }
  throw new Error('Repository content not found')
}

async function explainRepository(repository) {
  // Truncate very long repository content to avoid token limits and copying
  const maxRepositoryLength = 8000
  const truncatedRepository = repository.length > maxRepositoryLength 
    ? repository.slice(0, maxRepositoryLength) + '\n\n[Repository content truncated for length...]'
    : repository

  const prompt = `You are a senior software engineer mentoring a junior developer. Your task is to explain this GitHub repository in a way that teaches them something new.

⚠️ CRITICAL RULES:
- DO NOT copy, quote, or paraphrase the repository content directly
- DO NOT output the repository content in any form
- DO NOT use bullet points or numbered lists
- DO NOT summarize the repository section-by-section
- Write ONLY in flowing, natural PARAGRAPHS (minimum 5-6 paragraphs)
- Explain concepts in YOUR OWN WORDS as if teaching face-to-face

What to cover (weave naturally into paragraphs):

1. **What problem this solves** - Start with the "why". What frustration or need led to this project? Paint a picture of the before/after.

2. **How it works conceptually** - Explain the core idea without technical jargon. Use analogies. "Think of it like..." 

3. **Key capabilities** - What can someone actually DO with this? Why would they choose it over alternatives?

4. **Getting started** - If there's setup involved, walk through it like you're sitting next to them. What do they need first?

5. **Important concepts explained** - Any technical terms (API, framework, library, deployment, etc.) - define them simply when they come up.

6. **Why it matters** - Real-world impact. Who uses this? What projects is it good for?

Style: Conversational, encouraging, like a code review with a junior dev. Use "you" and "we". Avoid academic tone.

❌ BAD EXAMPLE (what NOT to do):
"This project is a React library for state management. It has features like... Installation: npm install... It uses React Context..."

✅ GOOD EXAMPLE (what TO do):
"Imagine you're building a React app and you keep passing props down three levels just to share a simple toggle state. Frustrating, right? That's exactly the problem this library solves. Instead of threading props through every component, you wrap your app in a provider once, and any component can read or update the state directly. It's like having a shared whiteboard in the room instead of passing notes through intermediaries. The core idea uses React Context under the hood — that's React's built-in way to share data without props — but this library handles all the boilerplate so you don't have to. You'd use this when your app has several components that need the same data, like a theme toggle, user authentication status, or a shopping cart. Getting started takes two minutes: install it, wrap your root component, and you're off. No complex configuration needed unless you want it."

Repository content to explain (do not copy from this):
${truncatedRepository}`

  const errors = []
  const detectedKeys = []

  // Debug: Check which keys are present
  if (process.env.GROK_API_KEY) detectedKeys.push('GROK')
  if (process.env.GEMINI_API_KEY) detectedKeys.push('GEMINI')
  if (process.env.DEEPSEEK_API_KEY) detectedKeys.push('DEEPSEEK')
  if (process.env.OPENROUTER_API_KEY) detectedKeys.push('OPENROUTER')
  if (process.env.HUGGINGFACE_API_KEY) detectedKeys.push('HUGGINGFACE')
  
  console.log('Detected API keys:', detectedKeys.join(', ') || 'NONE')

  // 1. Try Grok (xAI) - if key exists
  const grokKey = process.env.GROK_API_KEY
  if (grokKey) {
    try {
      return await callGrok(prompt, grokKey)
    } catch (err) {
      errors.push(`Grok: ${err.message}`)
      console.warn('Grok failed:', err.message)
    }
  }

  // 2. Try Gemini (current v1beta model names)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const geminiModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ]
    for (const model of geminiModels) {
      try {
        return await callGemini(prompt, geminiKey, model)
      } catch (err) {
        errors.push(`Gemini (${model}): ${err.message}`)
        console.warn(`Gemini model ${model} failed:`, err.message)
      }
    }
  }

  // 3. Try DeepSeek
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    try {
      return await callDeepSeek(prompt, deepseekKey)
    } catch (err) {
      errors.push(`DeepSeek: ${err.message}`)
      console.warn('DeepSeek failed:', err.message)
    }
  }

  // 4. Try OpenRouter (many models - free + cheap)
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const openRouterModels = [
      // Current free models (check openrouter.ai/models for latest)
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-2-2b-it:free',
      'qwen/qwen-2.5-1.5b-instruct:free',
      'meta-llama/llama-3.2-1b-instruct:free',
      // Very cheap models (often < $0.10/1M tokens)
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mistral-7b-instruct',
      'google/gemma-2-9b-it',
      'meta-llama/llama-3.1-70b-instruct',
      'microsoft/phi-3-mini-128k-instruct',
      'qwen/qwen-2.5-7b-instruct',
      'huggingfaceh4/zephyr-7b-beta',
      'openchat/openchat-7b',
      'nousresearch/nous-hermes-2-mistral-7b-dpo',
    ]
    for (const model of openRouterModels) {
      try {
        return await callOpenRouter(prompt, openRouterKey, model)
      } catch (err) {
        errors.push(`OpenRouter (${model}): ${err.message}`)
        console.warn(`OpenRouter model ${model} failed:`, err.message)
      }
    }
  }

  // 5. Try Hugging Face
  const hfKey = process.env.HUGGINGFACE_API_KEY
  if (hfKey) {
    const hfModels = [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'microsoft/Phi-3-mini-128k-instruct',
      'google/gemma-2-9b-it',
      'mistralai/Mistral-7B-Instruct-v0.3',
    ]
    for (const model of hfModels) {
      try {
        return await callHuggingFace(prompt, hfKey, model)
      } catch (err) {
        errors.push(`HuggingFace (${model}): ${err.message}`)
        console.warn(`HuggingFace model ${model} failed:`, err.message)
      }
    }
  }

  // All providers failed - return debug info
  const debugInfo = `\n\n---\nDEBUG: Detected keys: ${detectedKeys.join(', ') || 'NONE'}\nErrors:\n${errors.map(e => `• ${e}`).join('\n') || '• No providers attempted (no keys detected)'}`
  return 'Repository content:\n\n' + repository.slice(0, 3000) + '\n\n(AI explanation unavailable' + debugInfo + ')'
}

async function generateArchitecture(repository) {
  const maxLength = 6000
  const truncated = repository.length > maxLength 
    ? repository.slice(0, maxLength) + '\n\n[Content truncated...]'
    : repository

  const prompt = `Analyze this repository and generate a flowchart architecture diagram. Return ONLY a JSON object with "nodes" and "edges" arrays.

Node types: "start", "process", "decision", "end", "database", "api", "service", "ui"
Each node: { id, type, position: {x, y}, data: { label, description? } }
Each edge: { id, source, target, label?, animated? }

Rules:
- 8-15 nodes max
- Logical flow: start → processes → decisions → ends
- Include: entry points, core services, data stores, external APIs, UI components
- Position nodes in a top-down or left-right flow
- Use x: 100-700, y: 50-500

Example:
{
  "nodes": [
    {"id": "1", "type": "start", "position": {"x": 400, "y": 50}, "data": {"label": "User Request"}},
    {"id": "2", "type": "api", "position": {"x": 400, "y": 150}, "data": {"label": "API Gateway"}},
    {"id": "3", "type": "service", "position": {"x": 200, "y": 250}, "data": {"label": "Auth Service"}},
    {"id": "4", "type": "service", "position": {"x": 600, "y": 250}, "data": {"label": "Data Service"}},
    {"id": "5", "type": "database", "position": {"x": 600, "y": 350}, "data": {"label": "Database"}},
    {"id": "6", "type": "end", "position": {"x": 400, "y": 450}, "data": {"label": "Response"}}
  ],
  "edges": [
    {"id": "e1", "source": "1", "target": "2"},
    {"id": "e2", "source": "2", "target": "3"},
    {"id": "e3", "source": "2", "target": "4"},
    {"id": "e4", "source": "4", "target": "5"},
    {"id": "e5", "source": "3", "target": "6"},
    {"id": "e6", "source": "4", "target": "6"}
  ]
}

Repository to analyze:
${truncated}`

  // Try to get architecture from any available provider
  const providers = [
    { key: 'GROK_API_KEY', caller: callGrok },
    { key: 'GEMINI_API_KEY', caller: callGemini },
    { key: 'DEEPSEEK_API_KEY', caller: callDeepSeek },
    { key: 'OPENROUTER_API_KEY', caller: callOpenRouter },
    { key: 'HUGGINGFACE_API_KEY', caller: callHuggingFace },
  ]

  for (const { key, caller } of providers) {
    const apiKey = process.env[key]
    if (!apiKey) continue
    try {
      const result = await caller(prompt, apiKey, key === 'GEMINI_API_KEY' ? 'gemini-1.5-flash-latest' : undefined)
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim())
      if (parsed.nodes && parsed.edges) return parsed
    } catch (err) {
      console.warn(`Architecture generation failed (${key}):`, err.message)
    }
  }

  // Fallback: generate basic structure from repo name/keywords
  return generateFallbackArchitecture(repository)
}

function generateFallbackArchitecture(repository) {
  const lower = repository.toLowerCase()
  const nodes = []
  const edges = []
  let nodeId = 1
  let edgeId = 1

  const addNode = (type, label, x, y, description) => {
    nodes.push({ id: String(nodeId), type, position: { x, y }, data: { label, description } })
    return nodeId++
  }
  const addEdge = (source, target, label) => {
    edges.push({ id: `e${edgeId++}`, source: String(source), target: String(target), label })
  }

  const startId = addNode('start', 'Entry Point', 400, 50)
  
  // Detect common patterns
  const hasApi = lower.includes('api') || lower.includes('rest') || lower.includes('graphql') || lower.includes('endpoint')
  const hasAuth = lower.includes('auth') || lower.includes('login') || lower.includes('jwt') || lower.includes('oauth')
  const hasDb = lower.includes('database') || lower.includes('db') || lower.includes('sql') || lower.includes('mongodb') || lower.includes('postgres') || lower.includes('redis')
  const hasQueue = lower.includes('queue') || lower.includes('kafka') || lower.includes('rabbitmq') || lower.includes('message')
  const hasCache = lower.includes('cache') || lower.includes('redis') || lower.includes('memcached')
  const hasFrontend = lower.includes('react') || lower.includes('vue') || lower.includes('frontend') || lower.includes('ui') || lower.includes('component')
  const hasWorker = lower.includes('worker') || lower.includes('background') || lower.includes('job') || lower.includes('cron')
  const hasStorage = lower.includes('storage') || lower.includes('s3') || lower.includes('bucket') || lower.includes('file')
  const hasML = lower.includes('ml') || lower.includes('model') || lower.includes('inference') || lower.includes('tensorflow') || lower.includes('pytorch')

  let currentY = 150
  const serviceIds = []

  if (hasApi) {
    const apiId = addNode('api', 'API Gateway', 400, currentY)
    addEdge(startId, apiId)
    serviceIds.push(apiId)
    currentY += 100
  } else {
    serviceIds.push(startId)
  }

  // Core services
  if (hasAuth) {
    const authId = addNode('service', 'Auth Service', 200, currentY, 'Authentication & authorization')
    serviceIds.forEach(s => addEdge(s, authId))
    serviceIds.push(authId)
  }

  if (hasFrontend) {
    const uiId = addNode('ui', 'Frontend/UI', 600, currentY, 'User interface components')
    serviceIds.forEach(s => addEdge(s, uiId))
    serviceIds.push(uiId)
  }

  // Data layer
  if (hasDb) {
    const dbId = addNode('database', 'Database', 400, currentY + 100, 'Primary data store')
    serviceIds.forEach(s => addEdge(s, dbId))
    serviceIds.push(dbId)
  }

  if (hasCache) {
    const cacheId = addNode('database', 'Cache', 200, currentY + 100, 'Caching layer')
    serviceIds.forEach(s => addEdge(s, cacheId))
  }

  if (hasQueue) {
    const queueId = addNode('service', 'Message Queue', 600, currentY + 100, 'Async message processing')
    serviceIds.forEach(s => addEdge(s, queueId))
  }

  if (hasStorage) {
    const storageId = addNode('database', 'File Storage', 200, currentY + 200, 'Object/file storage')
    serviceIds.forEach(s => addEdge(s, storageId))
  }

  if (hasWorker) {
    const workerId = addNode('service', 'Background Workers', 600, currentY + 200, 'Async job processing')
    serviceIds.forEach(s => addEdge(s, workerId))
  }

  if (hasML) {
    const mlId = addNode('service', 'ML Inference', 400, currentY + 200, 'Model serving & inference')
    serviceIds.forEach(s => addEdge(s, mlId))
  }

  // End node
  const endId = addNode('end', 'Response/Output', 400, currentY + 300)
  serviceIds.slice(-3).forEach(s => addEdge(s, endId))

  return { nodes, edges }
}

async function callGrok(prompt, apiKey) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: 'You are a senior engineer mentoring a junior developer. Explain repositories in your own words using conversational paragraphs. Never copy or summarize the README directly.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Grok API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No explanation generated'
}

async function callGemini(prompt, apiKey, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation generated'
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
      messages: [
        { role: 'system', content: 'You are a senior engineer mentoring a junior developer. Explain repositories in your own words using conversational paragraphs. Never copy or summarize the README directly.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No explanation generated'
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
      messages: [
        { role: 'system', content: 'You are a senior engineer mentoring a junior developer. Explain repositories in your own words using conversational paragraphs. Never copy or summarize the README directly.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No explanation generated'
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
      parameters: { temperature: 0.7, max_new_tokens: 3000, return_full_text: false },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`HuggingFace API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data?.[0]?.generated_text || 'No explanation generated'
}