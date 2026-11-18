// api/file.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, owner, repo, path, content = '', apiKeys = {} } = req.body || {}
    if (action === 'explain') {
      try {
        const explanation = await explainSingleFile(owner, repo, path, content, apiKeys)
        return res.status(200).json({ explanation })
      } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to explain file' })
      }
    }
    return res.status(400).json({ error: 'Unknown action' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { owner, repo, path, branch = 'main' } = req.query || {}
  if (!owner || !repo || !path) {
    return res.status(400).json({ error: 'owner, repo, and path are required' })
  }

  const branches = [branch, 'main', 'master']
  for (const b of branches) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${b}/${path}`
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (response.ok) {
        const text = await response.text()
        return res.status(200).json({ content: text, path, branch: b })
      }
    } catch {
      continue
    }
  }

  return res.status(404).json({ error: `File not found at ${path}` })
}

async function explainSingleFile(owner, repo, path, content, apiKeys = {}) {
  const truncatedContent = content.length > 4000 
    ? content.slice(0, 4000) + '\n\n[Content truncated]'
    : content

  const prompt = `You are a friendly software engineer explaining this code file to a teammate in plain, simple English without jargon or buzzwords.

File: ${path}
Repository: ${owner}/${repo}

Code:
\`\`\`
${truncatedContent}
\`\`\`

Explain in 3 simple paragraphs:
1. What this file does in everyday terms.
2. The main functions or components it provides.
3. How other parts of the project use it.`

  const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 800 }
          }),
          signal: AbortSignal.timeout(15000)
        }
      )
      if (res.ok) {
        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text
      }
    } catch (e) {
      console.warn('File explanation failed:', e.message)
    }
  }

  const fileName = path.split('/').pop()
  return `### What ${fileName} Does
This file handles a specific part of the application at **${path}**.

In simple terms, it groups together related logic so that the rest of the application can stay clean and organized. Instead of putting all the code in one giant file, this file takes care of its own specific task and shares the results when other files need it.`
}
