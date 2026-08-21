import base64
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv

load_dotenv()

GITLAB_AUTHORIZE_URL = (
    "https://gitlab.com/oauth/authorize"
)

GITLAB_TOKEN_URL = (
    "https://gitlab.com/oauth/token"
)

GITLAB_USER_URL = (
    "https://gitlab.com/api/v4/user"
)

GITLAB_REDIRECT_URI = os.getenv(
    "GITLAB_REDIRECT_URI",
    "http://localhost:8000/auth/gitlab/callback",
)

_gitlab_oauth_states: dict[str, dict] = {}

OAUTH_STATE_EXPIRY_SECONDS = 600


def create_gitlab_pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)

    digest = hashlib.sha256(
        verifier.encode("ascii")
    ).digest()

    challenge = (
    base64.urlsafe_b64encode(digest)
    .rstrip(b"=")
    .decode("ascii")
)

    return verifier, challenge


def create_gitlab_oauth_state(
    code_verifier: str,
) -> str:
    state = secrets.token_urlsafe(32)

    _gitlab_oauth_states[state] = {
        "code_verifier": code_verifier,
        "expires_at": (
            datetime.now(timezone.utc)
            + timedelta(
                seconds=OAUTH_STATE_EXPIRY_SECONDS
            )
        ),
    }

    return state


def consume_gitlab_oauth_state(
    state: str,
) -> str | None:
    data = _gitlab_oauth_states.pop(
        state,
        None,
    )

    if not data:
        return None

    if (
        datetime.now(timezone.utc)
        >= data["expires_at"]
    ):
        return None

    return data["code_verifier"]


def get_gitlab_login_url(
    state: str,
    code_challenge: str,
) -> str:
    client_id = os.getenv(
        "GITLAB_CLIENT_ID"
    )

    if not client_id:
        raise RuntimeError(
            "GITLAB_CLIENT_ID is not configured"
        )

    params = {
        "client_id": client_id,
        "redirect_uri": GITLAB_REDIRECT_URI,
        "response_type": "code",
        "state": state,
        "scope": "read_user",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    return (
        f"{GITLAB_AUTHORIZE_URL}?{urlencode(params)}"
    )


async def exchange_gitlab_code_for_token(
    code: str,
    code_verifier: str,
) -> dict:
    client_id = os.getenv(
        "GITLAB_CLIENT_ID"
    )

    client_secret = os.getenv(
        "GITLAB_CLIENT_SECRET"
    )

    if not client_id:
        raise RuntimeError(
            "GITLAB_CLIENT_ID is not configured"
        )

    if not client_secret:
        raise RuntimeError(
            "GITLAB_CLIENT_SECRET is not configured"
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITLAB_TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GITLAB_REDIRECT_URI,
                "code_verifier": code_verifier,
            },
            headers={
                "Accept": "application/json",
            },
        )

    response.raise_for_status()

    data = response.json()

    access_token = data.get(
        "access_token"
    )

    if not access_token:
        raise RuntimeError(
            "GitLab did not return an access token"
        )

    return data


async def get_gitlab_user(
    access_token: str,
) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GITLAB_USER_URL,
            headers={
                "Authorization": (
                    f"Bearer {access_token}"
                ),
                "Accept": "application/json",
            },
        )

    response.raise_for_status()

    return response.json()