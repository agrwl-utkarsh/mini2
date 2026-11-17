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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return 'README content:\n\n' + readme.slice(0, 3000) + '\n\n(No GEMINI_API_KEY configured - showing raw README)'
  }

  const prompt = `Explain this GitHub repository's README in simple language for a beginner software engineer.
Focus on:
1. What this project does (in plain English)
2. Key features
3. How to use/install it (if mentioned)
4. Any important concepts a beginner should know

Keep it clear, friendly, and educational. Use simple language.

README:
${readme}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
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