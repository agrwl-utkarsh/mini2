# RepoSense Backend

FastAPI backend for AI-powered codebase understanding.

## Quick Start

```bash
cd backend
cp .env.example .env
# Edit .env to add GEMINI_API_KEY (optional)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/repo/analyze` | Start analyzing a GitHub repo |
| `GET` | `/api/repo/{id}/status` | Check analysis status |
| `GET` | `/api/repo/{id}/structure` | Get file tree |
| `GET` | `/api/repo/{id}/stats` | Get repository statistics |
| `GET` | `/api/repo/{id}/files/{path}` | Get file content |
| `POST` | `/api/repo/{id}/explain` | Explain a file |
| `POST` | `/api/repo/{id}/chat` | Ask questions about repo |
| `DELETE` | `/api/repo/{id}` | Cleanup repository |

## Example Usage

```bash
# 1. Analyze a repo
curl -X POST http://localhost:8000/api/repo/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/fastapi/fastapi"}'

# 2. Poll status
curl http://localhost:8000/api/repo/{repo_id}/status

# 3. Get file tree
curl http://localhost:8000/api/repo/{repo_id}/structure

# 4. Get file content
curl http://localhost:8000/api/repo/{repo_id}/files/main.py

# 5. Explain a file
curl -X POST http://localhost:8000/api/repo/{repo_id}/explain \
  -H "Content-Type: application/json" \
  -d '{"file_path": "main.py"}'

# 6. Ask a question
curl -X POST http://localhost:8000/api/repo/{repo_id}/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How does routing work?", "repo_id": "{repo_id}"}'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | - | Google AI API key (optional) |
| `REPO_BASE_PATH` | `/tmp/reposense` | Where to clone repos |
| `MAX_REPO_SIZE_MB` | `500` | Max repo size |
| `CORS_ORIGINS` | `http://localhost:5173` | Frontend URLs |

## Features

- **Git cloning** with GitPython (shallow clone for speed)
- **Repository scanning** - detects languages, frameworks, counts files
- **Code analysis** - extracts functions, classes, imports (Python, JS/TS)
- **AI explanations** - Gemini API with fallback keyword search
- **Security** - path traversal protection, size limits

## Demo Mode

Without `GEMINI_API_KEY`, the chat uses a keyword-based fallback that:
- Searches file contents for question keywords
- Returns relevant file snippets
- Clearly labeled as "fallback" mode