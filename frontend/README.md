# RepoSense Frontend

AI-powered codebase understanding platform - Frontend built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 **Premium Dark Theme** - Navy background with cyan/blue accents
- 📁 **Interactive File Explorer** - Tree view with search, filtering, and expand/collapse
- 💻 **Code Viewer** - Syntax highlighting via Shiki (GitHub Dark theme)
- 🤖 **AI Code Explainer** - Tabbed interface for summary, functions, classes, imports
- 💬 **Chat Assistant** - Ask questions about the repository with file references
- 📊 **Dashboard** - Repository stats, language breakdown, framework detection
- 🔧 **Resizable Panels** - Drag to resize explorer, content, and explainer panels
- ⚡ **Mock API** - MSW-powered development without backend

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v3 (custom dark theme)
- **Routing**: React Router v7
- **State**: React Context + TanStack Query
- **Syntax Highlighting**: Shiki (WASM)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Mocking**: MSW (Mock Service Worker)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173` with MSW mocking enabled.

### Building

```bash
npm run build
```

Outputs to `dist/` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (Button, Input, Card, etc.)
│   ├── landing/         # Landing page components
│   ├── dashboard/       # Dashboard stats and charts
│   ├── explorer/        # File tree and code viewer
│   ├── explainer/       # Code explanation panel
│   └── assistant/       # Chat assistant panel
├── pages/
│   ├── LandingPage.tsx  # URL input and marketing
│   └── AnalysisPage.tsx # Main analysis dashboard
├── hooks/
│   └── useRepo.ts       # TanStack Query hooks for API
├── services/
│   └── api.ts           # API client and validation
├── context/
│   └── RepoContext.tsx  # Global repository state
├── types/
│   └── index.ts         # TypeScript types
├── mocks/
│   ├── data.ts          # Mock repository data
│   ├── handlers.ts      # MSW request handlers
│   └── browser.ts       # MSW worker setup
└── utils/
    └── cn.ts            # Class name utility
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:8000/api
```

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variable: `VITE_API_URL` = your backend URL
5. Deploy

The `vercel.json` handles SPA routing automatically.

## Mock Data

The frontend includes comprehensive mock data for development:
- React repository structure (2847 files, 423 folders)
- Sample file content with syntax highlighting
- Code explanations with functions, classes, imports
- Chat responses with file references

MSW intercepts API calls and returns mock data, allowing full frontend development without a backend.

## Customization

### Theme Colors

Edit `tailwind.config.js` to customize the color palette:

```js
colors: {
  navy: { ... },
  cyan: { ... },
  blue: { ... },
}
```

### Adding Languages

Update `src/types/index.ts` in `LANGUAGE_COLORS` and `getLanguageFromPath()`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with MSW |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT - College Mini Project