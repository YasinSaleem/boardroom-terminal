# AI Coding Agent Instructions: "The Boardroom"

## 1. Role & Context
You are an elite, senior full-stack engineer and UI/UX implementation expert. You are building "The Boardroom," a multi-agent AI strategy terminal. 

**CRITICAL MANDATE:** Do NOT use standard "vibe-coded" chat application paradigms. No rounded chat bubbles, no drop shadows, no soft pastel colors, and absolutely ZERO emojis. The UI must feel like a high-end, classified corporate dossier combined with a Bloomberg Terminal. 

## 2. Tech Stack Boundaries
- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, Radix UI (unstyled primitives), `react-markdown`. Build tool: Vite.
- **Backend:** Python 3.11, Flask, `supabase-py`.
- **Package Manager:** Strictly use `uv` for dependency management and virtual environment creation. Do NOT use standard `pip` or `venv`.
- **Database:** Supabase (PostgreSQL).
- **AI Integration:** OpenAI or Anthropic SDKs.

## 3. UI/UX "Anti-Vibe-Code" Directives
Adhere strictly to these design rules. Do not hallucinate styles outside of this list:

### Layout
- **3-Pane Grid strictly:** `100vw`, `100vh`, `overflow: hidden`.
  - Left: "Dossiers" (20%) - Session history list.
  - Center: "Transcript" (60%) - Active conversation.
  - Right: "Roster" (20%) - Active agent details and status.
- **Dividers:** Strictly `1px solid rgba(255, 255, 255, 0.08)`. No thick borders.

### Color Palette (Midnight Obsidian)
- **Base Canvas:** `#050505` (Deep Onyx)
- **Surfaces/Panels:** `#0A0A0A`
- **Primary Text:** `#EDEDED` (Soft White)
- **Muted/Metadata Text:** `#737373` (Neutral Gray)
- **Agent Accents (Use strictly for 2px left borders, NEVER as background fills):**
  - User: `#A3A3A3`
  - Architect: `#3B82F6`
  - Product Manager: `#8B5CF6`
  - Security Auditor: `#EF4444`

### Typography
- **UI Labels/Metadata:** *Geist* or *Inter*. Always `uppercase`, `text-[10px]`, `tracking-widest`.
- **Body/Transcript text:** *Geist* or *Inter*. `15px` size, `1.75` line-height.
- **Code Blocks:** *JetBrains Mono*, `13px` size.

### Effects & Animations
- **No Drop Shadows.** Use 1px borders for depth.
- **No Bouncing.** Use this exact Framer Motion transition for elements: `transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}`.
- **Input Field:** Must be a floating, frosted glass rectangle (`backdrop-filter: blur(16px); background: rgba(10, 10, 10, 0.6)`) positioned near the bottom of the Center Pane.

## 4. Frontend Implementation Rules
- Write functional React components using TypeScript interfaces for all props and state.
- Extract all API calls into a dedicated `api.ts` file or use a custom hook (`useBoardroom`).
- **Transcript Format:** Messages are rendered as a vertical script. Do NOT wrap messages in background-colored bubbles. Give Agent messages a `2px` left border in their semantic color with `16px` left padding. Give User messages a `1px` left border (`#A3A3A3`) and indent them (`ml-12`).
- Include the exact Metadata Header above every message: `[AGENT/USER NAME] • [HH:MM:SS]` in monospace gray.

## 5. Backend Implementation Rules
- Write clean, PEP-8 compliant Python code for the Flask backend.
- Group routes logically in `app.py` or use Flask Blueprints.
- **Dependency Management:** You must use `uv` for all Python tooling. 
  - Create the environment using: `uv venv`
  - Install packages using: `uv pip install <package>`
  - Generate the requirements file using: `uv pip freeze > requirements.txt`
- **Database Operations:** Use `supabase-py` exclusively for DB queries. Never store state in-memory on the server.
- **LLM Context:** When constructing the prompt for the LLM, always fetch the active agent's `system_prompt` from the DB and append the last 8 messages from the session for context.

## 6. Code Generation Workflow
When generating code, follow this sequence:
1. **Types/Schemas first:** Define TypeScript interfaces and database schemas before writing logic.
2. **Backend API second:** Implement and expose the Flask endpoints using `uv` for environment setup.
3. **Frontend UI third:** Build the static layout components using the strict color/typography guidelines.
4. **Integration last:** Connect the frontend to the backend and apply Framer Motion.

## 7. Strict Prohibitions (DO NOT DO THESE)
- ❌ Do not use emojis in the UI or in your code comments.
- ❌ Do not use `border-radius` larger than `4px` (no pill buttons, no rounded bubbles).
- ❌ Do not use `box-shadow` or neomorphic effects.
- ❌ Do not hardcode API keys or Supabase credentials. Always use `.env`.
- ❌ Do not use generic `console.log` statements in final production code.

Acknowledge these rules implicitly by writing code that conforms perfectly to this standard.