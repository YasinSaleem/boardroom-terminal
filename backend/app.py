import logging
import os
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from openai import OpenAI
from supabase import Client, create_client

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG,
    format="[%(asctime)s] %(levelname)-8s %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("boardroom")

# Quieten noisy third-party loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("hpack").setLevel(logging.WARNING)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
env_path = Path(__file__).parent.parent / ".env"
loaded = load_dotenv(dotenv_path=env_path, override=True)
log.info("Loaded .env from %s: %s", env_path, loaded)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")

log.info("SUPABASE_URL  : %s", SUPABASE_URL or "[NOT SET]")
log.info("SUPABASE_KEY  : %s", ("SET (" + SUPABASE_KEY[:12] + "...)") if SUPABASE_KEY else "[NOT SET]")
log.info("OPENROUTER_KEY: %s", ("SET (" + OPENROUTER_KEY[:12] + "...)") if OPENROUTER_KEY else "[NOT SET]")
log.info("MODEL         : %s", OPENROUTER_MODEL)

if SUPABASE_KEY.startswith("sb_publishable_"):
    log.warning(
        "SUPABASE_KEY appears to be publishable/anon; backend DB access may fail with 401/403 due to RLS."
    )
elif SUPABASE_KEY and not SUPABASE_KEY.startswith("sb_secret_"):
    log.warning("SUPABASE_KEY has an unexpected format. Expected sb_secret_... for backend use.")

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)
# Allow all origins in development; tighten this for production
CORS(app)

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    log.info("Supabase client initialised OK")
except Exception:
    log.exception("FATAL: failed to initialise Supabase client")
    raise

openai_client = OpenAI(api_key=OPENROUTER_KEY, base_url=OPENROUTER_BASE)
log.info("OpenRouter client initialised OK  base_url=%s", OPENROUTER_BASE)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def _token_from_auth_header() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    return token or None


def _normalize_user(raw_user: Any) -> dict[str, str] | None:
    if raw_user is None:
        return None

    if isinstance(raw_user, dict):
        user_id = raw_user.get("id")
        email = raw_user.get("email")
    else:
        user_id = getattr(raw_user, "id", None)
        email = getattr(raw_user, "email", None)

    if not user_id:
        return None
    return {"id": str(user_id), "email": str(email or "")}


def _require_user() -> tuple[dict[str, str] | None, tuple[Any, int] | None]:
    token = _token_from_auth_header()
    if not token:
        return None, (jsonify({"error": "Missing Bearer token"}), 401)

    try:
        auth_response = supabase.auth.get_user(token)
        raw_user = getattr(auth_response, "user", None)
        if raw_user is None and isinstance(auth_response, dict):
            raw_user = auth_response.get("user")

        user = _normalize_user(raw_user)
        if not user:
            return None, (jsonify({"error": "Invalid auth token"}), 401)

        return user, None
    except Exception:
        log.exception("Token validation failed")
        return None, (jsonify({"error": "Invalid auth token"}), 401)


def _session_owned_by_user(session_id: str, user_id: str) -> bool:
    result = (
        supabase.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return bool(result.data)


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    body = request.get_json(force=True)
    email: str = (body.get("email") or "").strip().lower()
    password: str = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    try:
        result = supabase.auth.sign_up({"email": email, "password": password})
        user = _normalize_user(getattr(result, "user", None))
        session = getattr(result, "session", None)
        access_token = getattr(session, "access_token", None) if session else None

        if not user:
            return jsonify({"error": "Signup failed"}), 400

        return jsonify({
            "user": user,
            "access_token": access_token,
            "requires_email_confirmation": access_token is None,
        }), 201
    except Exception:
        log.exception("Signup failed")
        return jsonify({"error": "Signup failed"}), 400


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json(force=True)
    email: str = (body.get("email") or "").strip().lower()
    password: str = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    try:
        result = supabase.auth.sign_in_with_password({"email": email, "password": password})
        user = _normalize_user(getattr(result, "user", None))
        session = getattr(result, "session", None)
        access_token = getattr(session, "access_token", None) if session else None

        if not user or not access_token:
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({"user": user, "access_token": access_token}), 200
    except Exception:
        log.exception("Login failed")
        return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/auth/me", methods=["GET"])
def me():
    user, auth_error = _require_user()
    if auth_error:
        return auth_error
    return jsonify({"user": user}), 200

# ---------------------------------------------------------------------------
# Request lifecycle logging
# ---------------------------------------------------------------------------
@app.before_request
def _start_timer():
    g.t0 = time.perf_counter()


@app.after_request
def _log_request(response):
    elapsed_ms = (time.perf_counter() - g.t0) * 1000
    log.info(
        "%s %s  ->  %d  (%.1f ms)",
        request.method,
        request.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.errorhandler(Exception)
def _handle_unhandled(exc):
    log.error("Unhandled exception on %s %s\n%s", request.method, request.path, traceback.format_exc())
    return jsonify({"error": "Internal server error", "detail": str(exc)}), 500


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    user, auth_error = _require_user()
    if auth_error:
        return auth_error

    try:
        result = (
            supabase.table("sessions")
            .select("id, title, updated_at")
            .eq("user_id", user["id"])
            .order("updated_at", desc=True)
            .execute()
        )
        log.debug("GET /api/sessions  rows=%d", len(result.data))
        return jsonify(result.data), 200
    except Exception:
        log.exception("Error fetching sessions")
        return jsonify({"error": "Failed to fetch sessions"}), 500


@app.route("/api/sessions", methods=["POST"])
def create_session():
    user, auth_error = _require_user()
    if auth_error:
        return auth_error

    try:
        result = (
            supabase.table("sessions")
            .insert({"title": "New Session", "user_id": user["id"]})
            .execute()
        )
        log.debug("POST /api/sessions  id=%s", result.data[0].get("id"))
        return jsonify(result.data[0]), 201
    except Exception:
        log.exception("Error creating session")
        return jsonify({"error": "Failed to create session"}), 500


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------
@app.route("/api/sessions/<session_id>/messages", methods=["GET"])
def get_messages(session_id: str):
    user, auth_error = _require_user()
    if auth_error:
        return auth_error

    try:
        if not _session_owned_by_user(session_id=session_id, user_id=user["id"]):
            return jsonify({"error": "Session not found"}), 404

        result = (
            supabase.table("messages")
            .select("id, role, content, agent_id, created_at")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        log.debug("GET messages  session=%s  rows=%d", session_id, len(result.data))
        return jsonify(result.data), 200
    except Exception:
        log.exception("Error fetching messages for session %s", session_id)
        return jsonify({"error": "Failed to fetch messages"}), 500


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------
@app.route("/api/agents", methods=["GET"])
def get_agents():
    user, auth_error = _require_user()
    if auth_error:
        return auth_error

    try:
        result = (
            supabase.table("agents")
            .select("id, name, role_description, color_hex")
            .execute()
        )
        log.debug("GET /api/agents  rows=%d", len(result.data))
        return jsonify(result.data), 200
    except Exception:
        log.exception("Error fetching agents")
        return jsonify({"error": "Failed to fetch agents"}), 500


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def chat():
    user, auth_error = _require_user()
    if auth_error:
        return auth_error

    body = request.get_json(force=True)
    session_id: str = body.get("session_id", "")
    agent_id: str = body.get("agent_id", "")
    user_message: str = body.get("message", "")

    if not session_id or not agent_id or not user_message.strip():
        return jsonify({"error": "session_id, agent_id, and message are required"}), 400

    log.info("CHAT  session=%s  agent=%s  msg_len=%d", session_id, agent_id, len(user_message))

    try:
        if not _session_owned_by_user(session_id=session_id, user_id=user["id"]):
            return jsonify({"error": "Session not found"}), 404

        # 1. Persist user message
        supabase.table("messages").insert({
            "session_id": session_id,
            "agent_id": None,
            "role": "user",
            "content": user_message,
        }).execute()
        log.debug("User message persisted")

        # 2. Fetch agent system prompt
        agent_result = (
            supabase.table("agents")
            .select("system_prompt, name")
            .eq("id", agent_id)
            .limit(1)
            .execute()
        )
        if not agent_result.data:
            log.warning("Agent not found: %s", agent_id)
            return jsonify({"error": "Agent not found"}), 404

        agent_name: str = agent_result.data[0]["name"]
        system_prompt: str = agent_result.data[0]["system_prompt"]
        log.debug("Using agent: %s", agent_name)

        # 3. Fetch last 8 messages for context
        history_result = (
            supabase.table("messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(8)
            .execute()
        )
        history = list(reversed(history_result.data))
        log.debug("Context window: %d messages", len(history))

        # 4. Build LLM messages
        llm_messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            llm_messages.append({"role": msg["role"], "content": msg["content"]})

        # 5. Call OpenRouter
        log.info("Calling OpenRouter  model=%s  messages=%d", OPENROUTER_MODEL, len(llm_messages))
        completion = openai_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=llm_messages,
        )
        assistant_content: str = completion.choices[0].message.content
        log.info("OpenRouter response  tokens=%s  len=%d",
                 getattr(completion.usage, "total_tokens", "?"), len(assistant_content))

        # 6. Persist assistant message
        insert_result = supabase.table("messages").insert({
            "session_id": session_id,
            "agent_id": agent_id,
            "role": "assistant",
            "content": assistant_content,
        }).execute()
        log.debug("Assistant message persisted  id=%s", insert_result.data[0].get("id"))

        # 7. Touch session updated_at
        now_utc = datetime.now(timezone.utc).isoformat()
        supabase.table("sessions").update({"updated_at": now_utc}).eq("id", session_id).eq("user_id", user["id"]).execute()

    except Exception:
        log.exception("Error in /api/chat")
        return jsonify({"error": "Chat request failed"}), 500

    saved_message = insert_result.data[0]
    return jsonify({
        "message": {
            "id": saved_message["id"],
            "role": "assistant",
            "content": assistant_content,
            "agent_id": agent_id,
        }
    }), 200


if __name__ == "__main__":
    log.info("Starting Boardroom API on port 5000")
    app.run(debug=True, port=5000)
