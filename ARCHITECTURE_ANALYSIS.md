# Repository Explainer — Full Codebase Analysis

> A line-by-line walkthrough of every component in `agrwl-utkarsh/mini2`, how each one works internally, and how they talk to each other. Every claim below was checked against the source (and, where useful, against a running dev server).

---

## 1. What this project actually is

**One sentence:** a single-page React app where you paste a GitHub repo URL and it returns four AI-generated views of that repo — a plain-English explanation, an interactive architecture diagram, a chat assistant, and a file browser with per-file explanations.

**Shape of the system:**

```
                    ┌──────────────────────────────────────────────┐
   Browser          │  React SPA (src/)                            │
   localhost:5173   │  App.jsx  ─ tabs: Explanation / Architecture  │
                    │            / Chat / Files                    │
                    └───────────────┬──────────────────────────────┘
                                    │  fetch('/api/...')   same-origin
                    ┌───────────────▼──────────────────────────────┐
                    │  /api/analyze   /api/chat   /api/file        │
                    │  (Vercel serverless functions — Node runtime) │
                    │  • GitHub REST + raw.githubusercontent.com    │
                    │  • Grok → Gemini → DeepSeek → OpenRouter      │
                    │    → local heuristic fallback                 │
                    └──────────────────────────────────────────────┘
```

There are **8 source files** that matter and **three runtime contracts**. That's the whole system:

| Layer | File | Lines | Role |
|---|---|---|---|
| Entry / shell | `index.html` | 24 | Mount point, critical CSS, font preload |
| React root | `src/main.jsx` | 9 | `createRoot` + `StrictMode` |
| Orchestrator | `src/App.jsx` | 303 | Owns all app state, tab routing, theme |
| Tab 1 | `src/components/CodeExplanation.jsx` | 105 | Renders the AI explanation text |
| Tab 2 | `src/components/ArchitectureFlow.jsx` | 476 | ReactFlow diagram + local editor |
| Tab 3 | `src/components/Chatbot.jsx` | 247 | Q&A conversation UI |
| Tab 4 | `src/components/CodeExplorer.jsx` | 234 | File tree + code viewer + "Explain File" |
| Styling | `src/App.css` | 1277 | Design tokens (light/dark) + all component CSS |
| API | `api/analyze.js` | 574 | GitHub ingestion, tech detection, explanation, architecture |
| API | `api/chat.js` | 432 | Context-primed chat + keyword fallback engine |
| API | `api/file.js` | 92 | File fetch + single-file explainer |
| Dev only | `vite.config.js` | 93 | Vite + a hand-written serverless emulator |
| Deploy | `vercel.json` | 10 | Build command, output dir, function timeout |

---

## 2. Build & boot chain (how it starts)

1. **`index.html`** is the real entry. It ships inline "critical CSS" (`* { margin: 0 }`, `body` font, `.container { max-width: 720px }`) so the first paint isn't unstyled, preloads Inter from Google Fonts, then loads `<script type="module" src="/src/main.jsx">`.
2. **`src/main.jsx`** mounts `<App />` into `#root` inside `React.StrictMode` (which in dev deliberately double-invokes render and effects — relevant for the `useEffect` auto-fetch in `CodeExplorer` and the ReactFlow reset in `ArchitectureFlow`).
3. **`src/App.jsx`** renders the shell: topbar (theme toggle + GitHub link), hero, URL form, example chips, error banner, and — only once there is data — the repo banner + 4-tab result panel.
4. **`vite.config.js`** registers two plugins: `@vitejs/plugin-react` (JSX + Fast Refresh) and a **custom `apiMiddlewarePlugin`**. That second plugin is why `npm run dev` works with no Vercel CLI.

### 2a. The custom API middleware (`vite.config.js`) — the clever bit

Vercel's dev behaviour is: any file under `api/` becomes an HTTP route whose `export default (req, res)` is a Node handler. The project reproduces exactly that in ~70 lines:

```
configureServer(server)
  └─ server.middlewares.use(async (req, res, next) => {
       if pathname ∈ {/api/analyze, /api/chat, /api/file}:
         • buffer the raw request stream, JSON.parse it  → body  (400 on bad JSON)
         • build a fake req  = { method, headers, query, body }
         • build a fake res  = { statusCode, status(c), json(d), send(d) }
         • `await import('./api/x.js')` and call its default export
         • otherwise: catch → 500 JSON
       else next()
     })
```

Consequences worth knowing:

- **The handlers are written once and used in two runtimes.** `req.method`, `req.body`, `req.headers`, `req.query`, `res.status().json()` are the intersection of Vercel's Node API and this shim. Anything beyond that intersection (e.g. `res.setHeader`, streaming, `res.sendStatus`) does **not** work locally.
- **Dynamic `import()` per request** means no function-level module state is reused between calls — same as real serverless.
- It implements only the four `res` members the code actually uses. Because there is **no OPTIONS/CORS handling**, a preflight gets `405 Method not allowed` (verified with `curl -X OPTIONS`). Same-origin use is unaffected.
- The shim deliberately does **not** load `.env` files. Vite only exposes `VITE_`-prefixed vars, and to `import.meta.env` (client), never to `process.env`. Verified: after writing a `.env` with `GEMINI_API_KEY`, `process.env.GEMINI_API_KEY` inside the Vite process was still `undefined`. **So the README's `cp .env.example .env` step silently does nothing locally** — server-side keys must be exported in the shell (`GEMINI_API_KEY=... npm run dev`), and client-side keys have no UI to enter them (§7.1).

---

## 3. `src/App.jsx` — the orchestrator

This file is the **single owner of all application state**. Nothing else holds shared data.

### State table

| State | Set from | Consumed by |
|---|---|---|
| `url` | input | POST body |
| `loading` | request lifecycle | button spinner, tab shell |
| `error` | failed `res.ok`/throw | error banner |
| `activeTab` | tab buttons, reset to `'explanation'` on success | which component renders |
| `repoMeta` | `data.meta` | all 4 tabs |
| `explanation` | `data.explanation` | CodeExplanation, Chatbot (`readmeSnippet`) |
| `highlights` | `data.highlights` | CodeExplanation |
| `techStack` | `data.techStack` | CodeExplanation, Chatbot |
| `architecture` | `data.architecture` | ArchitectureFlow, Chatbot |
| `fileTree` | `data.fileTree` | CodeExplorer, Chatbot |
| `theme` | `localStorage['repo_explainer_theme']` | `document.documentElement[data-theme]` |

### `handleSubmit` — the one and only data-loading path

```
e.preventDefault() → guard (empty url | already loading)
→ clear explanation / architecture / repoMeta
→ POST /api/analyze  { url }
   ↳ !res.ok → throw errData.error  → error banner
→ one setState burst: meta, explanation, highlights, techStack, architecture, fileTree
→ setActiveTab('explanation')
```

Note the **all-or-nothing** design: one HTTP call returns everything, so there are no partial states and no waterfall of requests. The cost is that a slow LLM call blocks the entire UI (single spinner) and the two server-side LLM calls are serialised against a 30 s function budget.

### Rendering rules

- Empty state only when `!repoMeta && !explanation && !loading`.
- The result `<article>` renders when `repoMeta || explanation || loading` — so **during loading you get an empty result shell** (repo banner absent, tab bar present, Explanation tab renders an "Overview" card with no content). Cosmetic, but it is what the code does.
- `renderActiveTabContent()` is a plain `switch` on `activeTab`; all four components are mounted/unmounted on tab change. That matters for `ArchitectureFlow`, whose graph edits live in **its own** state and are therefore **lost when you switch tabs** and come back.
- Theme is a CSS-variable swap: `[data-theme='dark']` in `App.css` overrides the `:root` token block. No reload, no duplicated stylesheet.

### Prop contract (exact)

```
CodeExplanation  ← explanation, repoMeta, techStack, highlights      (repoMeta unused inside)
ArchitectureFlow ← architecture, repoMeta                            (repoMeta unused inside)
Chatbot          ← repoMeta, techStack, explanation, architecture, fileTree
CodeExplorer     ← repoMeta, fileTree                                (apiKeys NOT passed)
```

Two of those props are dead, and the missing `apiKeys` is the root of §7.1.

---

## 4. `api/analyze.js` — the backbone endpoint

Five stages, all in one function. This is where ~70 % of the backend logic lives.

### Stage 1 — `parseGithubUrl(rawUrl)` (L76–97)

```
"https://www.github.com/owner/repo.git/"  →  strip scheme+host, strip .git, strip trailing /
split('/') → need ≥ 2 parts → { owner: parts[0], repo: parts[1], branch }
branch only filled when parts[2] === 'tree' and parts.length ≥ 4
```

Verified behaviour:

| Input | Result |
|---|---|
| `https://github.com/facebook/react` | `{owner:'facebook', repo:'react', branch:null}` ✅ |
| `facebook/react` | ✅ same |
| `https://github.com/a/b/tree/dev` | `{owner:'a', repo:'b', branch:'dev'}` ✅ |
| `hello` | 400 `Please enter a valid repository URL…` ✅ |
| `https://evil.example.com/foo/bar` | **`{owner:'https:', repo:''}`** ❌ accepted, then fails downstream |

So the host check is a *regex replace*, not a validation: any non-GitHub URL that isn't shaped like `github.com/...` leaks through with garbage owner/repo. It is **not** an SSRF risk — every outbound host is a hard-coded literal (`api.github.com`, `raw.githubusercontent.com`) — but the user gets a confusing fallback result instead of a 400.

### Stage 2 — three GitHub reads (L99–195)

| Function | Endpoint | Timeout | Failure behaviour |
|---|---|---|---|
| `fetchRepoMetadata` | `GET api.github.com/repos/{o}/{r}` | 8 s | returns a stub: 0 stars/forks, `default_branch: 'main'`, language `'Code'` |
| `fetchRepositoryReadme` | `GET raw.githubusercontent.com/{o}/{r}/{branch}/{name}` | 6 s each | returns `# repo\n\nNo README…` |
| `fetchRepositoryTree` | `GET api.github.com/repos/{o}/{r}/git/trees/{branch}?recursive=1` | 8 s | returns a **fake 4-file tree** (`src/index.js`, `package.json`, …) |

Details that matter:

- **README probing is a 3 × 7 nested sequential loop** — `[branch, main, master] × [README.md, readme.md, README.MD, README.markdown, README.rst, README.txt, README]`. In the happy path it stops at the first hit, but a repo with no README costs up to **21 serial fetches × 6 s** inside a 30 s function. This is the most likely cause of a `maxDuration` timeout.
- **Tree is normalised** to `{ path, type: 'file'|'directory', size }` and later sliced to 300 items in the response.
- `GITHUB_TOKEN` only raises the 60 → 5,000 req/h limit; it is optional and never required.
- Both GitHub calls `Promise.all` in parallel; the README probe runs in parallel with the tree.
- The stubs are **silent**: an unreachable GitHub API produces a successful 200 with `stars: 0, language: "Code"` — indistinguishable in the UI from a brand-new repo. I reproduced exactly this (the sandbox intercepts TLS, so every node fetch failed and the response was a clean 200 with zeroed stats).

### Stage 3 — `detectTechStack(readme, fileTree)` (L197–226)

Pure string matching, no network. One blob → lowercase → 15 regex signatures → array of `{ name, category }`.

```
React/Frontend · Next.js/Framework · Vue/Frontend · Node.js/Backend · TypeScript/Language
Python/Language · Go/Language · Rust/Language · Docker/DevOps · PostgreSQL/Database
MongoDB/Database · Redis/Cache · Tailwind CSS/Styling · GraphQL/API · REST API/API
```

Two consequences: matching is **substring-based over the whole README**, so prose like "we do not use Docker" still yields Docker; and the `match: /typescript|\.ts|\.tsx/` patterns fire on any `.ts` substring in a path. If nothing matches it returns `[{ name: 'JavaScript', category: 'Language' }]` — a guess, not a detection.

### Stage 4 — two LLM calls, in parallel (L42–45)

```js
const [explanationResult, architecture] = await Promise.all([
  explainRepository(...),     // long prose
  generateArchitecture(...),  // strict JSON
])
```

**`explainRepository` (L228–310)** builds a 5-heading prompt (`What This Project Does`, `How It Works Step by Step`, `What It Is Built With`, `How to Get Started`, `Who Should Use It`), truncates README to 7 000 chars, injects the 30 first file paths and the tech names, then walks the provider cascade:

```
Grok (grok-beta, 20 s)
 → Gemini for each of [gemini-1.5-flash-latest, gemini-1.5-flash, gemini-2.0-flash-exp, 20 s]
 → DeepSeek (deepseek-chat, 20 s)
 → OpenRouter (meta-llama/llama-3.2-3b-instruct:free, 20 s)
 → generateSimplePlainEnglishExplanation()   ← provider: "Built-in Explainer"
```

Each attempt is `try/catch` + `if ok`; the first non-empty text wins and reports its provider name. **Worst case is 5 sequential external calls × 20 s = 100 s** — far beyond `maxDuration: 30`. There is no pre-flight "is this key valid" and no circuit breaker.

**`extractHighlights` (L311–333)** post-processes the prose: it scans lines for `- `/`* `/`1. ` items, strips markers and `**`, keeps the first 3 between 20 and 130 chars, else returns 3 canned lines. This is why the "Summary" card can describe a checklist (e.g. the fallback's own step numbers) rather than insights.

**`generateArchitecture` (L377–424)** asks for *only* JSON with 6–10 nodes, strips ``` fences, `JSON.parse`, and validates `nodes.length >= 4`. On parse failure or short output it **silently** falls through to the next provider, ending at:

**`generateCleanArchitecture` (L448–500)** — a deterministic heuristic graph built from file paths + tech names:

```
hasUi  = tech ∈ {react, vue, frontend} | paths contain 'src/'
hasApi = tech ∈ {node.js, express, python, api} | paths contain 'api/'
hasDb  = tech ∈ {postgresql, mongodb, database} | paths contain 'db'

User Request →[Opens]→ User Interface? →[Calls]→ API Router? →[Processes]→ Core Logic
                                                                  ├─[Reads/Writes]→ Database?
                                                                  └─[Delivers]→ Final Response
```

Nodes are `{ id, type, position: {x:350, y: 40+125n}, data: { label, description, tech } }` — guaranteeing a valid diagram even with **zero API keys**, which is the headline resilience claim in the README.

Two dead-code notes here: `truncated` (the 5 000-char README slice, L378) is computed but **never used** — the architecture prompt contains only *name, tech list and 30 file paths*, not the README; and `normalizeArchitecture` (L425–446) is applied **only** to LLM output, never to the fallback.

### Stage 5 — the response contract

```json
{
  "meta": { "owner","repo","fullName","description","stars","forks","openIssues",
            "language","topics","license","defaultBranch","avatarUrl","htmlUrl" },
  "explanation": "<markdown-ish prose>",
  "highlights": ["…", "…", "…"],
  "techStack": [{ "name": "React", "category": "Frontend" }],
  "architecture": { "nodes": [...], "edges": [...] },
  "fileTree": [{ "path", "type", "size" }],     // capped at 300
  "providerUsed": "Grok" | "Gemini" | "DeepSeek" | "OpenRouter" | "Built-in Explainer"
}
```

`providerUsed` is **returned but never consumed** — `App.jsx` never reads it, no component displays it. Same for `meta.topics`, `meta.openIssues` and `meta.avatarUrl`: transmitted, unused.

---

## 5. `api/file.js` — two endpoints in one handler

```
POST { action:'explain', owner, repo, path, content, apiKeys }
   → explainSingleFile() → 200 { explanation }
   → any other action   → 400 { error: 'Unknown action' }
GET ?owner=&repo=&path=&branch=
   → probe raw.githubusercontent.com over [branch, main, master]
   → 200 { content, path, branch } | 404 { error }
anything else → 405
```

**`explainSingleFile` (L42–91)** truncates content at 4 000 chars and asks for 3 paragraphs (what it does / its parts / how others use it). Unlike the other two endpoints it supports **only Gemini**, single model (`gemini-1.5-flash-latest`), no cascade — so with only a Grok key configured, this endpoint silently degrades to a **template**:

> "This file handles a specific part of the application at `path`. In simple terms, it groups together related logic…"

That text is generated **without looking at the code at all**. It reads like an explanation but contains zero information. This is the biggest honesty gap in the product.

Also note the GET branch probe repeats `[branch, 'main', 'master']` — the third copy of that same branch list in the codebase (`analyze.js` and `chat.js` have their own).

---

## 6. `api/chat.js` — context-primed Q&A with a keyword fallback

### Request

```
POST { messages: [{role, content}…], repoContext: {…}, apiKeys: {} }
```

The **entire repo context is re-sent on every turn** by the browser — the server is stateless. `repoContext` carries `name, repo, description, techStack, language, htmlUrl, readmeSnippet, highlights, fileTree (≤100), architecture`.

### System prompt assembly (L31–51)

```
You are a senior engineer answering questions about "<repo>"
Description · Tech stack · File list (80 paths) · Architecture nodes · Documentation (readmeSnippet 3 500 chars)
Instructions: direct, plain English, use real file paths, no buzzwords, clean code fences.
```

Then `messages` are mapped to provider roles and the same 4-provider cascade runs: Grok → Gemini(×3 models) → DeepSeek → OpenRouter. Each success returns `{ message, provider }`.

⚠️ **Naming trap:** `readmeSnippet` is not a README. `App.jsx` sends `explanation?.slice(0, 4000)` — i.e. *the AI's own summary of the README*. So the chat model is primed on a **paraphrase of a paraphrase**, and the actual README text (which `analyze` had in memory) is thrown away. `repoContext.highlights` is also always `undefined`, because highlights live in a separate `App` state and are never attached to `repoMeta`.

### The offline engine — `answerRepoQuestion(question, context)` (L106–349)

When *every* provider fails or no key exists, a ~240-line **keyword router** answers. It is the most intricate part of the backend and worth understanding, because it is what most users of a keyless clone will actually see.

Ordered rule chain (first match wins):

| # | Trigger | What it produces |
|---|---|---|
| 1 | file words (`where is`, `which file`, `structure`, `folder`, `package.json`, `vite`, `index.html`, **any `.js/.jsx/.ts/.json/.html`**) | list of matching `fileTree` paths + sizes; if none match → top-level dirs + file count |
| 2 | `run/start/install/setup/test/clone/build` | full setup recipe, branching on Python (`requirements.txt`, `.py`), Rust (`cargo.toml`), Go (`go.mod`), else Node (`npm install` + `npm run dev`) |
| 3 | `architecture/flow/how it works/component/pipeline/data` | architecture nodes as bullets + first 6 edges as `A ➔ B (label)` |
| 4 | `tech/stack/language/framework/dependency/database` | `techStack` as `**Name** (Category)` bullets |
| 5 | `deploy/hosting/vercel/docker/aws/cloud` | deploy recipe, detecting `vercel.json` / `Dockerfile` in the tree |
| 6 | `what is/purpose/why/problem/about` | description + generic goals |
| 7 | *any word > 3 chars not in a stop-list* | **paragraph grep** over `readmeSnippet + description`; returns the 2 best-matching paragraphs as a quote |
| 8 | nothing | generic fact sheet (name, description, stack, language, file count) |

Strengths: genuinely derived from real repo data, instant, zero cost, and rule 7 (paragraph retrieval) is a legitimate mini-RAG over the text on hand. Weaknesses: rule 1 intercepts anything containing `.js`/`.json`, and its cleanup regex (`q.replace(/where is|which file|…|in|is|a/gi,'')`) mangles the search terms (`main.js` → `m n.js`); rule 2 fires on the word "build" inside unrelated questions; rule order means "what is the data folder" hits rule 1 (structure), never rule 3. Provider label leaks to the client as `'Repository Assistant'` but again isn't shown.

### The critical integration gap

`repoContext.architecture` is the **raw** object from `/api/analyze`. `ArchitectureFlow` copies that into its own ReactFlow state and lets the user add/delete/connect nodes — but it **never calls back into `App`**. Therefore:

> Anything you edit in the Architecture tab is invisible to the Chat tab (and to everything else). "Add Component" is a local visual sandbox, not a change to the model's context.

---

## 7. Frontend components, one by one

### 7.1 `CodeExplanation.jsx` — a hand-rolled micro-markdown renderer

Input: `explanation` (string). Output: `<h3>/<h2>/<ul>/<p>` + fenced code blocks.

```
explanation.split(/(```[\s\S]*?```)/g)      → alternate text / code chunks
  code chunk → lang = first line if it looks like an identifier, else 'bash'
  text chunk → split on blank lines:
                 '### x' → <h3>          '## x' → <h2>
                 '- x'   → <ul><li>      otherwise → <p>
```

Above the body it renders an **Overview card**: `techStack` as pills and `highlights` as bullets. `repoMeta` is accepted but unused.

⚠️ **Bold is not handled.** The prompts explicitly instruct the model to write `**got**`-style emphasis (and the server's fallback text is full of it), but the renderer only knows `###`, `##` and `-`. Users see **literal `**asterisks**`** in paragraphs and list items. Verified in the generated output: `**this project** is designed to solve…`.

### 7.2 `ArchitectureFlow.jsx` — the stateful one

**`TYPE_CONFIG` (L17–28)** is the design system for nodes: 10 types (`start, ui, api, service, decision, database, cache, worker, end, default`), each with `{border, bg, tag, label}`. `tag` is the small monospace chip, `label` is the human name used by the legend and inspector.

**`CustomArchitectureNode` (L30–110)** — one React component behind *every* node type (`nodeTypes = { customNode }`). It renders a card with: category tag, tech text, bold label, muted description, and ReactFlow `Handle`s whose `Position` comes from `data.sourcePosition / targetPosition` (so the same node works in vertical and horizontal layouts). `selected` changes border + adds a 3 px accent ring. Colours come from `TYPE_CONFIG`, chrome from CSS variables.

**`initialData` (`useMemo`, L114–176)** — normalises the API graph for ReactFlow:

```
no architecture? → 4-node demo graph (Client → Gateway → Logic → Database)
else             → node.type = 'customNode'
                   node.data.typeKey = apiNode.type            ← the API's "type" becomes the visual key
                   position = { x: 350, y: 40 + index*125 }    ← ignores the AI's positions entirely
                   edge.type = 'smoothstep', animated, arrow marker, stroke = var(--color-border-hover)
```

Note it **discards the LLM's `position` values** and re-stacks everything vertically by array order — a deliberate choice to guarantee a readable layout regardless of what the model returns.

**State** — four things, all local:

| State | Purpose |
|---|---|
| `useNodesState` / `useEdgesState` | ReactFlow's own graph store |
| `selectedNode` | drives the inspector drawer |
| `layoutMode` | `'vertical' \| 'horizontal'` |
| `filterType` | dimension filter (`all/ui/api/service/database`) |
| `showAddModal`, `newNodeForm` | Add-Component modal |

`useEffect([initialData])` calls `setNodes/setEdges` — i.e. **a new analysis wipes all manual edits**, as does unmounting on tab switch.

**Operations:**

- `onConnect` — `addEdge({ type:'smoothstep', animated, markerEnd, style })`; user-created edges are visually consistent with generated ones.
- `applyLayout(dir)` — repositions nodes **by index**: vertical `x=350, y=40+125i`; horizontal `x=60+240i, y=150`. It also flips every node's handle positions (`Right/Left` vs `Bottom/Top`). It's a re-position, **not a re-layout algorithm** — nothing looks at the edges, so crossing lines are possible.
- `visibleNodes` — filtering **hides** non-matching nodes (`hidden: typeKey !== filterType`) but leaves all edges, so filtered views show edges dangling toward invisible nodes. The dropdown exposes only 5 of the 10 types.
- `handleAddNode` — `id: node-${Date.now()}`, appended at the end of the current layout, then modal close + form reset.
- `handleDeleteNode` — removes the node **and every edge touching it**.

**UI surface:** toolbar (add / vertical / horizontal / filter) · ReactFlow canvas with `Background`, `Controls`, `MiniMap` (node colour = type border) · `Panel` badge showing live `{nodes.length} nodes · {edges.length} connections` · **inspector drawer** on node click (label, type name, technology, description, computed *Inputs* and *Outputs* by scanning `edges`, Remove button) · legend footer · Add-Component modal with validation (`required` label).

⚠️ Minor visual bug: `markerEnd` and `style` pass `color: 'var(--color-border-hover)'`. Inline `style` resolves CSS variables fine, but an SVG **presentation attribute** (`fill`/`stroke` on the marker) does not — so the arrowheads will most likely render with the default colour rather than the border colour.

### 7.3 `Chatbot.jsx` — stateless chat UI over a stateless API

- Initial system-authored welcome bubble describing the repo.
- `SUGGESTED_QUESTIONS` chips: run locally / problem solved / architecture / dependencies — each calls `handleSend(question)`.
- `handleSend` appends a user message, clears the input, sets `loading`, POSTs **the entire message list** plus the repo context, and appends the reply. Errors become an assistant bubble flagged `isError`.
- `renderMessageContent` — a second copy of the micro-markdown renderer (fences → `<pre><code>` with a language chip, `###/##` → headings, `-` → list, else `<p>`). Unlike `CodeExplanation` it does **not** try to strip `**`, and the prompt's "no buzzwords" instruction invites markdown.
- `scrollToBottom` via `useEffect([messages, loading])` + a sentinel `<div ref={chatEndRef} />`.
- `handleClear` resets to one bubble (history is **not** persisted).
- Enter sends, Shift+Enter is allowed through (`onKeyDown` + `preventDefault`).

Note the **welcome message is included in the payload** sent to the model, so every request carries one extra assistant turn the user never wrote.

### 7.4 `CodeExplorer.jsx` — file tree + viewer + per-file AI

Two-column layout: sidebar (`fileTree`) + main pane (code).

```
useEffect([fileTree])  → if nothing selected and tree non-empty:
                          firstFile = first item with type==='file'  → handleFileSelect(thatPath)
```

⚠️ The tree arrives **alphabetically from GitHub**, so `firstFile` is typically `.editorconfig`, `.gitattributes` or `LICENSE` — the app auto-fetches and displays a dotfile on every analysis. (`useEffect` in StrictMode runs twice in dev, so the fetch fires twice locally.)

- **Filtering** is `useMemo` over `path.toLowerCase().includes(query)` — a flat search, not a tree. Directories are rendered but `disabled`. Badge = `DIR` or first 4 chars of the extension (`.jsx` → `JSX`).
- **`handleFileSelect(path)`** → `GET /api/file?owner&repo&path&branch` (branch from `repoMeta.defaultBranch`) → `content` state. Loading / error / content are three explicit branches in the render.
- **`handleExplainFile()`** → `POST /api/file {action:'explain', content}` — it posts the content **already in memory**, so no re-fetch; server truncates at 4 000 chars.
- **Copy** → `navigator.clipboard.writeText` + 2 s "Copied" label.
- **View on GitHub** → `${htmlUrl}/blob/${defaultBranch}/${path}`.
- **Code view** — `.line-numbers` column generated from `content.split('\n').length` next to a `<pre>`; both share `.code-editor-view { display:flex }` so line wraps stay aligned **only** if nothing wraps (`pre` is `overflow-x:auto`, which is why they align).
- **`apiKeys` prop is declared but `App.jsx` never passes it** → always `undefined` → `JSON.stringify` omits it → the server always falls back to `process.env`. This is the missing half of the documented "⚙️ API Keys" feature.

### 7.5 `App.css` — 1 277 lines, 6 sections

```
1  Design system   : tokens, light theme, dark theme ([data-theme='dark']), base type
430 Architecture   : .architecture-container (height 580px), toolbar, canvas, inspector, legend, modal
630 Chatbot        : header, chips, .chat-messages (scroll), bubbles, code blocks, typing dots
812 Code Explorer  : two-column grid, tree, toolbar, .code-content-wrapper (scroll), line numbers
992 Code Explanation: executive card, tech pills, highlights, prose, code blocks
1121 Modals        : backdrop + card (shared by Add-Component)
```

Theming is 100 % CSS custom properties — React only flips `data-theme` on `<html>`. Only **one** media query exists (`max-width: 680px`: stacks the form, the explorer, and the settings grid) — the ReactFlow canvas, chat height and tab bar are not adapted for mobile. `.settings-grid` is styled but **no Settings component exists** (dead CSS from the documented-but-absent modal).

⚠️ Font mismatch: `index.html` preloads and applies **Inter**, but `App.css` redefines `--font-sans` as `-apple-system, …` without Inter — so the font is downloaded and never used, and the critical-CSS `.container { max-width: 720px }` is overridden by `.container { max-width: 980px }` at L151 (a possible first-paint jump).

---

## 8. How it all works together — end-to-end traces

### Trace A: "Explain this repo" (the main path)

```
App.handleSubmit
  └─ POST /api/analyze {url}
       parseGithubUrl ──400──► App error banner
       ├─ fetchRepoMetadata ─┐ (parallel, 8s)
       ├─ fetchRepositoryReadme ─┐ (parallel, ≤21 probes)
       └─ fetchRepositoryTree ───┘ (parallel, 8s)
       detectTechStack(readme, tree)
       Promise.all ─┬─ explainRepository ──► Grok→Gemini×3→DeepSeek→OpenRouter→Built-in
                    └─ generateArchitecture ─► same chain (JSON) → generateCleanArchitecture
       res.json({meta, explanation, highlights, techStack, architecture, fileTree, providerUsed})
  └─ App sets 6 pieces of state, activeTab='explanation'
       ├─ CodeExplanation  ← explanation + techStack + highlights
       ├─ ArchitectureFlow ← architecture  (mounted lazily when tab opens)
       ├─ Chatbot          ← all of the above + fileTree   (lazily)
       └─ CodeExplorer     ← fileTree                      (lazily; auto-fetches 1 file)
```

### Trace B: one chat turn

```
Chatbot.handleSend
  └─ POST /api/chat { messages[], repoContext{name, description, techStack,
                       readmeSnippet(= explanation text), fileTree[≤100], architecture(raw) } }
       build systemPrompt (file list ≤80, arch nodes, docs ≤3500)
       Grok → Gemini×3 → DeepSeek → OpenRouter
       └─ all failed → answerRepoQuestion() keyword engine
  └─ append assistant bubble (rendered by the local markdown renderer)
```

### Trace C: clicking a file

```
CodeExplorer.handleFileSelect
  └─ GET /api/file?owner&repo&path&branch
       raw.githubusercontent.com/{branch|main|master}/{path}   (first 200 wins)
       → { content, path, branch }  │ 404 { error }
  └─ renders line numbers + <pre>, enables Copy / Explain / View on GitHub
       "Explain File" → POST /api/file {action:'explain', content}
                         Gemini only → template if no Gemini key
```

### Shared invariants (the glue)

| Invariant | Where enforced |
|---|---|
| One POST returns the whole analysis; the client never chains calls | `handleSubmit` |
| `App` owns shared state; components are pure views **except** `ArchitectureFlow`, `Chatbot`, `CodeExplorer` (local UI state only) | §3, §7 |
| Repo identity is `{owner, repo, branch}`; every fetcher rebuilds URLs from it | `analyze.js`, `file.js` |
| Provider selection is env/body/header in that order: `apiKeys.x → x-*-key header → process.env.X` | all 3 handlers |
| Every network call is time-boxed with `AbortSignal.timeout(6–20 s)` | all fetchers/callers |
| The UI never shows which provider answered | `providerUsed` / `provider` unused |

---

## 9. Findings: documentation vs. reality

The README describes a product noticeably larger than the code.

| README claims | Reality |
|---|---|
| `src/components/SettingsModal.jsx` + "⚙️ API Keys button" + keys in `localStorage` | **Does not exist.** No settings UI, no `localStorage` use except the theme. `.settings-grid` CSS is orphaned. |
| 6-step cascade ending in Hugging Face | **No HF caller anywhere.** `HUGGINGFACE_API_KEY` is read into `keys.huggingface` and never used. Real cascade is 5 steps. |
| "Mermaid Export" + "JSON Export" | **Neither exists.** No `mermaid`, no download code in `src/`. |
| "Edit node labels", "connect custom edges" | Add + delete + connect exist; **label editing does not**. |
| "click any component to inspect inbound/outbound" | ✅ real (`node-inspector`) |
| "Automated tech detection from `package.json` / `requirements.txt` / `Cargo.toml`" | Actually **regex over README text + file paths**; manifests are never parsed. |
| Per-file "exports, architectural role" walkthrough | Server prompt asks 3 simple paragraphs; with no Gemini key you get a **template**. |
| "Copy to clipboard or export as Markdown" for the explanation | Only the **code file** has a copy button; the explanation has none. |
| Deployed as "Edge/Serverless functions" | Node serverless (`fetch`, `AbortSignal`, `maxDuration`) — not Edge. |
| `cp .env.example .env` then `npm run dev` | Verified: the Vite process **does not load `.env` into `process.env`**, so no key reaches the handlers. |
| Node 18/20/22/24 tested | `npm run build` ✅ (Vite 5, 322 kB / 104 kB gzip), `npm ci` ✅ — no tests exist to "test" anything. |
| `.python-version` 3.11 + Python `.gitignore` | **Vestigial** — no Python in the repo. |

---

## 10. Risk / quality summary (ranked)

| # | Issue | Severity | Where |
|---|---|---|---|
| 1 | Silent template fallbacks read as real analysis (explanation & per-file) | **High** (misleading) | `analyze.js` L334, `file.js` L86 |
| 2 | No API-key UI although everything is designed for it; `apiKeys` never passed | **High** (feature half-built) | `App.jsx` L132, `CodeExplorer.jsx` L9 |
| 3 | Worst case ≥ 5 × 20 s LLM + 21 × 6 s README probes vs. `maxDuration: 30` | **High** (timeouts) | `analyze.js`, `vercel.json` |
| 4 | Chat is primed on the AI's summary, not the README; `highlights` always undefined | Medium | `Chatbot.jsx` L60–70 |
| 5 | Architecture-tab edits never reach App/Chat | Medium | `ArchitectureFlow.jsx` |
| 6 | Diagram edits are destroyed on tab switch or re-analysis | Medium | `initialData` + `useEffect` |
| 7 | Non-GitHub URLs accepted → garbage `owner:'https:'` | Medium | `parseGithubUrl` L80 |
| 8 | `**bold**` rendered literally in Explanation tab | Medium (visible) | `CodeExplanation.jsx` |
| 9 | No caching; every analyze re-hits GitHub (rate limits) | Medium | `analyze.js` |
| 10 | No rate limiting — a deployment with env keys lets anyone burn the owner's quota | Medium (cost) | all handlers |
| 11 | Duplicated provider callers (3 files), duplicated branch lists (3), duplicated markdown renderer (2) | Low (maintenance) | everywhere |
| 12 | Dead code/props: `truncated`, `repoMeta` ×2, `providerUsed`, `topics/openIssues/avatarUrl`, `.settings-grid`, Inter font | Low | multiple |
| 13 | Auto-selects `.editorconfig` as "first file"; double fetch in StrictMode | Low | `CodeExplorer.jsx` L25 |
| 14 | `reactflow@11` (superseded by `@xyflow/react@12`); no tests, no lint, no CI | Low | `package.json` |

---

## 11. What's genuinely good

- **Zero-key operability.** The whole pipeline degrades to heuristics and still produces a real tree, a real tech list, and a valid diagram. Most demo apps of this type are dead without a key.
- **The dev/runtime parity trick** in `vite.config.js` — one handler, two runtimes — is the single best engineering decision in the repo.
- **Clean state ownership.** All shared state lives in one `useState` bundle in `App`; components are read-only views. No Redux, no context spaghetti.
- **Consistent time-boxing.** Every outbound call has an `AbortSignal.timeout`; nothing can hang forever.
- **Design system discipline.** 1 277 lines of CSS driven by ~20 custom properties, with dark mode as a pure token swap.
- **The offline chat router** is a real (if blunt) retrieval system, not a canned response.
