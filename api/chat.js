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
  const repoName = repoContext.name || 'this repository'
  const techStack = Array.isArray(repoContext.techStack) 
    ? repoContext.techStack.map(t => t.name || t).join(', ') 
    : (repoContext.techStack || 'Standard web stack')

  const keys = {
    grok: apiKeys.grok || req.headers['x-grok-key'] || process.env.GROK_API_KEY,
    gemini: apiKeys.gemini || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY,
    deepseek: apiKeys.deepseek || req.headers['x-deepseek-key'] || process.env.DEEPSEEK_API_KEY,
    openrouter: apiKeys.openrouter || req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY,
  }

  const systemPrompt = `You are a helpful software engineer answering questions about the repository "${repoName}".
Description: ${repoContext.description || 'Open source software'}
Tech Stack: ${techStack}

README:
${(repoContext.readmeSnippet || '').slice(0, 3500)}

Guidelines:
- Explain things in clear, plain English that is easy to understand.
- Avoid unnecessary jargon or corporate buzzwords.
- Keep answers practical, focused, and direct.
- Do not use childish emojis.
- Provide clean code snippets when demonstrating commands or functions.`

  const conversation = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))

  if (keys.grok) {
    try {
      const reply = await chatWithGrok(systemPrompt, conversation, keys.grok)
      return res.status(200).json({ message: reply, provider: 'Grok' })
    } catch (e) {
      console.warn('Chat Grok failed:', e.message)
    }
  }

  if (keys.gemini) {
    const geminiModels = ['gemini-1.5-flash-latest', 'gemini-1.5-flash']
    for (const model of geminiModels) {
      try {
        const reply = await chatWithGemini(systemPrompt, conversation, keys.gemini, model)
        return res.status(200).json({ message: reply, provider: 'Gemini' })
      } catch (e) {
        console.warn(`Chat Gemini failed:`, e.message)
      }
    }
  }

  if (keys.deepseek) {
    try {
      const reply = await chatWithDeepSeek(systemPrompt, conversation, keys.deepseek)
      return res.status(200).json({ message: reply, provider: 'DeepSeek' })
    } catch (e) {
      console.warn('Chat DeepSeek failed:', e.message)
    }
  }

  if (keys.openrouter) {
    try {
      const reply = await chatWithOpenRouter(systemPrompt, conversation, keys.openrouter)
      return res.status(200).json({ message: reply, provider: 'OpenRouter' })
    } catch (e) {
      console.warn('Chat OpenRouter failed:', e.message)
    }
  }

  const fallbackReply = generateCleanFallbackReply(userQuestion, repoContext)
  return res.status(200).json({
    message: fallbackReply,
    provider: 'Assistant'
  })
}

function generateCleanFallbackReply(question, context) {
  const q = question.toLowerCase()
  const name = context.name || 'this repository'
  const tech = Array.isArray(context.techStack) ? context.techStack.map(t => t.name).join(', ') : 'standard web tools'

  if (q.includes('run') || q.includes('start') || q.includes('install') || q.includes('setup')) {
    return `### How to Run ${name} Locally

1. Clone the repository:
\`\`\`bash
git clone ${context.htmlUrl || `https://github.com/${name}`}.git
cd ${context.repo || 'repository'}
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Make sure you have Node.js installed on your computer before running these commands.`
  }

  if (q.includes('tech') || q.includes('stack') || q.includes('language') || q.includes('framework')) {
    return `### Technologies Used in ${name}

- Primary Language: ${context.language || 'JavaScript/TypeScript'}
- Detected Stack: ${tech}
- Architecture: Modular component-based structure

You can explore the Architecture tab to see how these parts connect to each other.`
  }

  if (q.includes('architecture') || q.includes('flow') || q.includes('how it works')) {
    return `### How ${name} Is Structured

1. User Interface: Handles user input and displays visual screens.
2. API & Routing: Validates incoming requests and routes them to the right handler.
3. Core Logic: Runs the application logic and processes information.
4. Data Storage: Saves and retrieves records from the database or storage layer.

Switch to the Architecture tab to view the visual layout.`
  }

  return `### Regarding your question about "${question}"

In ${name}:
- Purpose: ${context.description || 'Application codebase'}
- Stack: ${tech}

You can browse specific files in the Code Explorer tab or review the full summary in the Explanation tab.`
}

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
