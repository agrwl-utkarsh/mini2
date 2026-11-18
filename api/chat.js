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
    : (repoContext.techStack || 'Standard software stack')

  const keys = {
    grok: apiKeys.grok || req.headers['x-grok-key'] || process.env.GROK_API_KEY,
    gemini: apiKeys.gemini || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY,
    deepseek: apiKeys.deepseek || req.headers['x-deepseek-key'] || process.env.DEEPSEEK_API_KEY,
    openrouter: apiKeys.openrouter || req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY,
    huggingface: apiKeys.huggingface || req.headers['x-huggingface-key'] || process.env.HUGGINGFACE_API_KEY,
  }

  const systemPrompt = `You are an expert Senior Staff Software Engineer and architect mentoring a developer about the repository "${repoName}".
Repository Description: ${repoContext.description || 'Open source software'}
Detected Tech Stack: ${techStack}
Key Highlights:
${(repoContext.highlights || []).map(h => `- ${h}`).join('\n')}

README Excerpt:
${(repoContext.readmeSnippet || '').slice(0, 4000)}

Instructions:
- Provide clear, direct, and actionable answers.
- Use code blocks with language indicators when showing code or commands.
- If the question asks about architecture, setup, dependencies, or debugging, give concrete guidance based on this repository.
- Keep tone professional, encouraging, and technically precise.`

  const conversation = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }))

  // 1. Try Grok
  if (keys.grok) {
    try {
      const reply = await chatWithGrok(systemPrompt, conversation, keys.grok)
      return res.status(200).json({ message: reply, provider: 'Grok' })
    } catch (e) {
      console.warn('Chat Grok failed:', e.message)
    }
  }

  // 2. Try Gemini
  if (keys.gemini) {
    const geminiModels = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash-exp']
    for (const model of geminiModels) {
      try {
        const reply = await chatWithGemini(systemPrompt, conversation, keys.gemini, model)
        return res.status(200).json({ message: reply, provider: `Gemini (${model})` })
      } catch (e) {
        console.warn(`Chat Gemini ${model} failed:`, e.message)
      }
    }
  }

  // 3. Try DeepSeek
  if (keys.deepseek) {
    try {
      const reply = await chatWithDeepSeek(systemPrompt, conversation, keys.deepseek)
      return res.status(200).json({ message: reply, provider: 'DeepSeek' })
    } catch (e) {
      console.warn('Chat DeepSeek failed:', e.message)
    }
  }

  // 4. Try OpenRouter
  if (keys.openrouter) {
    try {
      const reply = await chatWithOpenRouter(systemPrompt, conversation, keys.openrouter)
      return res.status(200).json({ message: reply, provider: 'OpenRouter' })
    } catch (e) {
      console.warn('Chat OpenRouter failed:', e.message)
    }
  }

  // Intelligent Contextual Fallback
  const fallbackReply = generateFallbackChatReply(userQuestion, repoContext)
  return res.status(200).json({
    message: fallbackReply,
    provider: 'Built-in Repository Intelligence (Offline)'
  })
}

function generateFallbackChatReply(question, context) {
  const q = question.toLowerCase()
  const name = context.name || 'this repository'
  const tech = Array.isArray(context.techStack) ? context.techStack.map(t => t.name).join(', ') : 'modern tech'
  const readme = (context.readmeSnippet || '').toLowerCase()

  if (q.includes('run') || q.includes('start') || q.includes('install') || q.includes('setup')) {
    return `### How to Run & Set Up **${name}**

1. **Clone the repository:**
\`\`\`bash
git clone ${context.htmlUrl || `https://github.com/${name}`}.git
cd ${context.repo || 'repo'}
\`\`\`

2. **Install dependencies:**
\`\`\`bash
npm install # or pip install -r requirements.txt / cargo build
\`\`\`

3. **Configure environment:**
Check for an \`.env.example\` or configuration file in the root directory. Copy it to \`.env\` and supply required keys.

4. **Launch development server:**
\`\`\`bash
npm run dev
\`\`\`
Check the **Code Explorer** tab for specific configuration scripts and entry points!`
  }

  if (q.includes('tech') || q.includes('stack') || q.includes('language') || q.includes('framework')) {
    return `### Tech Stack Overview for **${name}**

This project utilizes:
- **Core Technologies:** ${tech}
- **Primary Language:** ${context.language || 'JavaScript/TypeScript'}
- **Architecture Style:** Component-driven, modular layered architecture.

You can inspect the interactive component diagram in the **Architecture Flow** tab to see how these technologies interface!`
  }

  if (q.includes('architecture') || q.includes('flow') || q.includes('how it works') || q.includes('design')) {
    return `### Architecture & Data Flow in **${name}**

- **Entry Point & Presentation:** Handles client requests, user inputs, and routing.
- **Service & Domain Layer:** Orchestrates business logic, transforms payloads, and enforces application rules.
- **Persistence & External Integrations:** Interfaces with databases, cloud APIs, and storage subsystems.

Switch to the **Architecture Flow** tab to interactively explore, drag, and customize the node-by-node architecture diagram!`
  }

  if (q.includes('test') || q.includes('test runner')) {
    return `### Running Tests for **${name}**

Most projects configured with this stack run tests via standard scripts:
\`\`\`bash
npm test
# or with coverage
npm run test:coverage
\`\`\`
Check \`package.json\` or the project root in the **Code Explorer** tab to inspect available test scripts.`
  }

  // General helpful response
  return `### Response for **${name}**

Regarding your query about *"${question}"*:

Based on the repository analysis:
- **Project Purpose:** ${context.description || 'Modular open-source framework'}
- **Detected Stack:** ${tech}
- **Pointers:**
  1. Inspect the **Code Explanation** tab for an in-depth conceptual breakdown.
  2. Explore the **Architecture Flow** tab for the structural blueprint.
  3. Browse specific files in the **Code Explorer** tab.

*(Tip: You can add an API key in the settings drawer to enable live generative Q&A across the entire codebase!)*`
}

/* Callers */
async function chatWithGrok(systemPrompt, messages, apiKey) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
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
      temperature: 0.7,
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
      temperature: 0.7,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(18000),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
