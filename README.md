# GitHub Repo Explainer

Paste a GitHub URL, get a beginner-friendly explanation of the repository using AI with automatic fallback.

## Quick Start

```bash
npm install
cp .env.example .env
# Add at least one API key
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables (add as many as you want — tried in order):
   - `GEMINI_API_KEY` — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - `DEEPSEEK_API_KEY` — from [platform.deepseek.com](https://platform.deepseek.com)
   - `OPENROUTER_API_KEY` — from [openrouter.ai/keys](https://openrouter.ai/keys) **(recommended — free models)**
   - `HUGGINGFACE_API_KEY` — from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
4. Deploy

**Fallback Logic:** Tries providers in order above. If one fails (quota, 404, 402, timeout), automatically tries the next. Shows raw README only if ALL fail.