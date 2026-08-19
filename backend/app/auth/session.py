import secrets
from datetime import datetime, timedelta, timezone


_sessions: dict[str, dict] = {}


def create_session(
    user: dict,
    token_data: dict,
) -> tuple[str, dict]:
    session_id = secrets.token_urlsafe(32)

    expires_in = token_data.get("expires_in", 28800)

    _sessions[session_id] = {
        "user": user,
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token"),
        "expires_at": datetime.now(timezone.utc)
        + timedelta(seconds=expires_in),
    }

    return session_id, _sessions[session_id]


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def delete_session(session_id: str) -> None:
    _sessions.pop(session_id, None)