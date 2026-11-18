// api/file.js
export default async function handler(req, res) {
  // Support POST for AI file explanation
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

  // GET: Fetch raw file content
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
  const truncatedContent = content.length > 5000 
    ? content.slice(0, 5000) + '\n\n[File truncated for analysis]'
    : content

  const prompt = `You are a Principal Software Engineer conducting a code walkthrough. Explain this file from the GitHub repository "${owner}/${repo}".

File Path: ${path}

File Content:
\`\`\`
${truncatedContent}
\`\`\`

Provide a crisp, professional breakdown in 3 concise sections:
1. **Purpose & Responsibility:** What does this file do and why does it exist in the project?
2. **Key Exports & Logic:** What functions, classes, components, or variables are exposed, and how do they work?
3. **Integration & Architecture:** How does this file interact with other parts of the repository?`

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
            generationConfig: { maxOutputTokens: 1000 }
          }),
          signal: AbortSignal.timeout(15000)
        }
      )
      if (res.ok) {
        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text
      }
    } catch (e) {
      console.warn('Gemini file explanation failed:', e.message)
    }
  }

  // Fallback intelligent summary
  const fileName = path.split('/').pop()
  const isConfig = /config|rc|json|ya?ml|env|lock/i.test(fileName)
  const isComponent = /jsx?|tsx?|vue|svelte/i.test(fileName) && /^[A-Z]/.test(fileName)
  const isApi = /api|route|controller|handler/i.test(path)
  const isTest = /test|spec/i.test(fileName)

  let roleDesc = 'Utility / core implementation module'
  if (isConfig) roleDesc = 'Configuration and environment manifest determining runtime or build behavior'
  else if (isComponent) roleDesc = 'User Interface component managing view presentation and localized UI interactions'
  else if (isApi) roleDesc = 'API route handler or backend controller managing incoming network requests'
  else if (isTest) roleDesc = 'Automated test suite verifying regression prevention and behavior contracts'

  return `### Purpose & Role of \`${fileName}\`
**${roleDesc}** in the \`${owner}/${repo}\` project.

- **Location:** Located at \`${path}\`.
- **Primary Functionality:** Encapsulates localized domain logic, schemas, or interface elements so the rest of the application can import and compose them cleanly.
- **Architectural Fit:** Serves as a modular building block, ensuring separation of concerns between state, logic, and configuration.`
}
