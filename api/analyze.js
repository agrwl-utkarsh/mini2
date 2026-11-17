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
    const readme = await fetchReadme(owner, repo)
    const explanation = await explainReadme(readme)
    return res.status(200).json({ explanation })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

async function fetchReadme(owner, repo) {
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
  throw new Error('README not found in repo')
}

async function explainReadme(readme) {
  // Truncate very long READMEs to avoid token limits and copying
  const maxReadmeLength = 8000
  const truncatedReadme = readme.length > maxReadmeLength 
    ? readme.slice(0, maxReadmeLength) + '\n\n[README truncated for length...]'
    : readme

  const prompt = `You are a senior software engineer mentoring a junior developer. Your task is to explain this GitHub repository in a way that teaches them something new.

⚠️ CRITICAL RULES:
- DO NOT copy, quote, or paraphrase the README directly
- DO NOT output the README content in any form
- DO NOT use bullet points or numbered lists
- DO NOT summarize the README section-by-section
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

README to explain (do not copy from this):
${truncatedReadme}`

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
  return 'README content:\n\n' + readme.slice(0, 3000) + '\n\n(AI explanation unavailable' + debugInfo + ')'
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
      'X-Title': 'GitHub Repo Explainer',
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