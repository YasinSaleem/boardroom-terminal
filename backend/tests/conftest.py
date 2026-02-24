import os
import sys
from types import SimpleNamespace
from pathlib import Path

import pytest

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "sb_secret_test")
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as app_module


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeAuth:
    def __init__(self):
        self._users_by_email = {}
        self._tokens = {}
        self._counter = 0

    def _new_user(self, email: str, password: str):
        self._counter += 1
        user = {"id": f"user-{self._counter}", "email": email, "password": password}
        self._users_by_email[email] = user
        return user

    def seed_user(self, email: str = "user@example.com", password: str = "pass123"):
        user = self._users_by_email.get(email) or self._new_user(email, password)
        token = f"token-{user['id']}"
        self._tokens[token] = user
        return user, token

    def sign_up(self, payload):
        email = payload["email"].strip().lower()
        password = payload["password"]
        if email in self._users_by_email:
            raise Exception("already exists")
        user = self._new_user(email, password)
        token = f"token-{user['id']}"
        self._tokens[token] = user
        return SimpleNamespace(
            user=SimpleNamespace(id=user["id"], email=user["email"]),
            session=SimpleNamespace(access_token=token),
        )

    def sign_in_with_password(self, payload):
        email = payload["email"].strip().lower()
        password = payload["password"]
        user = self._users_by_email.get(email)
        if not user or user["password"] != password:
            raise Exception("invalid credentials")
        token = f"token-{user['id']}"
        self._tokens[token] = user
        return SimpleNamespace(
            user=SimpleNamespace(id=user["id"], email=user["email"]),
            session=SimpleNamespace(access_token=token),
        )

    def get_user(self, token):
        user = self._tokens.get(token)
        if not user:
            raise Exception("invalid token")
        return SimpleNamespace(user=SimpleNamespace(id=user["id"], email=user["email"]))


class FakeQuery:
    def __init__(self, supabase, table_name):
        self.supabase = supabase
        self.table_name = table_name
        self._op = "select"
        self._columns = "*"
        self._filters = []
        self._order = None
        self._limit = None
        self._payload = None

    def select(self, columns):
        self._op = "select"
        self._columns = columns
        return self

    def eq(self, field, value):
        self._filters.append((field, value))
        return self

    def order(self, field, desc=False):
        self._order = (field, desc)
        return self

    def limit(self, value):
        self._limit = value
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def _matches(self, row):
        for field, value in self._filters:
            if row.get(field) != value:
                return False
        return True

    def _project(self, rows):
        if self._columns == "*":
            return [dict(row) for row in rows]
        keys = [key.strip() for key in self._columns.split(",")]
        return [{key: row.get(key) for key in keys} for row in rows]

    def execute(self):
        rows = self.supabase.db[self.table_name]

        if self._op == "insert":
            payload_rows = self._payload if isinstance(self._payload, list) else [self._payload]
            inserted = []
            for payload in payload_rows:
                row = dict(payload)
                row.setdefault("id", f"{self.table_name}-{len(rows) + 1}")
                if self.table_name == "sessions":
                    row.setdefault("created_at", "2026-01-01T00:00:00Z")
                    row.setdefault("updated_at", "2026-01-01T00:00:00Z")
                if self.table_name == "messages":
                    row.setdefault("created_at", "2026-01-01T00:00:00Z")
                rows.append(row)
                inserted.append(dict(row))
            return FakeResult(inserted)

        if self._op == "update":
            updated = []
            for row in rows:
                if self._matches(row):
                    row.update(self._payload)
                    updated.append(dict(row))
            return FakeResult(updated)

        selected = [row for row in rows if self._matches(row)]
        if self._order:
            key, desc = self._order
            selected = sorted(selected, key=lambda x: x.get(key), reverse=desc)
        if self._limit is not None:
            selected = selected[: self._limit]
        return FakeResult(self._project(selected))


class FakeSupabase:
    def __init__(self):
        self.auth = FakeAuth()
        self.db = {
            "agents": [
                {
                    "id": "agent-1",
                    "name": "Senior Architect",
                    "role_description": "System design",
                    "system_prompt": "You are an architect",
                    "color_hex": "#3B82F6",
                }
            ],
            "sessions": [],
            "messages": [],
        }

    def table(self, table_name):
        return FakeQuery(self, table_name)


class FakeOpenAIClient:
    def __init__(self):
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="Generated response"))],
            usage=SimpleNamespace(total_tokens=42),
        )


@pytest.fixture
def fake_supabase():
    return FakeSupabase()


@pytest.fixture
def client(monkeypatch, fake_supabase):
    monkeypatch.setattr(app_module, "supabase", fake_supabase)
    monkeypatch.setattr(app_module, "openai_client", FakeOpenAIClient())
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def auth_header(fake_supabase):
    _, token = fake_supabase.auth.seed_user()
    return {"Authorization": f"Bearer {token}"}
