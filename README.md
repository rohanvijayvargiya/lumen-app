# Lumen — AI Chat App (Full-Stack)

A real full-stack AI chatbot: a Node/Express backend that streams responses
token-by-token (like ChatGPT/Claude.ai), and a React (Vite) frontend with
multiple saved conversations in a sidebar.

Runs on **Groq's free API** (no credit card, generous free tier) serving
open-source models like Llama 3.3 — so the whole thing costs $0 to run.

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
- A free Groq API key (**required** — there's no fallback mode; a chatbot
  has nothing to "fall back" to). Get one at https://console.groq.com/keys
  — sign up with email or Google, no credit card, no charges.

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set:

```
GROQ_API_KEY=gsk_...
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

You should see `{"status":"ok","aiConfigured":true}`.

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
   add environment variables `GROQ_API_KEY` and `CORS_ORIGIN` (set the
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
- **Model**: set in `backend/src/utils/groqStream.js` (`llama-3.3-70b-versatile`
  by default). Check https://console.groq.com/docs/models for the full list
  if you want to try a different one (faster/smaller, or a newer release).
- **Free tier limits**: Groq's free tier allows 30 requests/minute and
  14,400/day — more than enough for personal use, but if you ever hit a rate
  limit error, that's why.
- **Switching back to Claude later**: if you want Claude's actual model
  quality instead of an open-source one, add credits to
  console.anthropic.com and swap `groqStream.js` back to calling
  `api.anthropic.com/v1/messages` (the original version used that; the
  request/response shapes differ slightly, so it's a small rewrite, not a
  one-line change).
- **Stop button**: currently stops updating the UI locally but doesn't
  cancel the underlying request — good enough for a first version; a true
  cancel would use an `AbortController` passed through to the backend's
  fetch call.
