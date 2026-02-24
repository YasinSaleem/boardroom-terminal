# The Boardroom

A multi-agent AI strategy terminal with a strict editorial interface (not chat bubbles), persistent sessions, and role-based AI personas.

## Tech Stack

### Frontend
- React 18 + TypeScript (Vite)
- Tailwind CSS
- Framer Motion
- Radix UI primitives
- `react-markdown`

### Backend
- Python 3.11+ with Flask
- `supabase-py`
- OpenAI SDK (OpenRouter-compatible client)
- `python-dotenv`

### Infrastructure
- **Database:** Supabase (PostgreSQL)
- **LLM Provider:** OpenRouter
- **Model:** `arcee-ai/trinity-large-preview:free` (configurable via `.env`)
- **Python tooling:** `uv`

---

## Key Technical Decisions

- **Single Flask API service:** Keep backend logic centralized (auth checks, DB access, LLM calls) for faster iteration and easier debugging.
- **Supabase Auth as user source of truth:** No duplicate app-level users table; sessions are linked to `auth.users(id)`.
- **Session ownership enforcement:** Backend validates bearer token and scopes sessions/messages/chat by authenticated `user_id`.
- **Data-driven agent behavior:** Agent personas are stored in DB (`system_prompt`, role metadata, color) instead of hardcoded in frontend.
- **Bounded LLM context window:** Use agent system prompt + last 8 session messages to balance coherence, cost, and latency.
- **OpenRouter abstraction:** Model is configurable through `.env`, enabling provider/model swaps without frontend changes.
- **Transcript-first UI model:** Editorial transcript rendering with semantic borders, avoiding chat-bubble patterns for clarity and role identity.
- **Client-side perceived streaming:** Assistant responses render progressively in UI for responsiveness while preserving server-side canonical persistence.
- **Monorepo + single root `.gitignore`:** Simplifies project-level tooling and reduces config drift across frontend/backend.

---

## Project Structure

- `frontend/` — React client
- `backend/` — Flask API
- `supabase/schema.sql` — DB schema + seed data
- `.env` — runtime secrets/config
- `agents.md` — AI coding/system implementation directives for this project

---

## Prerequisites

- Node.js 18+
- npm
- Python 3.11+
- `uv` installed
- Supabase project (URL + key)
- OpenRouter API key

---

## Environment Variables

Create/update the root `.env`:

```env
SUPABASE_URL="https://<your-project>.supabase.co"
SUPABASE_KEY="sb_secret_..."

OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="arcee-ai/trinity-large-preview:free"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```

> Use a backend-safe Supabase key (`sb_secret_...`) for server access.

---

## Database Setup (Supabase)

Run the SQL in:

- `supabase/schema.sql`

This creates:
- `agents`
- `sessions`
- `messages`

and seeds the three default agents.
---

## Run Backend (Flask + uv)

From project root:

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run app.py
```

Backend runs on:

- `http://127.0.0.1:5000`

---

## Run Frontend (Vite)

From project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

- `http://127.0.0.1:4173`

Vite proxies `/api/*` to the Flask backend on port `5000`.

---

## Notes

- This project intentionally follows the styling and implementation directives defined in `agents.md`.
- If ports are busy, stop existing listeners first, then restart backend and frontend.
