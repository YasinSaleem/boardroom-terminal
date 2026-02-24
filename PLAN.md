# Product Requirements Document (PRD): "The Boardroom"

## 1. Executive Summary
**Product Name:** The Boardroom
**Objective:** Build a multi-agent strategy hub where users consult with specialized AI personas (Architect, Product Manager, Security Auditor) within persistent, discrete conversation sessions.
**Design Philosophy:** "Bespoke Intelligence Terminal." We are abandoning traditional chat bubbles. The interface should feel like a high-end Bloomberg Terminal merged with a classified corporate dossier—sleek, highly typographic, sharp edges, and deeply professional. 
**Tech Stack:**
*   **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, Radix UI (for unstyled accessible primitives), `react-markdown`.
*   **Backend:** Python 3.11, Flask, Supabase-py.
*   **Database:** Supabase (PostgreSQL).
*   **AI:** OpenAI or Anthropic API.

---

## 2. Unconventional UI/UX Specifications (The "Anti-Vibe-Code")
To avoid the standard "bubbly vibe-coded web app" aesthetic, we will use a strict, grid-based, editorial approach. 

### 2.1 The 3-Pane "Command" Layout
Instead of a simple sidebar/chat layout, the app uses a 3-pane grid (100vw, 100vh, `overflow: hidden`):
1.  **Left Pane (20% width): "Dossiers"** - Session history. Clean, purely typographic list of past sessions ordered by date.
2.  **Center Pane (60% width): "The Transcript"** - The active conversation. Messages are rendered as an editorial transcript, *not* chat bubbles. 
3.  **Right Pane (20% width): "The Roster"** - Displays the currently active agent, their system status, their role description, and a subtle pulsing indicator when they are "processing."

### 2.2 Color Theory: "Midnight Obsidian"
*   **Background Base:** `#050505` (Deepest Onyx) - with a CSS SVG noise/grain overlay (`opacity: 0.03`) for physical texture.
*   **Surface / Panes:** `#0A0A0A` (Slightly elevated dark).
*   **Dividers / Hairlines:** `rgba(255, 255, 255, 0.08)` - strictly 1px. No drop shadows.
*   **Typography:**
    *   *Primary:* `#EDEDED` (Soft White).
    *   *Metadata/Muted:* `#737373` (Neutral Gray).
*   **Semantic Agent Accents** (Used strictly as 2px left-borders on messages and tiny status dots, never as background fills):
    *   *The User:* `#A3A3A3` (Neutral Silver)
    *   *Senior Architect:* `#3B82F6` (Electric Cobalt)
    *   *Product Manager:* `#8B5CF6` (Deep Amethyst)
    *   *Security Auditor:* `#EF4444` (Crimson Alert)

### 2.3 Typography & Spacing
*   **UI/Metadata Font:** *Geist* or *Inter*. Labels must be `uppercase`, `text-[10px]`, `tracking-widest`.
*   **Content Font:** *Geist* or *Inter*. Reading size `15px`, leading (line-height) `1.75`.
*   **Code Blocks Font:** *JetBrains Mono*. Font size `13px`.
*   **Border Radius:** Strictly `2px` or `4px`. No pill-shaped buttons or rounded chat bubbles.

### 2.4 Elegant CSS Effects & Transitions
*   **Film Grain Overlay:** A global fixed `div` with `pointer-events: none` and an SVG noise background filter to give the app a matte, physical display feel.
*   **Transcript Entrance:** `Framer Motion` stagger effects. When a new message appears:
    *   `initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}`
    *   `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
    *   `transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}` (Custom spring-like ease, no bounce).
*   **Floating Command Bar:** The input area is not fixed to the screen edges. It is a floating, frosted glass rectangle (`backdrop-filter: blur(16px); background: rgba(10, 10, 10, 0.6)`) positioned 24px above the bottom of the Center Pane.

### 2.5 Message Formatting (Transcript Style)
*   **Agent Message:** Full width of the container. No background color. A 2px solid border on the left using the Agent's semantic color. Padding-left: 16px.
*   **User Message:** Full width, slightly indented from the left (e.g., `ml-12`). No background color. A 1px solid border on the left using neutral silver. 
*   **Metadata Header:** Above every message block: `[AGENT NAME] • [HH:MM:SS:MS]` in monospace gray text.

---

## 3. Database Schema (Supabase / PostgreSQL)
*CLI Agent Instruction: Execute this exactly in the Supabase SQL Editor.*

```sql
-- Agents Table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role_description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    color_hex VARCHAR(7) NOT NULL
);

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'New Session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL, -- Null implies it's a User message
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Seed Agents
INSERT INTO agents (name, role_description, system_prompt, color_hex) VALUES 
('Senior Architect', 'System design & scalable architecture expert.', 'You are a Senior Systems Architect. Speak with precision regarding infrastructure, scalability, and code structure.', '#3B82F6'),
('Product Manager', 'Vision, user flow, and feature prioritization.', 'You are a Product Manager. Focus on UX, user value, metrics, and go-to-market strategy.', '#8B5CF6'),
('Security Auditor', 'Vulnerability assessment & secure practices.', 'You are a strict Security Auditor. Hunt for vulnerabilities, auth flaws, and data leaks in the proposed ideas.', '#EF4444');
```

---

## 4. API Contract (Flask Backend)

**1. `GET /api/sessions`**
*   Returns: `[{ "id": "uuid", "title": "string", "updated_at": "iso-string" }]` (Order: updated_at DESC)

**2. `POST /api/sessions`**
*   Returns: `{ "id": "new-uuid", "title": "New Session" }`

**3. `GET /api/sessions/<session_id>/messages`**
*   Returns: `[{ "id": "uuid", "role": "user|assistant", "content": "string", "agent_id": "uuid|null", "created_at": "iso-string" }]` (Order: created_at ASC)

**4. `GET /api/agents`**
*   Returns: `[{ "id": "uuid", "name": "string", "role_description": "string", "color_hex": "string" }]`

**5. `POST /api/chat`**
*   *Payload:* `{ "session_id": "uuid", "agent_id": "uuid", "message": "string" }`
*   *Process:* 
    1. Save user message to DB.
    2. Fetch agent's `system_prompt`. Fetch last 8 messages of `session_id` for context.
    3. Invoke LLM (OpenAI/Anthropic).
    4. Save assistant response to DB linking the `agent_id`.
    5. Update session `updated_at`.
*   *Returns:* `{ "message": { "id": "uuid", "role": "assistant", "content": "string", "agent_id": "uuid" } }`

---

## 5. CLI Agent Implementation Guide
*CLI Coding Agent: Read this step-by-step sequence. Do not deviate. Build incrementally.*

### Phase 1: Directory Structure & Init
1.  Initialize a monolithic repository.
    *   `/frontend`: `npm create vite@latest . -- --template react-ts`. Install `tailwindcss`, `framer-motion`, `lucide-react`, `react-markdown`, `axios`.
    *   `/backend`: Python virtual environment. Install `flask`, `flask-cors`, `supabase`, `openai` (or `anthropic`), `python-dotenv`.
2.  Setup `.env` files in both directories (Supabase URLs, API Keys).

### Phase 2: Backend Development (Python/Flask)
1.  Create `app.py`.
2.  Initialize Supabase client using `supabase-py`.
3.  Implement the 5 API routes exactly as defined in Section 4.
4.  Ensure CORS is configured to allow requests from the Vite frontend (port 5173).
5.  Test the AI call logic. Use a generic system prompt if the DB fetch fails temporarily, but ensure DB connection is robust.

### Phase 3: Frontend Layout & Theming (React/Tailwind)
1.  **Global CSS (`index.css`):** Set background to `#050505`, text to `#EDEDED`. Add the noise texture class:
    ```css
    .bg-noise {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      opacity: 0.03; pointer-events: none; position: fixed; inset: 0; z-index: 50;
    }
    ```
2.  **Layout Component:** Build the 3-pane CSS Grid layout (`grid-cols-[280px_1fr_280px]`). Apply `border-r border-white/10` to the left pane, and `border-l border-white/10` to the right pane.

### Phase 4: State & Components
1.  **State Management:** Create a custom hook `useBoardroom` to manage `sessions`, `activeSessionId`, `messages`, `agents`, `activeAgentId`, and `isTyping`.
2.  **Left Pane (`Dossiers.tsx`):** Map sessions. Style as a minimalist file directory.
3.  **Right Pane (`TheRoster.tsx`):** Map agents. Allow user to click an agent to set `activeAgentId`. When clicked, the agent's details (Role, System Status) occupy the pane.
4.  **Center Pane (`Transcript.tsx`):**
    *   Map over `messages`.
    *   Apply the `react-markdown` component to the `content`.
    *   Style message blocks strictly according to Section 2.5.
5.  **The Input (`CommandBar.tsx`):**
    *   A floating `div` positioned absolute/fixed at the bottom of the Center Pane.
    *   Contains a subtle indicator showing "Addressing: [Active Agent Name]" in the Agent's semantic color.
    *   A bare `textarea` that auto-expands (no default browser borders or outlines: `focus:ring-0 focus:outline-none bg-transparent`).
    *   A minimalist SVG send icon (Lucide `ArrowRight`) that turns white when text is entered, otherwise dark gray.

### Phase 5: Integration & Polish
1.  Wire the `CommandBar` submit action to trigger `POST /api/chat`.
2.  Implement optimistic UI updates (append user message instantly, show a subtle blinking cursor or "..." for the agent response).
3.  Wrap message list items in Framer Motion `<motion.div>` using the specific spring transition defined in Section 2.4.
4.  Ensure auto-scroll to the bottom of the transcript when a new message arrives.