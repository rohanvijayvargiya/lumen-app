# Lumen — AI Chat App (Full-Stack)

A real full-stack AI chatbot: a Node/Express backend that streams responses
from Claude token-by-token (like ChatGPT/Claude.ai), and a React (Vite)
frontend with multiple saved conversations in a sidebar.

```
lumen-chat/
├── backend/     Express API — conversations + streaming chat endpoint
└── frontend/    React (Vite + Tailwind) chat UI
```

## Features

- **Streaming responses** — the assistant's reply appears word-by-word as
  it's generated, not all at once.
- **Multiple conversations** — a sidebar lists past chats; click to switch,
  "+ New chat" to start one, trash icon to delete.
- **Conversation memory** — each chat remembers everything said earlier in
  it, and persists to disk so refreshing the page doesn't lose anything.
- **Markdown rendering** — bold, inline code, fenced code blocks, and bullet
  lines render properly in the assistant's replies.
- **Auto-titling** — a conversation's title is set from your first message.

## Prerequisites

- Node.js 18 or later
- npm
- An Anthropic API key (**required** — unlike the ATS project, there's no
  fallback mode; a chatbot has nothing to "fall back" to). Get one at
  https://console.anthropic.com/settings/keys

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Start it:

```bash
npm run dev
```

Runs at `http://localhost:4000`. Data is stored in `backend/data/db.json`
(created automatically). Check it's alive:

```bash
curl http://localhost:4000/api/health
```

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

## API reference

| Method | Path                     | Description                                  |
|--------|--------------------------|-----------------------------------------------|
| GET    | /api/conversations        | List conversations (id, title, updatedAt)    |
| POST   | /api/conversations        | Create a new empty conversation              |
| GET    | /api/conversations/:id     | Get a conversation with its full messages    |
| PATCH  | /api/conversations/:id     | Rename a conversation                        |
| DELETE | /api/conversations/:id     | Delete a conversation                        |
| POST   | /api/chat/stream           | Send a message; streams the reply via SSE    |

## Deploying (same pattern as the ATS project)

1. Push this folder to a GitHub repo.
2. **Backend → Render**: New Web Service → connect the repo → Root Directory
   `backend` → Build Command `npm install` → Start Command `npm start` →
   add environment variables `ANTHROPIC_API_KEY` and `CORS_ORIGIN` (set the
   latter to your Vercel URL once you have it).
3. **Frontend → Vercel**: Add New Project → connect the repo → Root
   Directory `frontend` → add environment variable `VITE_API_URL` set to
   your Render URL + `/api` (e.g. `https://lumen-backend.onrender.com/api`)
   → Deploy.
4. Go back to Render and update `CORS_ORIGIN` to your real Vercel URL, save
   (auto-redeploys).
5. Open your Vercel link and test: start a new chat, send a message, refresh
   the page to confirm it's still there.

## Notes on going further

- **Database**: currently a JSON file (`backend/src/db.js`) for
  dependency-free setup. Swap `readAll`/`writeAll` for Postgres/MongoDB for
  production use — no other file needs to change.
- **Auth**: there's no login system, so anyone with the URL can use (and see)
  all conversations. Add authentication before sharing this beyond yourself.
- **Model**: the model name is set in `backend/src/utils/anthropicStream.js`
  (`claude-sonnet-4-6`). Check Anthropic's docs for the latest available
  model names if you want to change it.
- **Stop button**: currently stops updating the UI locally but doesn't
  cancel the underlying request to Anthropic — good enough for a first
  version; a true cancel would use an `AbortController` passed through to
  the backend's fetch call.
