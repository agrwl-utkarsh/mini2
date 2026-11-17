# GitHub Repo Explainer

Paste a GitHub URL, get a beginner-friendly explanation of the repository using AI (Gemini → DeepSeek fallback).

## Quick Start

```bash
npm install
cp .env.example .env
# Add your API keys (at least one required)
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `GEMINI_API_KEY` (primary) — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - `DEEPSEEK_API_KEY` (fallback) — from [platform.deepseek.com](https://platform.deepseek.com)
4. Deploy

**Logic:** Tries Gemini first. If it fails or isn't set, automatically falls back to DeepSeek.