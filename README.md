# Lumen — AI Chat App (Full-Stack)

A real full-stack AI chatbot: a Node/Express backend that streams responses
token-by-token, a React (Vite) frontend with multiple saved conversations,
and now **real accounts** — everyone signs up with their own email/password
and only ever sees their own chat history.

Runs on **Groq's free API** (no credit card, generous free tier) — the
whole thing costs $0 to run.

```
lumen-chat/
├── backend/     Express API — auth, conversations, streaming chat endpoint
└── frontend/    React (Vite + Tailwind) chat UI + login/signup
```

## Features

- **Accounts** — sign up, log in; passwords are hashed (never stored in
  plain text); sessions use signed tokens (JWT) that last 30 days.
- **Private history** — every conversation belongs to exactly one account;
  the API refuses to show or modify a conversation that isn't yours.
- **Streaming responses** — replies appear word-by-word as they're generated.
- **Multiple conversations** — a sidebar lists your past chats.
- **Markdown + math rendering** — bold, code blocks, headings, and LaTeX
  math (`\(x^2\)`, `\[ ... \]`) all render properly.
- **Free image generation** — start a message with `/image` followed by a
  description (e.g. `/image a fox reading under starlight`) to generate a
  real picture, powered by Pollinations.ai's free, no-API-key image API.

## Prerequisites

- Node.js 18 or later, npm
- A free Groq API key: https://console.groq.com/keys (no credit card)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set:

```
GROQ_API_KEY=gsk_...
JWT_SECRET=some-long-random-string
```

Generate a good `JWT_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
(You can technically skip this — the app auto-generates one — but then
everyone gets logged out every time the server restarts.)

Start it:

```bash
npm run dev
```

Runs at `http://localhost:4000`. Data is stored in `backend/data/db.json`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). You'll land
on a login/signup screen — click "Sign up" to create your first account.

## API reference

| Method | Path                     | Auth? | Description                              |
|--------|--------------------------|-------|--------------------------------------------|
| POST   | /api/auth/signup          | No    | Create an account                          |
| POST   | /api/auth/login           | No    | Log in, get a session token                |
| GET    | /api/auth/me              | Yes   | Get the current logged-in user             |
| GET    | /api/conversations        | Yes   | List YOUR conversations                    |
| POST   | /api/conversations        | Yes   | Create a new empty conversation            |
| GET    | /api/conversations/:id     | Yes   | Get one of YOUR conversations              |
| PATCH  | /api/conversations/:id     | Yes   | Rename one of YOUR conversations           |
| DELETE | /api/conversations/:id     | Yes   | Delete one of YOUR conversations           |
| POST   | /api/chat/stream           | Yes   | Send a message in YOUR conversation        |
| POST   | /api/chat/image             | Yes   | Generate an image in YOUR conversation     |

"Auth? Yes" routes require an `Authorization: Bearer <token>` header — the
frontend handles this automatically once you're logged in.

## Deploying (same pattern as before)

1. Push this folder to your GitHub repo (overwrite the existing files).
2. **Backend → Render**: same service as before → Environment tab → add
   `JWT_SECRET` alongside your existing `GROQ_API_KEY` and `CORS_ORIGIN` →
   Manual Deploy → "Deploy latest commit".
3. **Frontend → Vercel**: same project as before → Deployments →
   Redeploy (no new env vars needed on this side).
4. Open your live link — you should now see a login screen instead of
   jumping straight into a shared chat.

## Notes on going further

- **Database**: still a JSON file (`backend/src/db.js`) — fine for
  personal/demo use, but a real database is worth it once more than a
  couple of people use this, since concurrent writes to one file don't
  scale well.
- **Password reset**: there's no "forgot password" flow yet — if someone
  forgets theirs, the only fix right now is deleting their row from
  `db.json` and signing up again.
- **Email verification**: signup doesn't verify the email address is real
  — fine for a personal project, but add it before treating this as a
  public product.
- **Image generation**: uses Pollinations.ai's free public endpoint, which
  has no uptime guarantee and can occasionally be slow or briefly down —
  that's the tradeoff for it being free and keyless. If it stops working,
  check https://pollinations.ai for status, or swap in a paid provider
  (Stability AI, OpenAI's image API, etc.) in `backend/src/routes/chat.routes.js`.
- **Video generation**: not included — there's currently no free,
  reliable video-generation API to plug in the way Pollinations covers
  images. All working options (Runway, Pika, Google Veo) are paid.
