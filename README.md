# RepoSense

AI-powered codebase understanding platform. Enter a GitHub URL, get an interactive map of the repository with AI explanations and chat assistant.

## Features

- **Repository Analysis** - Clone, scan, detect languages/frameworks
- **File Explorer** - Interactive tree view with syntax highlighting
- **Code Explainer** - AI-powered file summaries, functions, classes, imports
- **Chat Assistant** - Ask questions about the codebase with file references
- **Modern UI** - Dark theme, resizable panels, premium feel

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Python + FastAPI + GitPython
- **AI**: Groq API (LLaMA 3.3 70B, with automatic keyword fallback)
- **Deployment**: Vercel (frontend) + Railway/Render (backend)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # Production build
```

### Backend
```bash
cd backend
cp .env.example .env
# Add GROQ_API_KEY to .env (optional)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker (Both)
```bash
docker-compose up --build
```

## Project Structure

```
RepoSense/
├── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # LandingPage, AnalysisPage
│   │   ├── hooks/         # TanStack Query hooks
│   │   ├── services/      # API client
│   │   ├── context/       # React Context state
│   │   ├── types/         # TypeScript types
│   │   └── mocks/         # MSW mock handlers
│   ├── vercel.json        # Vercel config
│   └── package.json
│
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/routes/    # REST endpoints
│   │   ├── services/      # Git, Scanner, Analyzer, AI
│   │   ├── models/        # Pydantic schemas
│   │   └── config.py      # Settings
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml     # Local development
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/repo/analyze` | Analyze GitHub repo |
| `GET` | `/api/repo/{id}/status` | Check status |
| `GET` | `/api/repo/{id}/structure` | File tree |
| `GET` | `/api/repo/{id}/stats` | Statistics |
| `GET` | `/api/repo/{id}/files/{path}` | File content |
| `POST` | `/api/repo/{id}/explain` | Explain file |
| `POST` | `/api/repo/{id}/chat` | Chat with repo |
| `DELETE` | `/api/repo/{id}` | Cleanup |

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import in Vercel
3. Set `VITE_API_URL` = backend URL
4. Deploy

### Backend → Railway/Render/Fly.io
1. Push `backend/` to GitHub
2. Create new service
3. Set `GEMINI_API_KEY` env var
4. Deploy

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

### Backend (.env)
```
GROQ_API_KEY=your_key_here          # Optional (Groq LLaMA 3.3 70B)
CORS_ORIGINS_STR=http://localhost:5173,http://localhost:3000
```

## Screenshots

*Landing Page* → *Analysis Dashboard* → *File Explorer + Code View* → *AI Explainer* → *Chat Assistant*

## License

MIT - College Mini Project