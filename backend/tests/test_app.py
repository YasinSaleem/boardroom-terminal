import app as app_module


def test_signup_requires_fields(client):
    response = client.post("/api/auth/signup", json={"email": ""})
    assert response.status_code == 400
    assert response.get_json()["error"] == "email and password are required"


def test_signup_success(client):
    response = client.post(
        "/api/auth/signup",
        json={"email": "new@example.com", "password": "pass123"},
    )
    data = response.get_json()
    assert response.status_code == 201
    assert data["user"]["email"] == "new@example.com"
    assert data["access_token"]


def test_login_success_and_invalid(client):
    client.post("/api/auth/signup", json={"email": "a@b.com", "password": "ok123"})

    success = client.post("/api/auth/login", json={"email": "a@b.com", "password": "ok123"})
    assert success.status_code == 200
    assert success.get_json()["access_token"]

    failure = client.post("/api/auth/login", json={"email": "a@b.com", "password": "wrong"})
    assert failure.status_code == 401


def test_me_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_success(client, auth_header):
    response = client.get("/api/auth/me", headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()["user"]["id"].startswith("user-")


def test_sessions_require_auth(client):
    response = client.get("/api/sessions")
    assert response.status_code == 401


def test_create_session_assigns_user(client, fake_supabase, auth_header):
    response = client.post("/api/sessions", headers=auth_header)
    payload = response.get_json()

    assert response.status_code == 201
    assert payload["user_id"] == "user-1"
    assert len(fake_supabase.db["sessions"]) == 1


def test_get_sessions_filtered_by_user(client, fake_supabase, auth_header):
    fake_supabase.db["sessions"] = [
        {"id": "s1", "title": "A", "user_id": "user-1", "updated_at": "2026-01-02"},
        {"id": "s2", "title": "B", "user_id": "user-2", "updated_at": "2026-01-03"},
    ]
    response = client.get("/api/sessions", headers=auth_header)
    data = response.get_json()

    assert response.status_code == 200
    assert len(data) == 1
    assert data[0]["id"] == "s1"


def test_get_messages_404_if_not_owner(client, fake_supabase, auth_header):
    fake_supabase.db["sessions"] = [{"id": "s1", "title": "A", "user_id": "other-user"}]
    response = client.get("/api/sessions/s1/messages", headers=auth_header)
    assert response.status_code == 404


def test_get_messages_success(client, fake_supabase, auth_header):
    fake_supabase.db["sessions"] = [{"id": "s1", "title": "A", "user_id": "user-1"}]
    fake_supabase.db["messages"] = [
        {"id": "m1", "session_id": "s1", "role": "user", "content": "hello", "agent_id": None, "created_at": "2026-01-01"}
    ]

    response = client.get("/api/sessions/s1/messages", headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()[0]["id"] == "m1"


def test_get_agents_success(client, auth_header):
    response = client.get("/api/agents", headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()[0]["name"] == "Senior Architect"


def test_chat_requires_required_payload(client, auth_header):
    response = client.post("/api/chat", json={}, headers=auth_header)
    assert response.status_code == 400


def test_chat_404_when_session_not_owned(client, fake_supabase, auth_header):
    fake_supabase.db["sessions"] = [{"id": "s1", "title": "A", "user_id": "other-user"}]
    response = client.post(
        "/api/chat",
        headers=auth_header,
        json={"session_id": "s1", "agent_id": "agent-1", "message": "hello"},
    )
    assert response.status_code == 404


def test_chat_404_when_agent_missing(client, fake_supabase, auth_header):
    fake_supabase.db["sessions"] = [{"id": "s1", "title": "A", "user_id": "user-1"}]
    fake_supabase.db["agents"] = []

    response = client.post(
        "/api/chat",
        headers=auth_header,
        json={"session_id": "s1", "agent_id": "agent-1", "message": "hello"},
    )
    assert response.status_code == 404


def test_chat_success_persists_messages(client, fake_supabase, auth_header):
    fake_supabase.db["sessions"] = [{"id": "s1", "title": "A", "user_id": "user-1"}]

    response = client.post(
        "/api/chat",
        headers=auth_header,
        json={"session_id": "s1", "agent_id": "agent-1", "message": "hello"},
    )

    payload = response.get_json()
    assert response.status_code == 200
    assert payload["message"]["role"] == "assistant"
    assert payload["message"]["content"] == "Generated response"

    # one user message + one assistant message persisted
    assert len(fake_supabase.db["messages"]) == 2


def test_normalize_user_supports_dict_and_object():
    from types import SimpleNamespace

    user_from_dict = app_module._normalize_user({"id": "u1", "email": "d@example.com"})
    user_from_obj = app_module._normalize_user(SimpleNamespace(id="u2", email="o@example.com"))

    assert user_from_dict == {"id": "u1", "email": "d@example.com"}
    assert user_from_obj == {"id": "u2", "email": "o@example.com"}
