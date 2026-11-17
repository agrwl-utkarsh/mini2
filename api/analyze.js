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
  const prompt = `Explain this GitHub repository's README in simple language for a beginner software engineer.
Focus on:
1. What this project does (in plain English)
2. Key features
3. How to use/install it (if mentioned)
4. Any important concepts a beginner should know

Keep it clear, friendly, and educational. Use simple language.

README:
${readme}`

  const errors = []

  // 1. Try Gemini (multiple models)
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const geminiModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
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

  // 2. Try DeepSeek
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    try {
      return await callDeepSeek(prompt, deepseekKey)
    } catch (err) {
      errors.push(`DeepSeek: ${err.message}`)
      console.warn('DeepSeek failed:', err.message)
    }
  }

  // 3. Try OpenRouter (free models)
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const openRouterModels = [
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
      'meta-llama/llama-3.1-70b-instruct:free',
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

  // 4. Try Hugging Face Inference API (free)
  const hfKey = process.env.HUGGINGFACE_API_KEY
  if (hfKey) {
    const hfModels = [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'google/gemma-2-9b-it',
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

  // All providers failed - show raw README with error summary
  const errorSummary = errors.length > 0
    ? `\n\n---\nAI providers unavailable:\n${errors.map(e => `• ${e}`).join('\n')}\nShowing raw README instead.`
    : '\n\n(No AI API keys configured - showing raw README)'

  return 'README content:\n\n' + readme.slice(0, 3000) + errorSummary
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
  // HF returns array of { generated_text: "..." }
  return data?.[0]?.generated_text || 'No explanation generated'
}