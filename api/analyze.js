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
  const prompt = `You are a senior software engineer teaching a complete beginner. Explain this GitHub repository in a way that someone with basic coding knowledge can understand.

Write a comprehensive explanation in PARAGRAPHS (not bullet points). Do NOT copy or summarize the README directly. Instead, explain the concepts in your own words as if you're teaching someone.

Cover these topics thoroughly:

1. **What this project actually does** - Explain the problem it solves in plain English. Use analogies if helpful. What would a user see/experience?

2. **How it works (high-level)** - Explain the core idea/architecture simply. What are the main components? How do they talk to each other?

3. **Key features** - What can it do? Why would someone use it? Explain each major feature in simple terms.

4. **How to use/install it** - If the README mentions installation, explain the steps in beginner-friendly language. What prerequisites are needed?

5. **Important concepts a beginner should know** - Are there technical terms, patterns, or technologies mentioned (like "React", "API", "Docker", "CI/CD", "WebSocket", etc.)? Explain each one simply.

6. **Why this project matters** - What's the real-world use case? Who would benefit from it?

Writing style:
- Use complete sentences and paragraphs
- Friendly, conversational tone
- Define technical terms when first used
- Avoid jargon where possible; if needed, explain it
- Imagine you're explaining to a junior developer over coffee
- Minimum 4-5 substantial paragraphs

README to explain:
${readme}`

  // 1. Try Gemini (correct model names for v1beta)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const geminiModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
    ]
    for (const model of geminiModels) {
      try {
        return await callGemini(prompt, geminiKey, model)
      } catch (err) {
        console.warn(`Gemini model ${model} failed:`, err.message)
      }
    }
  }

  // 2. Try DeepSeek
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    try {
      return await callDeepSeek(prompt, deepseekKey)
    } catch (err) {
      console.warn('DeepSeek failed:', err.message)
    }
  }

  // 3. Try OpenRouter (current working free models)
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const openRouterModels = [
      'meta-llama/llama-3.2-3b-instruct:free',
      'meta-llama/llama-3.2-1b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'google/gemma-2-2b-it:free',
      'qwen/qwen-2.5-7b-instruct:free',
    ]
    for (const model of openRouterModels) {
      try {
        return await callOpenRouter(prompt, openRouterKey, model)
      } catch (err) {
        console.warn(`OpenRouter model ${model} failed:`, err.message)
      }
    }
  }

  // 4. Try Hugging Face Inference API (free)
  const hfKey = process.env.HUGGINGFACE_API_KEY
  if (hfKey) {
    const hfModels = [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'microsoft/Phi-3-mini-128k-instruct',
      'google/gemma-2-2b-it',
    ]
    for (const model of hfModels) {
      try {
        return await callHuggingFace(prompt, hfKey, model)
      } catch (err) {
        console.warn(`HuggingFace model ${model} failed:`, err.message)
      }
    }
  }

  // All providers failed - show clean raw README (no error dump)
  return 'README content:\n\n' + readme.slice(0, 3000) + '\n\n(AI explanation unavailable - showing raw README)'
}

async function callGemini(prompt, apiKey, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
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
        { role: 'system', content: 'You are a helpful teacher who explains code to beginners in simple language.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
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
        { role: 'system', content: 'You are a helpful teacher who explains code to beginners in simple language.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
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
      parameters: { temperature: 0.3, max_new_tokens: 2000, return_full_text: false },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`HuggingFace API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data?.[0]?.generated_text || 'No explanation generated'
}